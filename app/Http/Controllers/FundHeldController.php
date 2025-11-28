<?php
namespace App\Http\Controllers;

use App\Models\FundHeld;
use App\Models\Fund;

use App\Models\FundHead;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
class FundHeldController extends Controller
{
    public function index(Request $request)
    {
        $query = FundHeld::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');

        $query->where('institute_id', $inst_id)->with('FundHead');
        if ($request->search) {
 $query->whereHas('FundHead', function ($q) use ($request) {
            $q->where('name', 'like', '%' . $request->search . '%');
        });        }

        $funds = $query->with('FundHead')->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('fund-add'),
        'can_edit'   => auth()->user()->can('fund-edit'),
        'can_delete' => auth()->user()->can('fund-delete'),
    ];
        return Inertia::render('funds/Index', [
            'funds' => $funds,
            'filters' => ['search' => $request->search ?? ''],
            'permissions'=>$permissions,
        ]);
    }

    public function create()
    {
         if(!auth()->user()->can('fund-add')){
            abort(403);
        }
         $fundHeads = FundHead::select('id', 'name')->get();
      
        return Inertia::render('funds/Form', ['fund' => null,
    'fundHeads'=>$fundHeads]);
    }
public function store(Request $request)
{
    try {
        $data = $request->validate([
            'balance' => 'required|numeric',
            'fund_head_id' => 'required|numeric',
             'description' => 'required|string',
             'transaction_type' => 'required|string',
        ]);
$balance=$data['balance'];
        // Add authenticated user ID and institute_id from session
        $data['added_by'] = auth()->id();
        $data['institute_id'] = session('sms_inst_id');

        // Find existing FundHeld record
        $fundHeld = FundHeld::where('fund_head_id', $data['fund_head_id'])
            ->where('institute_id', $data['institute_id'])
            ->first();

        if ($fundHeld) {
            // Update existing FundHeld record
            if($data['transaction_type']=='in'){
                $data['balance'] = $fundHeld->balance + $data['balance'];
            }else{
                $data['balance'] = $fundHeld->balance - $data['balance'];
            }
            $fundHeld->update($data);
            
            Fund::Create(
                [
                    'fund_head_id' => $data['fund_head_id'],
                    'institute_id' => $data['institute_id'],
               
                    'amount' => $balance,
                    'added_by' => $data['added_by'],
                    'added_date' => now(), // or use your specific date field
                    'status' => 'Approved', // set appropriate status
                    'type' => $data['transaction_type'], // set appropriate type
                    'description' => $data['description']
                ]
            );
            
            $message = 'Fund updated successfully.';
        } else {
            // Create new FundHeld record
            $fundHeld = FundHeld::create($data);
            
           Fund::Create(
                [
                    'fund_head_id' => $data['fund_head_id'],
                    'institute_id' => $data['institute_id'],
                
                    'amount' => $balance,
                    'added_by' => $data['added_by'],
                    'added_date' => now(), // or use your specific date field
                    'status' => 'Approved', // set appropriate status
                    'type' => $data['transaction_type'], // set appropriate type
                    'description' => $data['description']// optional description
                ]
            );
            
            
            $message = 'Fund saved successfully.';
        }

        return redirect()->back()->with('success', $message);

    } catch (\Illuminate\Validation\ValidationException $e) {
        // Return validation errors to the frontend
        return back()->withErrors($e->validator->errors())->withInput();
    } catch (\Exception $e) {
        // Handle any unexpected errors
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
            if (!auth()->user()->can('fund-add')) {
                abort(403, 'Unauthorized action.');
            }

            // Validate request data
            $validatedData = $request->validate([
                'balance' => 'required|numeric',
                'fund_head_id' => 'required|numeric',
          
            ]);
//dd($validatedData,$fund);
            // Add the authenticated user's ID to the data
            // Update the fund
            $fund->update($validatedData);

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
