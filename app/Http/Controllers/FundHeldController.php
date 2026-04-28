<?php
namespace App\Http\Controllers;

use App\Models\FundHeld;
use App\Models\Fund;

use App\Models\FundHead;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
class FundHeldController extends Controller
{
    public function index(Request $request)
    {
        $query = FundHeld::with('institute');
        $inst_id = session('sms_inst_id');
        $type = session('type');

        $query->where('institute_id', $inst_id)->with('FundHead');
        if ($request->search) {
            $query->whereHas('FundHead', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        $funds = $query->with('FundHead')->paginate(10)->withQueryString();

        // Load bank statements for the current institute
        $bankStatementsRaw = \App\Models\BankStatement::where('institute_id', $inst_id)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'institute_id', 'image', 'created_at']);

        $bankStatements = $bankStatementsRaw->groupBy('institute_id')->map(function ($items) {
            return $items->map(function ($item) {
                return [
                    'id'          => $item->id,
                    'image'       => $item->image,
                    'uploaded_at' => $item->created_at->toISOString(),
                ];
            })->values();
        })->toArray();

        $permissions = [
            'can_add'    => auth()->user()->can('fund-add'),
            'can_edit'   => auth()->user()->can('fund-edit'),
            'can_delete' => auth()->user()->can('fund-delete'),
        ];

        // Fetch data for Transfer modal
        $fundHeads = FundHead::get(['id', 'name', 'type']);
        $myInstitute = \App\Models\Institute::find($inst_id);
        $regionalOffice = null;
        if ($myInstitute && $myInstitute->region_id) {
            $regionalOffice = \App\Models\Institute::where('region_id', $myInstitute->region_id)
                                       ->where('type', 'Regional Office')
                                       ->first(['id', 'name']);
        }
        $ownBalances = FundHeld::with('fundHead')->where('institute_id', $inst_id)->get();

        return Inertia::render('funds/Index', [
            'funds'           => $funds,
            'filters'         => ['search' => $request->search ?? ''],
            'permissions'     => $permissions,
            'bankStatements'  => $bankStatements,
            'instituteId'     => $inst_id,
            'fundHeads'       => $fundHeads,
            'regionalOffice'  => $regionalOffice,
            'ownBalances'     => $ownBalances,
        ]);
    }


    public function create()
    {
         if(!auth()->user()->can('fund-add')){
            abort(403);
        }
      $fundHeads = FundHead::select(
        'fund_heads.id',
        'fund_heads.name',
        DB::raw('COALESCE(fund_helds.balance, 0) as balance')
    )
    ->leftJoin('fund_helds', function ($join) {
        $join->on('fund_heads.id', '=', 'fund_helds.fund_head_id')
             ->where('fund_helds.institute_id', '=', session('sms_inst_id'));
    })
    ->get();
      
        return Inertia::render('funds/Form', ['fund' => null,
    'fundHeads'=>$fundHeads]);
    }
public function store(Request $request)
{
    try {
        $request->validate([
            'transaction_type'     => 'required|string|in:in,out',
            'date'                 => 'required|date',
            'heads'                => 'required|array|min:1',
            'heads.*.fund_head_id' => 'required|numeric|exists:fund_heads,id',
            'heads.*.amount'       => 'required|numeric|min:0.01',
            'heads.*.description'  => 'nullable|string',
        ]);

        $addedBy     = auth()->id();
        $instituteId = session('sms_inst_id');
           $date        = \Carbon\Carbon::now()->format('Y-m-d');
        $type        = $request->transaction_type;
        $status      = 'Approved';

        DB::transaction(function () use ($request, $addedBy, $instituteId, $date, $type, $status) {
            foreach ($request->heads as $head) {
                // Find existing FundHeld record
                $fundHeld = FundHeld::where('fund_head_id', $head['fund_head_id'])
                    ->where('institute_id', $instituteId)->with('fundHead')
                    ->first();

                // Update overall FundHeld balance
                if ($fundHeld) {
                    if ($type == 'in') {
                        $newOverallBalance = $fundHeld->balance + $head['amount'];
                    } else {
                        if($fundHeld->balance < $head['amount']){
                            throw new \Exception('Insufficient_balance in '.$fundHeld->fundHead->name);
                        }
                        $newOverallBalance = $fundHeld->balance - $head['amount'];
                    }
                    $fundHeld->update(['balance' => $newOverallBalance]);
                } else {
                    if ($type == 'out') {
                        throw new \Exception('Insufficient_balance');
                    }
                    $newOverallBalance = $type == 'in' ? $head['amount'] : -$head['amount'];
                    FundHeld::create([
                        'fund_head_id' => $head['fund_head_id'],
                        'institute_id' => $instituteId,
                        'balance'      => $newOverallBalance,
                        'added_by'     => $addedBy,
                    ]);
                }

                // Calculate balance for this specific transaction
                $previousTransaction = Fund::where('fund_head_id', $head['fund_head_id'])
                    ->where('institute_id', $instituteId)
                    ->where('approved_date', '<=',  $request->date)
                    ->orderBy('approved_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->first();

                $transactionBalance = 0;
                if ($previousTransaction) {
                    $transactionBalance = $previousTransaction->balance;
                }
                
                if ($type == 'in') {
                    $transactionBalance += $head['amount'];
                } else {
                    $transactionBalance -= $head['amount'];
                }

                // Create Transaction record in 'funds' table
                Fund::create([
                    'fund_head_id'  => $head['fund_head_id'],
                    'institute_id'  => $instituteId,
                    'amount'        => $head['amount'],
                    'added_by'      => $addedBy,
                    'added_date'    => $date,
                    'status'        => $status,
                    'type'          => $type,
                    'description'   => $head['description'] ?? null,
                    'trans_type'    => 'funds',
                    'approve_by'    => $status == 'Approved' ? $addedBy : null,
                    'approved_date' => $status == 'Approved' ?  $request->date : null,
                    'balance'       => $transactionBalance,
                ]);

                // Update balance of subsequent transactions
                $sign = $type == 'in' ? 1 : -1;
                $adjustment = $head['amount'] * $sign;

                Fund::where('fund_head_id', $head['fund_head_id'])
                    ->where('institute_id', $instituteId)
                    ->where('approved_date', '>', $request->date)
                       ->where('status', 'Approved')
                    ->update([
                        'balance' => DB::raw("balance + ($adjustment)")
                    ]);
            }
        });

        return redirect()->route('funds.index')->with('success', 'Fund transaction(s) saved successfully.');

    } catch (\Illuminate\Validation\ValidationException $e) {
        return back()->withErrors($e->validator->errors())->withInput();
    } catch (\Exception $e) {
        if ($e->getMessage() === 'Insufficient_balance') {
            return back()->with('error', 'Insufficient balance.');
        }
        return back()->with('error', 'An error occurred while processing the fund: ' . $e->getMessage());
    }
}
    public function edit(FundHeld $Fund)
    { if(!auth()->user()->can('fund-add')){
            abort(403);
        }
        //dd($Funds);
         $fundHeads = FundHead::select('id', 'name')->get()->values();;
        return Inertia::render('funds/Form', [
    'fund'=>$Fund,
    'fundHeads' => $fundHeads,]);
    } 
   public function update(Request $request, FundHeld $fund)
    {
        try {
            // Check if user has permission to update funds
            if (!auth()->user()->can('fund-edit')) {
                abort(403, 'Unauthorized action.');
            }

            // Validate request data
            $validatedData = $request->validate([
                'amount' => 'required|numeric',
            ]);

            // Update the fund
            $fund->update(['balance' => $validatedData['amount']]);

            // Return success response
          return redirect()->route('funds.index')->with('success',  'Fund updated successfully.');
         
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors to the frontend
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            // Handle any unexpected errors
            return back()->with('error', 'An error occurred while updating the fund: ' . $e->getMessage());
        }
    }
    public function destroy(FundHeld $Fund)
    { if(!auth()->user()->can('fund-delete')){
            abort(403);
        }
        $Fund->delete();   
        return redirect()->back()->with('success', 'Fund  deleted successfully.');
    }
}
