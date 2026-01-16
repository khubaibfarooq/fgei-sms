<?php

namespace App\Http\Controllers;

use App\Models\Plant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlantController extends Controller
{
    public function index(Request $request)
    {
        $query = Plant::with('institute');
$instute_id = session('sms_inst_id');
        if ($instute_id) {  
            $query->where('institute_id', $instute_id);
        }
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->Where('institute_id',$request->search);
        }

        $plants = $query->paginate(10)->withQueryString();
$permissions = [
            'can_add' => auth()->user()->can('plant-add'),
            'can_edit' => auth()->user()->can('plant-edit'),
            'can_delete' => auth()->user()->can('plant-delete'),
        ];
        return Inertia::render('plants/Index', [
            'plants' => $plants,
            'filters' => ['search' => $request->search ?? ''],
            'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if (!auth()->user()->can('plant-add')) {
        abort(403, 'You do not have permission to add a plant.');
    }
        return Inertia::render('plants/Form', ['plant' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'qty' => 'required|integer',
        ]);
$data['institute_id'] = session('sms_inst_id');
        Plant::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Plant saved successfully.');
    }
    public function edit(Plant $plant)
    {
        if (!auth()->user()->can('plant-edit')) {
        abort(403, 'You do not have permission to edit a plant.');
    }
        return Inertia::render('plants/Form', ['plant' => $plant]);
    } 
    public function update(Request $request, Plant $plant)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'qty' => 'required|integer',        
        ]);
        $data['institute_id'] = session('sms_inst_id');

        $plant->update($data);
        return redirect()->back()->with('success', 'Plant updated successfully.');  }
    public function destroy(Plant $plant)
    {
        try{
        if (!auth()->user()->can('plant-delete')) {
        abort(403, 'You do not have permission to delete a plant.');
    }
        $plant->delete();
        return redirect()->back()->with('success', 'Plant deleted successfully.');
    }catch(Exception $e){
            return redirect()->back()->with('error', 'Plant deleted failed.'.$e->getMessage());
        }}
}
