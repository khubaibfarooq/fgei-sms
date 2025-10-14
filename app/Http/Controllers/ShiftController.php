<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\BuildingType;
use App\Models\Institute;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with('buildingType', 'institute');
$inst_id = session('sms_inst_id');
$type=session('type');
        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
            ->Where('institute_id', $inst_id);
                  
        }

        $shifts = $query->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('shift-add'),
        'can_edit'   => auth()->user()->can('shift-edit'),
        'can_delete' => auth()->user()->can('shift-delete'),
    ];
        return Inertia::render('shifts/Index', [
            'shifts' => $shifts,
            'filters' => ['search' => $request->search ?? ''],
             'permissions' => $permissions,
        ]);
    }

    public function create()
    { if (!auth()->user()->can('shift-add')) {
        abort(403, 'You do not have permission to add a shift.');
    }
        $buildingTypes = BuildingType::all();
        return Inertia::render('shifts/Form', [
            'shift' => null, 
            'buildingTypes' => $buildingTypes,
           
        ]);
    }

    public function store(Request $request)
    {if (!auth()->user()->can('shift-add')) {
        abort(403, 'You do not have permission to add a shift.');
    }
        $data = $request->validate([
      
            'building_type_id' => 'required|exists:building_types,id',
            'building_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
        ]);
$data['institute_id'] = session('sms_inst_id');
        Shift::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Shift saved successfully.');
    }   
    public function edit(Shift $shift)
    {if (!auth()->user()->can('shift-edit')) {
        abort(403, 'You do not have permission to edit a shift.');
    }
        $buildingTypes = BuildingType::all();
        return Inertia::render('shifts/Form', [
            'shift' => $shift->load('buildingType', 'institute'),
            'buildingTypes' => $buildingTypes,
            
        ]);
    }
    public function update(Request $request, Shift $shift)
    {if (!auth()->user()->can('shift-edit')) {
        abort(403, 'You do not have permission to edit a shift.');
    }
        $data = $request->validate([
            'building_type_id' => 'required|exists:building_types,id',
            'building_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',        
        ]);
        $data['institute_id'] = session('sms_inst_id');

        $shift->update($data);
        return redirect()->back()->with('success', 'Shift updated successfully.');  }
    public function destroy(Shift $shift)
    {   if (!auth()->user()->can('shift-delete')) {
        abort(403, 'You do not have permission to delete a shift.');
    }
        $shift->delete();
        return redirect()->back()->with('success', 'Shift deleted successfully.');} 
}
