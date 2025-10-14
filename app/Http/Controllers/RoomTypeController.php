<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use App\Models\Asset;

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
        $assets=Asset::pluck('name', 'id')->toArray();
        return Inertia::render('roomtype/Form', ['roomType' => null,
    'assets'=>$assets]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        'assets_id'=>'nullable|string',]);

        RoomType::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Room type saved successfully.');
    }
    public function edit(RoomType $roomType)
    {        $assets=Asset::pluck('name', 'id')->toArray();

        return Inertia::render('roomtype/Form', ['roomType' => $roomType,
    'assets'=>$assets]);
    } 
    public function update(Request $request, RoomType $roomType)
    {
        $data = $request->validate(['name' => 'required|string|max:255','assets_id'=>'nullable|string',]);
        $roomType->update($data);       
        return redirect()->back()->with('success', 'Room type updated successfully.');
    }
    public function destroy(RoomType $roomType)
    {
        $roomType->delete();   
        return redirect()->back()->with('success', 'Room type deleted successfully.');
    }   
        
}
