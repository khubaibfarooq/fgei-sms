<?php

namespace App\Http\Controllers;
use App\Models\AssetCategory;
use App\Models\Asset;
use App\Imports\AssetsImport;
use Maatwebsite\Excel\Facades\Excel;
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

        if ($request->asset_category_id) {
            $query->where('asset_category_id', $request->asset_category_id);
        }

        $assets = $query->paginate(10)->withQueryString();
        $assetCategories = AssetCategory::all();

        return Inertia::render('assets/Index', [
            'assets' => $assets,
            'assetCategories' => $assetCategories,
            'filters' => [
                'search' => $request->search ?? '',
                'asset_category_id' => $request->asset_category_id ?? '',
            ],
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
            'type'=>'required|in:consumable,fixed',
        ]);

        Asset::Create( $data);

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
            'type'=>'required|in:consumable,fixed',
        ]);

        $asset->update($data);

        return redirect()->back()->with('success', 'Asset updated successfully.');
    }
    public function destroy(Asset $asset)
    {
        $asset->delete();

        return redirect()->back()->with('success', 'Asset deleted successfully.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240', // 10MB max
        ]);

        try {
            $import = new AssetsImport();
            Excel::import($import, $request->file('file'));

            $importedCount = $import->getImportedCount();
            $failures = collect($import->failures());
            $errorCount = $failures->count();

            $importErrors = [];
            foreach ($failures->slice(0, 5) as $failure) {
                $importErrors[] = "Row {$failure->row()}: " . implode(', ', $failure->errors());
            }

            if ($errorCount > 5) {
                $importErrors[] = "...and " . ($errorCount - 5) . " more errors";
            }

            return redirect()->back()->with([
                'success' => "{$importedCount} asset(s) imported successfully.",
                'error_count' => $errorCount,
                'import_errors' => $importErrors,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }
}

