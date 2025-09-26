<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with('buildingType', 'institute');

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $shifts = $query->paginate(10)->withQueryString();

        return Inertia::render('shifts/Index', [
            'shifts' => $shifts,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('shifts/Form', ['shift' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'building_type_id' => 'required|exists:building_types,id',
            'building_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
        ]);

        Shift::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Shift saved successfully.');
    }   
    public function edit(Shift $shift)
    {
        return Inertia::render('shifts/Form', ['shift' => $shift]);
    } 
    public function update(Request $request, Shift $shift)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'building_type_id' => 'required|exists:building_types,id',
            'building_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',        
        ]);
        $shift->update($data);
        return redirect()->back()->with('success', 'Shift updated successfully.');  }
    public function destroy(Shift $shift)
    {   
        $shift->delete();
        return redirect()->back()->with('success', 'Shift deleted successfully.');} 
}
