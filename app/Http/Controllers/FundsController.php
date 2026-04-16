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

        return Inertia::render('funds/Index', [
            'funds'       => $funds,
            'filters'     => ['search' => $request->search ?? ''],
            'permissions' => $permissions,
        ]);
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

        // Fetch regional fund balances


            $balances = FundHeld::query()
                ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
                ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
                ->where('institutes.id', $institute_id)
                ->where('fund_heads.type', 'regional')
                ->select([
                    'fund_heads.id as fund_head_id',
                    'fund_heads.name as fund_head_name',
                    DB::raw('SUM(fund_helds.balance) as balance')
                ])
                ->groupBy('fund_heads.id', 'fund_heads.name')
                ->get()
                ->map(function ($item) {
                    return [
                        'fund_head' => [
                            'id' => $item->fund_head_id,
                            'name' => $item->fund_head_name,
                        ],
                        'balance' => $item->balance,
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