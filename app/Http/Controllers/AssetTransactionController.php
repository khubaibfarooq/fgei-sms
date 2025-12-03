<?php
namespace App\Http\Controllers;

use App\Models\AssetTransaction;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\FundHead;
use App\Models\FundHeld;
use App\Models\Asset;
use App\Models\Block;
use App\Models\Fund;
use App\Models\Room;
use App\Models\AssetCategory;
use App\Models\Type;
use Illuminate\Http\Request;
use Inertia\Inertia;
       use Illuminate\Support\Facades\DB;

class AssetTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = AssetTransaction::with('institute', 'instituteAsset');

        if ($request->search) {
            $query->where('details', 'like', '%' . $request->search . '%');
        }

        $assetTransactions = $query->paginate(10)->withQueryString();

        return Inertia::render('assettransactions/Index', [
            'assetTransactions' => $assetTransactions,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }
  public function Transaction(Request $request)
    {$fundheads=FundHead::where('type','institutional')->get();
        $assetCategory=AssetCategory::get();
        $instituteId = session('sms_inst_id');
            $blocks = Block::where('institute_id', $instituteId)->get();
            $types=Type::where('module', 'Trans')->get();
        return Inertia::render('asset_transactions/AssetTransaction', [
            'fundHeads' => $fundheads,
            'assetCategories' => $assetCategory,
            'blocks' => $blocks,
            'types' => $types,
        ]);
    }
    public function FundBalance(Request $request){
        $fundheadid=$request->id;
        $inst_id=session('sms_inst_id');
        $balance=FundHeld::where('fund_head_id',$fundheadid)->where('institute_id',$inst_id)->first()->balance;
          return response()->json([

        'balance' => $balance]);
    }
 
public function GetAssets(Request $request)
{
    $catid   = $request->query('id');      // category ID
    $roomid  = $request->query('room_id'); // room ID (optional, but required in frontend)
    $inst_id = session('sms_inst_id');

    // Base query: assets in the selected category
    $query = Asset::where('asset_category_id', $catid);

    // Join with institute_assets ONLY for the selected room
    if ($roomid) {
        $query->leftJoin('institute_assets', function ($join) use ($inst_id, $roomid) {
            $join->on('assets.id', '=', 'institute_assets.asset_id')
                 ->where('institute_assets.institute_id', $inst_id)
                 ->where('institute_assets.room_id', $roomid); // Critical: filter by room
        });
    } else {
        // If no room is selected, ensure current_qty is 0
        $query->leftJoin('institute_assets', function ($join) {
            $join->on('assets.id', '=', DB::raw('NULL')); // Force no match
        });
    }

    // Select asset details + current_qty (0 if no record in that room)
    $assets = $query->select([
        'assets.id',
        'assets.name',
        'assets.asset_category_id',
        'assets.details',
        'assets.created_at',
        'assets.updated_at',
        DB::raw('COALESCE(institute_assets.current_qty, 0) AS current_qty')
    ])->get();

    return response()->json([
        'assets' => $assets
    ]);
}
    
    public function getRooms(Request $request)
    {
        $blockId = $request->block_id;
        $rooms = Room::where('block_id', $blockId)->get();
        return response()->json($rooms);
    }

    public function create()
    {
        return Inertia::render('assettransactions/Form', ['assetTransaction' => null]);
    }
    public function store(Request $request)
{
    // -----------------------------------------------------------------
    // 1. Get Type Configuration
    // -----------------------------------------------------------------
    $typeId = $request->sub_type ?? $request->type;
    $typeConfig = Type::find($typeId);
    
    if (!$typeConfig) {
        return back()->withErrors(['type' => 'Invalid type selected']);
    }

    // -----------------------------------------------------------------
    // 2. Build Validation Rules
    // -----------------------------------------------------------------
    $rules = [
        'total_amount' => 'required|numeric|min:0.01',
        'type'         => 'required|exists:types,id',
        'sub_type'     => 'nullable',
        'description'  => 'nullable|string|max:1000',
        'items'        => 'required|array|min:1',
        'items.*.fund_head_id' => 'required|exists:fund_heads,id',
        'items.*.amount'       => 'required|numeric|min:0.01',
        'bill_img'             => 'nullable|file|max:2048', // 2MB
    ];

    // Conditionally add validation rules based on type configuration
    if ($typeConfig->isblock) {
        $rules['items.*.block_id'] = 'required|exists:blocks,id';
    } else {
        $rules['items.*.block_id'] = 'nullable|exists:blocks,id';
    }

    if ($typeConfig->isroom) {
        $rules['items.*.room_id'] = 'required|exists:rooms,id';
    } else {
        $rules['items.*.room_id'] = 'nullable|exists:rooms,id';
    }

    if ($typeConfig->isasset) {
        $rules['items.*.asset_id'] = 'required|exists:assets,id';
        $rules['items.*.purchase_qty'] = 'required|integer|min:1';
    } else {
        $rules['items.*.asset_id'] = 'nullable|exists:assets,id';
        $rules['items.*.purchase_qty'] = 'nullable|integer|min:0';
    }

    $request->validate($rules);

    // -----------------------------------------------------------------
    // 3. DB Transaction
    // -----------------------------------------------------------------
    return DB::transaction(function () use ($request) {
        // --- Upload Bill Image ---
        $billImgPath = null;
        if ($request->hasFile('bill_img')) {
            $file = $request->file('bill_img');
            $filename = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('assets/billImages'), $filename);
            $billImgPath = 'assets/billImages/' . $filename;
        }

        // --- Create Transaction Header ---
        $transaction = Transaction::create([

            'institute_id' => session('sms_inst_id'),
            'added_by'     => auth()->id(),
            'total_amount' => $request->total_amount,
            'type'         => $request->type,
            'sub_type'     => $request->sub_type,
            'description'  => $request->description,
            'status'       => 'pending',
            'bill_img'     => $billImgPath,
        ]);

        // --- Create Transaction Details ---
        $details = collect($request->items)->map(function ($item) use ($transaction) {
            return [
                'tid'          => $transaction->id,
                'fund_head_id' => $item['fund_head_id'],
                'asset_id'     => $item['asset_id'] ?? null,
                'room_id'      => $item['room_id'] ?? null,
                'amount'       => $item['amount'],
                'qty'          => $item['purchase_qty'] ?? null,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        })->toArray();

        TransactionDetail::insert($details);
$this->ApproveTransaction($transaction->id);
        // --- Flash Success ---
        return redirect()
            ->back()
            ->with('success', 'Transaction created successfully!')
            ->with('transaction_id', $transaction->id);
    });
}
    public function edit(AssetTransaction $assetTransaction)
    {
        return Inertia::render('assettransactions/Form', ['assetTransaction' => $assetTransaction]);
    }
    public function update(Request $request, AssetTransaction $assetTransaction)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'institute_asset_id' => 'required|exists:institute_assets,id',
            'qty' => 'required|integer',
            'details' => 'required|string',
            'status' => 'required|in:condemned,required',       
            'added_date' => 'nullable|date',
            'added_by' => 'nullable|integer',
            'approved_date' => 'nullable|date',
            'approved_by' => 'nullable|integer',
        ]); 
        $assetTransaction->update($data);
        return redirect()->back()->with('success', 'Asset transaction updated successfully.');
    }
    public function destroy(AssetTransaction $assetTransaction)
    {
        $assetTransaction->delete();
        return redirect()->back()->with('success', 'Asset transaction deleted successfully.');
    }
    public function ApproveTransaction($tid)
{
   

    return DB::transaction(function () use ($tid) {
        $transaction = Transaction::with(['Type', 'subType'])->find($tid);

        if (!$transaction) {
            throw new \Exception('Transaction not found.');
        }

        $transdetails = TransactionDetail::where('tid', $tid)->get();

        foreach ($transdetails as $detail) {
            $asset = $detail->asset_id;
            $assetname = $asset ? Asset::find($asset)->name : null;
            $quantity = $detail->qty;
            $institute_id = $transaction->institute_id;
            $room = $detail->room_id;
            $fundhead = $detail->fund_head_id;
            $type = $transaction->Type?->name;
            $subType = $transaction->subType?->name;

            // Update InstituteAsset stock
            if ($type == 'purchase') {
                $instituteAsset = InstituteAsset::where('institute_id', $institute_id)
                    ->where('asset_id', $asset)
                    ->where('room_id', $room)
                    ->first();

                if ($instituteAsset) {
                    // Asset exists in the room, update quantity
                    $instituteAsset->current_qty += $quantity;
                    $instituteAsset->save();
                } else {
                    // Asset does not exist in the room, create new record
                    InstituteAsset::create([
                        'institute_id' => $institute_id,
                        'asset_id'     => $asset,
                        'room_id'      => $room,
                        'current_qty'  => $quantity,
                        'added_date'   => now(),
                        'details'      => $assetname,
                        'added_by'=> auth()->user()->id,
                    ]);
                }

                // Update fund held (deduct for purchase)
                $fundHeld = FundHeld::where('institute_id', $institute_id)
                    ->where('fund_head_id', $fundhead)
                    ->first();

                if ($fundHeld) {
                    $fundHeld->balance -= $detail->amount;
                    $fundHeld->save();
                }
            }
            elseif ($type == 'condemned') {
                $instituteAsset = InstituteAsset::where('institute_id', $institute_id)
                    ->where('asset_id', $asset)
                    ->where('room_id', $room)
                    ->first();

                if ($instituteAsset) {
                    // Reduce quantity
                    $instituteAsset->current_qty -= $quantity;
                    if ($instituteAsset->current_qty < 0) {
                        $instituteAsset->current_qty = 0; // Prevent negative stock
                    }
                    $instituteAsset->save();
                }

                // Update fund held (add back for condemned)
                $fundHeld = FundHeld::where('institute_id', $institute_id)
                    ->where('fund_head_id', $fundhead)
                    ->first();

                if ($fundHeld) {
                    $fundHeld->balance += $detail->amount;
                    $fundHeld->save();
                } else {
                    FundHeld::create([
                        'institute_id'  => $institute_id,
                        'fund_head_id'  => $fundhead,
                        'balance'       => $detail->amount, // assuming 'balance' is the column
                    ]);
                }
            }else if($type == 'expense'){
                   $fundHeld = FundHeld::where('institute_id', $institute_id)
                    ->where('fund_head_id', $fundhead)
                    ->first();

                if ($fundHeld) {
                    $fundHeld->balance -= $detail->amount;
                    $fundHeld->save();
                } 
                }
            
            // Record in Fund table
            Fund::create([
                'institute_id'  => $institute_id,
                'fund_head_id'  => $fundhead,
                'amount'        => $detail->amount,
                'added_date'    => now(),
                'description'   => 'TID ' . $tid . ' - ' . ucfirst($type) . ' of ' . $assetname .' Qty: '.$quantity .' Room: '.$room   ,
                'type'          => in_array($type, ['purchase', 'maintenance']) ? 'out' : 'in',
                'added_by'      => auth()->user()->id,
                'status'        => 'Approved',
                'tid'=>$tid,
            ]);
        }

        // Update transaction status
        $transaction->status = 'approved';
        $transaction->approved_by = auth()->user()->id;
        $transaction->save();

        return response()->json(['message' => 'Transaction approved successfully.'], 200);
    });

}
}
