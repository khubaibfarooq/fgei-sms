<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = RoomType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $roomTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('roomtype/Index', [
            'roomTypes' => $roomTypes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('roomtype/Form', ['roomType' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        RoomType::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Room type saved successfully.');
    }
    public function edit(RoomType $roomType)
    {
        return Inertia::render('roomtype/Form', ['roomType' => $roomType]);
    } 
    public function update(Request $request, RoomType $roomType)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);
        $roomType->update($data);       
        return redirect()->back()->with('success', 'Room type updated successfully.');
    }
    public function destroy(RoomType $roomType)
    {
        $roomType->delete();   
        return redirect()->back()->with('success', 'Room type deleted successfully.');
    }   
        
}
