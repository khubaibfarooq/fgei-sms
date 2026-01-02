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
            $failures = $import->failures();
            $errorCount = count($failures);

            $errors = [];
            foreach ($failures->take(5) as $failure) {
                $errors[] = "Row {$failure->row()}: " . implode(', ', $failure->errors());
            }

            if ($errorCount > 5) {
                $errors[] = "...and " . ($errorCount - 5) . " more errors";
            }

            return response()->json([
                'success' => true,
                'message' => "{$importedCount} asset(s) imported successfully.",
                'imported_count' => $importedCount,
                'error_count' => $errorCount,
                'errors' => $errors,
                'available_categories' => $import->getAvailableCategories(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}

