<?php

namespace App\Http\Controllers;

use App\Models\InstituteAsset;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InstituteAssetController extends Controller
{
    public function index(Request $request)
    {
        $query = InstituteAsset::with('institute', 'asset');

        if ($request->search) {
            $query->whereHas('asset', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        $instituteAssets = $query->paginate(10)->withQueryString();

        return Inertia::render('instituteassets/Index', [
            'instituteAssets' => $instituteAssets,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('instituteassets/Form', ['instituteAsset' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'asset_id' => 'required|exists:assets,id',
            'current_qty' => 'required|integer',
            'added_date' => 'nullable|date',
            'added_by' => 'nullable|integer',
        ]);

        InstituteAsset::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Institute asset saved successfully.');
    }
    public function edit(InstituteAsset $instituteAsset)
    {
        return Inertia::render('instituteassets/Form', ['instituteAsset' => $instituteAsset]);
    } 
    public function update(Request $request, InstituteAsset $instituteAsset)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'asset_id' => 'required|exists:assets,id',
            'current_qty' => 'required|integer',        
            'added_date' => 'nullable|date',
            'added_by' => 'nullable|integer',
        ]);
        $instituteAsset->update($data);
        return redirect()->back()->with('success', 'Institute asset updated successfully.');
    }
    public function destroy(InstituteAsset $instituteAsset)
    {
        $instituteAsset->delete();   
        return redirect()->back()->with('success', 'Institute asset deleted successfully.');
    }
}
