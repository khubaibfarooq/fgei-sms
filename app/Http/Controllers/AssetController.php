<?php

namespace App\Http\Controllers;
use App\Models\AssetCategory;
use App\Models\Asset;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::with('category');

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $assets = $query->paginate(10)->withQueryString();

        return Inertia::render('assets/Index', [
            'assets' => $assets,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    { $assetCategories = AssetCategory::all();
        return Inertia::render('assets/Form', [
            'asset' => null,
            'assetCategories' => $assetCategories,]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'asset_category_id' => 'required|exists:asset_categories,id',
            'name' => 'required|string|max:255',
            'details' => 'nullable|string',
        ]);

        Asset::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Asset saved successfully.');
    }
    public function edit(Asset $asset)
    { $assetCategories = AssetCategory::all();
        return Inertia::render('assets/Form', [
            'asset' => $asset,
            'assetCategories' => $assetCategories,]);
    }
    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'asset_category_id' => 'required|exists:asset_categories,id',
            'name' => 'required|string|max:255',
            'details' => 'nullable|string',
        ]);

        $asset->update($data);

        return redirect()->back()->with('success', 'Asset updated successfully.');
    }
    public function destroy(Asset $asset)
    {
        $asset->delete();

        return redirect()->back()->with('success', 'Asset deleted successfully.');
    }
}
