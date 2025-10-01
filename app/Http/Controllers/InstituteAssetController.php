<?php

namespace App\Http\Controllers;

use App\Models\InstituteAsset;
use App\Models\Asset;
use App\Models\Room;
use App\Models\Block;

use App\Models\Institute;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InstituteAssetController extends Controller
{
    public function index(Request $request)
    {
        $inst_id = session('sms_inst_id');
        $query = InstituteAsset::with(['institute', 'asset.category', 'room.block'])
            ->where('institute_id', $inst_id);

        if ($request->search) {
            $query->whereHas('asset', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        $instituteAssets = $query->paginate(10)->withQueryString();

        return Inertia::render('institute_assets/Index', [
            'instituteAssets' => $instituteAssets,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        $inst_id = session('sms_inst_id');
        $rooms = Room::whereHas('block', function ($query) use ($inst_id) {
            $query->where('institute_id', $inst_id);
        })->with(['block', 'type'])->get();
        $assets = Asset::with('category')->get();
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
        $data = $request->validate([
            'details' => 'required|string|max:255',
            'asset_id' => 'required|exists:assets,id',
            'current_qty' => 'required|integer|min:1',
            'added_date' => 'required|date',
            'room_id' => 'required|exists:rooms,id',
        ]);
        $data['added_by']= auth()->id();
        $data['institute_id'] = session('sms_inst_id');

        InstituteAsset::create($data);

        return redirect()->route('institute-assets.index')->with('success', 'Institute asset saved successfully.');
    }
    public function edit(InstituteAsset $instituteAsset)
    {
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
    }
    public function destroy(InstituteAsset $instituteAsset)
    {
        $instituteAsset->delete();
        return redirect()->route('institute-assets.index')->with('success', 'Institute asset deleted successfully.');
    }
}
