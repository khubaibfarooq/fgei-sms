<?php
namespace App\Http\Controllers;

use App\Models\AssetTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

    public function create()
    {
        return Inertia::render('assettransactions/Form', ['assetTransaction' => null]);
    }

    public function store(Request $request)
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

        AssetTransaction::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Asset transaction saved successfully.');
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
}
