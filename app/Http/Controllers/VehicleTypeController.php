<?php
namespace App\Http\Controllers;

use App\Models\VehicleType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = VehicleType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $vehicleTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('vehicletypes/Index', [
            'vehicleTypes' => $vehicleTypes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('vehicletypes/Form', ['vehicleType' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        VehicleType::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Vehicle type saved successfully.');
    }   
    public function edit(VehicleType $VehicleType)
    {
        //dd($VehicleType);
        return Inertia::render('vehicletypes/Form', ['vehicleType' => $VehicleType]);
    } 
    public function update(Request $request, VehicleType $VehicleType)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);  
        $VehicleType->update($data);     
        return redirect()->back()->with('success', 'Vehicle type updated successfully.');
    }
    public function destroy(VehicleType $VehicleType)
    {
        $VehicleType->delete();   
        return redirect()->back()->with('success', 'Vehicle type deleted successfully.');
    }
}
