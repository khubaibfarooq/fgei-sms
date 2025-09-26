<?php
namespace App\Http\Controllers;

use App\Models\VehicelType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicelTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = VehicelType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $vehicleTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('vehiceltypes/Index', [
            'vehicelTypes' => $vehicleTypes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('vehiceltypes/Form', ['vehicleType' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        VehicelType::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Vehicel type saved successfully.');
    }   
    public function edit(VehicelType $vehicelType)
    {
        return Inertia::render('vehiceltypes/Form', ['vehicelType' => $vehicelType]);
    } 
    public function update(Request $request, VehicelType $vehicelType)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);  
        $vehicelType->update($data);     
        return redirect()->back()->with('success', 'Vehicel type updated successfully.');
    }
    public function destroy(VehicelType $vehicelType)
    {
        $vehicelType->delete();   
        return redirect()->back()->with('success', 'Vehicel type deleted successfully.');
    }
}
