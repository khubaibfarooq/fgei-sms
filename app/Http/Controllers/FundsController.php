<?php

namespace App\Http\Controllers;

use App\Models\FundHeld;
use App\Models\Fund;
use App\Models\FundHead;
use App\Models\Institute;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FundsController extends Controller
{
    // --------------------------------------------------------------------- //
    // 1. LIST FUNDS (unchanged)
    // --------------------------------------------------------------------- //
    public function index(Request $request)
    {
        $query = Fund::with('institute');
        $inst_id = session('sms_inst_id');
        $type = session('type');

        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->where('institute_id', $inst_id);
        }

        $funds = $query->with('FundHead')->paginate(10)->withQueryString();

        $permissions = [
            'can_add'    => auth()->user()->can('fund-add'),
            'can_edit'   => auth()->user()->can('fund-edit'),
            'can_delete' => auth()->user()->can('fund-delete'),
        ];

        // Fetch data for Transfer modal
        $fundHeads = FundHead::get(['id', 'name', 'type']);
        $myInstitute = Institute::find($inst_id);
        $regionalOffice = null;
        if ($myInstitute && $myInstitute->region_id) {
            $regionalOffice = Institute::where('region_id', $myInstitute->region_id)
                                       ->where('type', 'Regional Office')
                                       ->first(['id', 'name']);
        }
        
        $ownBalances = FundHeld::with('fundHead')->where('institute_id', $inst_id)->get();

        return Inertia::render('funds/Index', [
            'funds'       => $funds,
            'filters'     => ['search' => $request->search ?? ''],
            'permissions' => $permissions,
            'fundHeads'   => $fundHeads,
            'regionalOffice' => $regionalOffice,
            'ownBalances' => $ownBalances,
        ]);
    }

    public function transfer(Request $request)
    {
        try {
            if (!auth()->user()->can('fund-add')) {
                abort(403);
            }

            $validated = $request->validate([
                'transfer_type' => 'required|in:Own Heads,Region',
                'from_head_id'  => 'required',
                'rows'          => 'required|array|min:1',
                'rows.*.head_id'=> 'required|numeric',
                'rows.*.amount' => 'required|numeric|min:0.01',
                'transfer_image'=> 'nullable|file|max:10240',
            ]);

            $inst_id = session('sms_inst_id');
            $userId  = auth()->id();
            $date    = now()->format('Y-m-d');

            $imagePath = null;
            if ($request->hasFile('transfer_image')) {
                $file = $request->file('transfer_image');
                $fileName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $dir = public_path('assets/funds');
                if (!file_exists($dir)) {
                    mkdir($dir, 0755, true);
                }
                $file->move($dir, $fileName);
                $imagePath = 'assets/funds/' . $fileName;
            }

            DB::transaction(function () use ($request, $inst_id, $userId, $date, $imagePath) {
                if ($request->transfer_type === 'Own Heads') {
                    foreach ($request->rows as $row) {
                        // OUT transaction from selected head
                        $outFund = Fund::create([
                            'fund_head_id' => $request->from_head_id,
                            'description'  => 'Transfer to ' . FundHead::find($row['head_id'])->name,
                            'amount'       => $row['amount'],
                            'type'         => 'out',
                            'added_date'   => $date,
                            'status'       => 'Approved',
                            'approved_date'=> now(),
                            'approve_by'   => $userId,
                            'added_by'     => $userId,
                            'institute_id' => $inst_id,
                            'tid'          => $inst_id,
                            'trans_type'   => 'transfer',
                            'img'          => $imagePath,
                        ]);

                        // IN transaction to row head
                        $inFund = Fund::create([
                            'fund_head_id' => $row['head_id'],
                            'description'  => 'Transfer from ' . FundHead::find($request->from_head_id)->name,
                            'amount'       => $row['amount'],
                            'type'         => 'in',
                            'added_date'   => $date,
                            'status'       => 'Approved',
                            'approved_date'=> now(),
                            'approve_by'   => $userId,
                            'added_by'     => $userId,
                            'institute_id' => $inst_id,
                            'tid'          => $inst_id,
                            'trans_type'   => 'transfer',
                            'img'          => $imagePath,
                        ]);

                        // Update balances
                        $this->updateFundBalance($inst_id, $request->from_head_id, -$row['amount'], $outFund);
                        $this->updateFundBalance($inst_id, $row['head_id'], $row['amount'], $inFund);
                    }
                } elseif ($request->transfer_type === 'Region') {
                    $myInstitute = Institute::find($inst_id);
                    $regionalOffice = Institute::where('region_id', $myInstitute->region_id)
                                               ->where('type', 'Regional Office')
                                               ->first();
                                               
                    if (!$regionalOffice) {
                        throw new \Exception('Regional Office not found for this institute.');
                    }
                    
                    foreach ($request->rows as $row) {
                        // OUT transaction for login institute
                        $outFund = Fund::create([
                            'fund_head_id' => $row['head_id'], // Pulls from row's institutional head
                            'description'  => 'Transfer to Regional ' . FundHead::find($request->from_head_id)->name,
                            'amount'       => $row['amount'],
                            'type'         => 'out',
                            'added_date'   => $date,
                            'status'       => 'Approved',
                            'approved_date'=> now(),
                            'approve_by'   => $userId,
                            'added_by'     => $userId,
                            'institute_id' => $inst_id,
                            'tid'          => $regionalOffice->id,
                            'trans_type'   => 'transfer',
                            'img'          => $imagePath,
                        ]);

                        // IN transaction for regional office
                        $inFund = Fund::create([
                            'fund_head_id' => $request->from_head_id, // Receives into selected regional head
                            'description'  => 'Transfer from ' . FundHead::find($row['head_id'])->name,
                            'amount'       => $row['amount'],
                            'type'         => 'in',
                            'added_date'   => $date,
                            'status'       => 'Approved',
                            'approved_date'=> now(),
                            'approve_by'   => $userId,
                            'added_by'     => $userId,
                            'institute_id' => $regionalOffice->id,
                            'tid'          => $inst_id,
                            'trans_type'   => 'transfer',
                            'img'          => $imagePath,
                        ]);

                        // Update balances
                        $this->updateFundBalance($inst_id, $row['head_id'], -$row['amount'], $outFund);
                        $this->updateFundBalance($regionalOffice->id, $request->from_head_id, $row['amount'], $inFund);
                    }
                }
            });

            return redirect()->back()->with('success', 'Funds transferred successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    private function updateFundBalance($instituteId, $fundHeadId, $amountChange, $fundTrans = null)
    {
        $fundHeld = FundHeld::firstWhere([
            'institute_id' => $instituteId,
            'fund_head_id' => $fundHeadId
        ]);

        if ($fundHeld) {
            $fundHeld->increment('balance', $amountChange);
            $newBalance = $fundHeld->fresh()->balance;
        } else {
            $fundHeld = FundHeld::create([
                'institute_id' => $instituteId,
                'fund_head_id' => $fundHeadId,
                'balance'      => $amountChange,
                'added_by'     => auth()->id(),
            ]);
            $newBalance = $amountChange;
        }
        
        if ($fundTrans) {
            $fundTrans->update(['balance' => $newBalance]);
        }
    }

    // --------------------------------------------------------------------- //
    // 2. SHOW FUND + TRANSACTIONS (now supports date + search filters)
    // --------------------------------------------------------------------- //
    public function getFund(Request $request)
    {$institute_id=session('sms_inst_id');
        // ---- Find FundHeld -------------------------------------------------
        $fundheld = FundHeld::with('institute', 'fundHead')->where('institute_id', $institute_id)->where('fund_head_id', $request->id)->first();

        if (!$fundheld) {
            return response()->json(['error' => 'Fund held record not found'], 404);
        }

        // Build transaction query - only approved
        $query = Fund::with(['institute', 'FundHead', 'user', 'approver'])
            ->where('institute_id', $institute_id)
            ->where('fund_head_id', $request->id)
            ->where('status', 'Approved');
  
        // Search
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Date range: from / to (ISO date strings from <input type="date">)
        if ($request->filled('from')) {
            $query->where(DB::raw('COALESCE(approved_date, added_date)'), '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where(DB::raw('COALESCE(approved_date, added_date)'), '<=', $request->to);
        }

        // Order + pagination
        // sort by approved_date if available, otherwise added_date
        $fundtrans = $query->orderByRaw('COALESCE(approved_date, added_date) DESC')
            ->orderBy('id', 'DESC')
            ->paginate(10)
            ->withQueryString();

        // ---- Return Inertia page -------------------------------------------
        return Inertia::render('funds/FundsTran', [
            'fundheld'  => $fundheld,
            'fundtrans' => $fundtrans,
            'filters'   => $request->only(['search', 'from', 'to']),
        ]);
    }

    // --------------------------------------------------------------------- //
    // 3. PENDING TRANSACTIONS PAGE
    // --------------------------------------------------------------------- //
    public function pendingTransactions(Request $request)
    {
        $institute_id = session('sms_inst_id');


        // Build query for pending transactions
        $query = Fund::with(['institute', 'FundHead', 'user', 'approver'])
            ->where('institute_id', $institute_id)
            ->where('status', 'Pending');

        // Search filter
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Date range filters
        if ($request->filled('from')) {
            $query->whereDate('added_date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('added_date', '<=', $request->to);
        }

        // Fund head filter
        if ($request->filled('fund_head_id') && $request->fund_head_id != '0') {
            $query->where('fund_head_id', $request->fund_head_id);
        }

        // Get all pending transactions for summary (before pagination)
        $allPending = Fund::where('institute_id', $institute_id)
            ->where('status', 'Pending')
            ->get();

        $summary = [
            'total_count' => $allPending->count(),
            'total_in' => $allPending->where('type', 'in')->sum('amount'),
            'total_out' => $allPending->where('type', 'out')->sum('amount'),
        ];

        // Fetch fund head balances and pending amounts
        $balances = FundHeld::query()
            ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
            ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
            ->where('institutes.id', $institute_id)
            ->select([
                'fund_heads.id as fund_head_id',
                'fund_heads.name as fund_head_name',
                DB::raw('SUM(fund_helds.balance) as balance')
            ])
            ->groupBy('fund_heads.id', 'fund_heads.name')
            ->get()
            ->map(function ($item) use ($allPending) {
                $pendingForHead = $allPending->where('fund_head_id', $item->fund_head_id);
                return [
                    'fund_head' => [
                        'id' => $item->fund_head_id,
                        'name' => $item->fund_head_name,
                    ],
                    'balance' => $item->balance,
                    'pending_in' => $pendingForHead->where('type', 'in')->sum('amount'),
                    'pending_out' => $pendingForHead->where('type', 'out')->sum('amount'),
                ];
            });

        // Paginate results
        $transactions = $query->orderBy('added_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Get fund heads for filter dropdown
        $fundHeads = FundHead::select('id', 'name')->get();

        return Inertia::render('funds/PendingTrans', [
            'transactions' => $transactions,
            'summary' => $summary,
            'fundHeads' => $fundHeads,
            'balances' => $balances,
            'filters' => $request->only(['search', 'from', 'to', 'fund_head_id']),
        ]);
    }

    // --------------------------------------------------------------------- //
    // 4. API: SINGLE TRANSACTION DETAIL (for modal)
    // --------------------------------------------------------------------- //
    public function showTransaction(Fund $fund)
    {
        // Load relationships needed in the modal
        $fund->load('user');

        return response()->json([
            'data' => $fund
        ]);
    }

    // --------------------------------------------------------------------- //
    // 4. CREATE (unchanged)
    // --------------------------------------------------------------------- //
    public function create()
    {
        if (!auth()->user()->can('fund-add')) {
            abort(403);
        }

        $fundHeads = FundHead::select('id', 'name')->get();

        return Inertia::render('funds/Form', [
            'fund'      => null,
            'fundHeads' => $fundHeads
        ]);
    }

    // --------------------------------------------------------------------- //
    // 5. STORE (minor cleanup)
    // --------------------------------------------------------------------- //
    public function store(Request $request)
    {
        try {
            $request->validate([
                'transaction_type'        => 'required|string|in:in,out',
                'added_date'              => 'required|date_format:Y-m-d',
                'status'                  => 'required|string',
                'heads'                   => 'required|array|min:1',
                'heads.*.fund_head_id'    => 'required|numeric|exists:fund_heads,id',
                'heads.*.amount'          => 'required|numeric|min:0.01',
                'heads.*.description'     => 'nullable|string',
            ]);

            $addedBy     = auth()->id();
            $instituteId = session('sms_inst_id');
            $date        = Carbon::parse($request->added_date)->format('Y-m-d');
            $type        = $request->transaction_type;
            $status      = $request->status;

            DB::transaction(function () use ($request, $addedBy, $instituteId, $date, $type, $status) {
                foreach ($request->heads as $head) {
                    Fund::create([
                        'fund_head_id'  => $head['fund_head_id'],
                        'amount'        => $head['amount'],
                        'description'   => $head['description'] ?? null,
                        'type'          => $type,
                        'added_date'    => $date,
                        'status'        => $status,
                        'added_by'      => $addedBy,
                        'institute_id'  => $instituteId,
                    ]);
                }
            });

            return redirect()->route('funds.index')->with('success', 'Fund transaction(s) saved successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // --------------------------------------------------------------------- //
    // 6. EDIT (unchanged)
    // --------------------------------------------------------------------- //
    public function edit(Fund $fund)
    {
        if (!auth()->user()->can('fund-add')) {
            abort(403);
        }

        $fundHeads = FundHead::select('id', 'name')->get();

        return Inertia::render('funds/Form', [
            'fund'      => $fund,
            'fundHeads' => $fundHeads,
        ]);
    }

    // --------------------------------------------------------------------- //
    // 7. UPDATE (minor cleanup)
    // --------------------------------------------------------------------- //
    public function update(Request $request, Fund $fund)
    {
        try {
            if (!auth()->user()->can('fund-edit')) {
                abort(403);
            }

            $validated = $request->validate([
                'amount'       => 'required|numeric',
                'fund_head_id' => 'required|numeric',
                'added_date'   => 'required|date_format:Y-m-d',
                'status'       => 'required|string|in:Approved,Pending,Rejected',
                'description'  => 'nullable|string',
                'type'         => 'required|string|in:in,out',
            ]);

            $validated['added_by'] = auth()->id();

            $fund->update($validated);

            return redirect()->back()->with('success', 'Fund updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // --------------------------------------------------------------------- //
    // 8. APPROVE FUND TRANSACTION
    // --------------------------------------------------------------------- //
    public function approveFundTransaction(Request $request, Fund $fund)
    {
        try {
            // Check if transaction is pending
            if ($fund->status !== 'Pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending transactions can be approved.'
                ], 400);
            }

            // Validate image if provided
            if ($request->hasFile('img')) {
                $request->validate([
                    'img' => 'file',
                ]);
            }

            // Handle image upload if provided
            $imgPath = $fund->img; // Keep existing image if no new one uploaded
            if ($request->hasFile('img')) {
                $file = $request->file('img');
                $imgName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                
                // Create directory if it doesn't exist
                if (!file_exists(public_path('assets/funds/images'))) {
                    mkdir(public_path('assets/funds/images'), 0755, true);
                }
                
                $file->move(public_path('assets/funds/images'), $imgName);
                $imgPath = 'assets/funds/images/' . $imgName;
            }
 

            // Update transaction status
            $fund->update([
                'status' => 'Approved',
                'approve_by' => auth()->id(),
                'approved_date' => now(),
                'img' => $imgPath,
            ]);

            // Update fund balance
            $fundHeld = FundHeld::where('institute_id', $fund->institute_id)
                ->where('fund_head_id', $fund->fund_head_id)
                ->first();

            $newBalance = $fundHeld ? $fundHeld->balance : 0;

            if ($fundHeld) {
                if ($fund->type === 'in') {
                    // Increase balance for incoming funds
                    $newBalance += $fund->amount;
                } elseif ($fund->type === 'out') {
                    // Decrease balance for outgoing funds
                    $newBalance -= $fund->amount;
                }
                $fundHeld->update(['balance' => $newBalance]);
            }
            
            // Save the effective balance on the transaction
            $fund->update(['balance' => $newBalance]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction approved successfully.',
                'fund' => $fund->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    // --------------------------------------------------------------------- //
    // 9. DELETE (unchanged)
    // --------------------------------------------------------------------- //
    public function destroy(Fund $fund)
    {
        if (!auth()->user()->can('fund-delete')) {
            abort(403);
        }

        $fund->delete();

        return redirect()->back()->with('success', 'Fund deleted successfully.');
    }
}