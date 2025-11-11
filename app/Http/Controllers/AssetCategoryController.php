<?php

namespace App\Http\Controllers;

use App\Models\AssetCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssetCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = AssetCategory::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $assetCategories = $query->paginate(10)->withQueryString();

        return Inertia::render('assetcategories/Index', [
            'assetCategories' => $assetCategories,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('assetcategories/Form', ['assetCategory' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255',
    ]);

        AssetCategory::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Asset category saved successfully.');
    }
    public function edit(AssetCategory $assetCategory)
    {
        return Inertia::render('assetcategories/Form', ['assetCategory' => $assetCategory]);
    } 
    public function update(Request $request, AssetCategory $assetCategory)
    {
        $data = $request->validate(['name' => 'required|string|max:255',]);

        $assetCategory->update($data);

        return redirect()->back()->with('success', 'Asset category updated successfully.');
    }
    public function destroy(AssetCategory $assetCategory)
    {
        $assetCategory->delete();   
        return redirect()->back()->with('success', 'Asset category deleted successfully.');
    }
}
