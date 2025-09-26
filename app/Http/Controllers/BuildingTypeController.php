<?php

namespace App\Http\Controllers;

use App\Models\BuildingType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BuildingTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = BuildingType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $buildingTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('buildingtypes/Index', [
            'buildingTypes' => $buildingTypes,
            'filters' => [
                'search' => $request->search ?? '',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('buildingtypes/Form', [
            'buildingType' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        BuildingType::updateOrCreate(
            ['id' => $request->id ?? null],
            $data
        );

        return redirect()->back()->with('success', 'Building type saved successfully.');
    }
    public function edit(BuildingType $buildingType)
    {
        return Inertia::render('buildingtypes/Form', [
            'buildingType' => $buildingType,
        ]);
    } 
    public function update(Request $request, BuildingType $buildingType)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]); 
        $buildingType->update($data);
        return redirect()->back()->with('success', 'Building type updated successfully.');
    }
    public function destroy(BuildingType $buildingType)
    {
        $buildingType->delete();   
        return redirect()->back()->with('success', 'Building type deleted successfully.');
    }
}
