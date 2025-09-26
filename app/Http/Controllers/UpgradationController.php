<?php
namespace App\Http\Controllers;

use App\Models\Upgradation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UpgradationController extends Controller
{
    public function index(Request $request)
    {
        $query = Upgradation::with('institute');

        if ($request->search) {
            $query->where('details', 'like', '%' . $request->search . '%');
        }

        $upgradations = $query->paginate(10)->withQueryString();

        return Inertia::render('upgradations/Index', [
            'upgradations' => $upgradations,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('upgradations/Form', ['upgradation' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'details' => 'required|string',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'status' => 'nullable|string|max:50',
            'added_date' => 'nullable|date',
            'added_by' => 'nullable|integer',
            'approved_date' => 'nullable|date',
            'approved_by' => 'nullable|integer',
        ]);

        Upgradation::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Upgradation saved successfully.');
    }
    public function edit(Upgradation $upgradation)
    {
        return Inertia::render('upgradations/Form', ['upgradation' => $upgradation]);
    } 
    public function update(Request $request, Upgradation $upgradation)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'details' => 'required|string',
            'from' => 'nullable|date',  
            'to' => 'nullable|date',
            'status' => 'nullable|string|max:50',
            'added_date' => 'nullable|date',
            'added_by' => 'nullable|integer',
            'approved_date' => 'nullable|date',
            'approved_by' => 'nullable|integer',
        ]);
        $upgradation->update($data);
        return redirect()->back()->with('success', 'Upgradation updated successfully.');  }
    public function destroy(Upgradation $upgradation)
    {
        $upgradation->delete();
        return redirect()->back()->with('success', 'Upgradation deleted successfully.');}   
}
