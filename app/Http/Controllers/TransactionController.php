<?php

namespace App\Http\Controllers;

use App\Models\Transaction; // Add this
use App\Models\User;        // Add this
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;
class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $instituteId = session('sms_inst_id');
        if (!$instituteId) {
            abort(403, 'Institute not selected.');
        }

            $emptyPaginator = new LengthAwarePaginator(
        collect([]),
        0,
        15, // same per_page as in getTransactions()
        1,
        [
            'path' => $request->url(),
            'pageName' => 'page',
        ]
    );


        return Inertia::render('asset_transactions/Index', [
            'transactions' =>  $emptyPaginator, // Initial load via API
   
            'filters' => [
                'search'        => $request->get('search', ''),
              
                'type'          => $request->get('type', ''),
                'status'        => $request->get('status', ''),
                'date_from'     => $request->get('date_from', ''),
                'date_to'       => $request->get('date_to', ''),
            ],
        ]);
    }

    public function getTransactions(Request $request)
    {
        $instituteId = session('sms_inst_id');
        if (!$instituteId) {
            return response()->json(['data' => [], 'links' => []], 403);
        }

        $query = Transaction::where('institute_id', $instituteId)
            ->with(['institute', 'addedBy', 'approvedBy', 'Type', 'subType'])
            ->select('transactions.*');

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('total_amount', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('added_by') && $request->added_by !== '0') {
            $query->where('added_by', $request->added_by);
        }

        if ($request->filled('approved_by') && $request->approved_by !== '0') {
            $query->where('approved_by', $request->approved_by);
        }

        if ($request->filled('type') && $request->type !== '0') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== '0') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return response()->json($transactions);
    }

    public function getTransactionDetails(Request $request)
    {$id = $request->input('tid');
        $instituteId = session('sms_inst_id');
        if (!$instituteId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $transaction = Transaction::where('id', $id)
            ->where('institute_id', $instituteId)
            ->with(['institute', 'addedBy', 'approvedBy', 'Type', 'subType'])
            ->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        $transdetails = DB::table('transaction_details')
            ->where('tid', $id)
            ->leftJoin('fund_heads', 'transaction_details.fund_head_id', '=', 'fund_heads.id')
            ->leftJoin('assets', 'transaction_details.asset_id', '=', 'assets.id')
            ->leftJoin('rooms', 'transaction_details.room_id', '=', 'rooms.id')
            ->select(
                'transaction_details.*',
                'fund_heads.name as fund_head_name',
                'assets.name as asset_name',
                'rooms.name as room_name'
            )
            ->get();

        return response()->json([
            'transaction' => $transaction,
            'transdetails' => $transdetails
        ]);
    }
}