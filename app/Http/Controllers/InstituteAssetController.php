<?php

namespace App\Http\Controllers;

use App\Models\InstituteAsset;
use App\Models\Asset;
use App\Models\Room;
use App\Models\Block;
use App\Models\AssetCategory;
use App\Models\Institute;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InstituteAssetController extends Controller
{
    public function index(Request $request)
{
    $inst_id = session('sms_inst_id');
$assets=Asset::pluck('name', 'id');

    // Start with base query
    $query = InstituteAsset::query()
        ->with(['institute', 'asset.category', 'room.block'])
        ->where('institute_id', $inst_id);
   $instituteAssets=[];
    // Apply filters
    if ($request->filled('search')) {
        $query->whereHas('asset', function ($q) use ($request) {
            $q->where('name', 'like', '%' . $request->search . '%');
        });
    }

    if ($request->filled('block')) {
        $query->whereHas('room.block', function ($q) use ($request) {
            $q->where('id', $request->block);
        });
    }

    if ($request->filled('room')) {
        $query->where('room_id', $request->room);
    }

    if ($request->filled('category') && $request->category != 0) {
        $query->whereHas('asset.category', function ($q) use ($request) {
            $q->where('id', $request->category);
        });
        $assets=Asset::where('asset_category_id', $request->category)->pluck('name', 'id');
    }

    // Handle summary/details mode
    if (!$request->boolean('details')){
  $query->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
              ->select([
                  'assets.id as asset_id',
                  'assets.name',
                  DB::raw('SUM(institute_assets.current_qty) as total_qty'),
                  DB::raw('COUNT(*) as locations_count') // optional: how many places this asset exists
              ])
              ->groupBy('assets.id','assets.name')
              ->orderBy('assets.name');
                 
              
}
if($request->filled('asset')){
    $query->where('asset_id', $request->asset);
}
    // Paginate
          $instituteAssets = $query->paginate(10)->withQueryString();


    // Load additional data
    $blocks = Block::where('institute_id', $inst_id)->pluck('name', 'id');
    $rooms = Room::whereHas('block', function ($q) use ($inst_id) {
        $q->where('institute_id', $inst_id);
    })->with(['block', 'type'])->get();

    $categories = AssetCategory::pluck('name', 'id');

    $permissions = [
        'can_add' => auth()->user()->can('inst-assets-add'),
        'can_edit' => auth()->user()->can('inst-assets-edit'),
        'can_delete' => auth()->user()->can('inst-assets-delete'),
    ];
    return Inertia::render('institute_assets/Index', [
        'instituteAssets' => $instituteAssets,
        'filters' => $request->only(['search', 'block', 'room', 'category', 'details','asset']),
        'permissions' => $permissions,
        'rooms' => $rooms,
        'blocks' => $blocks,
        'categories' => $categories,
        'assets'=>$assets,
    ]);
}
    public function create()
    { if (!auth()->user()->can('inst-assets-add')) {
        abort(403, 'You do not have permission to add a Asset.');
    }
        $inst_id = session('sms_inst_id');
        $rooms = Room::whereHas('block', function ($query) use ($inst_id) {
            $query->where('institute_id', $inst_id);
        })->with(['block', 'type'])->get();
       $assets = Asset::with('category')->orderBy('id', 'asc')->get();
        $users = User::all();
        
        return Inertia::render('institute_assets/Form', [
            'instituteAsset' => null,
            'rooms' => $rooms,
            'assets' => $assets,
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'room_id' => 'required|exists:rooms,id',
                'added_date' => 'required|date',
                'assets' => 'required|array|min:1',
                'assets.*.asset_id' => 'required|exists:assets,id',
                'assets.*.current_qty' => 'required|integer|min:1',
                'assets.*.details' => 'required|string|max:255',
            ]);

            $addedBy = auth()->id();
            $instituteId = session('sms_inst_id');

            // Loop through each asset and create or update record
            foreach ($data['assets'] as $asset) {
                // Check if asset already exists in the same room for this institute
                $existingAsset = InstituteAsset::where('asset_id', $asset['asset_id'])
                    ->where('room_id', $data['room_id'])
                    ->where('institute_id', $instituteId)
                    ->first();

                if ($existingAsset) {
                    // Add quantity to existing asset
                    $existingAsset->update([
                        'current_qty' => $existingAsset->current_qty + $asset['current_qty'],
                        'details' => $asset['details'],
                        'added_date' => $data['added_date'],
                        'added_by' => $addedBy,
                    ]);
                } else {
                    // Create new record
                    InstituteAsset::create([
                        'asset_id' => $asset['asset_id'],
                        'current_qty' => $asset['current_qty'],
                        'details' => $asset['details'],
                        'room_id' => $data['room_id'],
                        'added_date' => $data['added_date'],
                        'added_by' => $addedBy,
                        'institute_id' => $instituteId,
                    ]);
                }
            }

            return redirect()->route('institute-assets.create')->with('success', 'Institute assets saved successfully.');
        } catch (\Exception $e) {
            \Log::error('Institute assets add failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['assets' => 'Failed to add Institute assets: ' . $e->getMessage()]);
        }
    }
    
    public function edit(InstituteAsset $instituteAsset)
    {if (!auth()->user()->can('inst-assets-edit')) {
        abort(403, 'You do not have permission to edit a Asset.');
    }
        $inst_id = session('sms_inst_id');
        $blocks = Block::where('institute_id', $inst_id)->get();
        $rooms = Room::whereHas('block', function ($query) use ($inst_id) {
            $query->where('institute_id', $inst_id);
        })->with(['block', 'type'])->get();
        $assets = Asset::with('category')->get();
        
        return Inertia::render('institute_assets/Form', [
            'instituteAsset' => $instituteAsset->load(['asset', 'institute', 'room.block']),
            'blocks' => $blocks,
            'rooms' => $rooms,
            'assets' => $assets,
            'users' => User::all()
        ]);
    }
    public function update(Request $request, InstituteAsset $instituteAsset)
    {
        try {
            $data = $request->validate([
                'details' => 'required|string|max:255',
                'asset_id' => 'required|exists:assets,id',
                'current_qty' => 'required|integer|min:1',
                'added_date' => 'required|date',
                'room_id' => 'required|exists:rooms,id',
            ]);
            $data['added_by'] = auth()->id();
            $data['institute_id'] = session('sms_inst_id');
            $instituteAsset->update($data);

            return redirect()->route('institute-assets.index')->with('success', 'Institute asset updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Institute assets update failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to update Institute assets: ' . $e->getMessage()]);
        }
    }
    public function destroy(InstituteAsset $instituteAsset)
    {if (!auth()->user()->can('inst-assets-delete')) {
        abort(403, 'You do not have permission to delete a Asset.');
    }
        $instituteAsset->delete();
        return redirect()->route('institute-assets.index')->with('success', 'Institute asset deleted successfully.');
    }
}
