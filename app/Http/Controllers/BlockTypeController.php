<?php
namespace App\Http\Controllers;

use App\Models\BlockType;
use App\Models\RoomType;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BlockTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = BlockType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $BlockTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('blocktypes/Index', [
            'blockTypes' => $BlockTypes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        $roomTypes = RoomType::pluck('name', 'id')->toArray();
        return Inertia::render('blocktypes/Form', ['blockType' => null,
    'roomTypes'=>$roomTypes]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'room_type_ids' => 'nullable|string', // Adjust validation as needed
        ]);

        BlockType::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Block type saved successfully.');
    }   
    public function edit(BlockType $BlockType)
    {
                $roomTypes = RoomType::pluck('name', 'id')->toArray();

        //dd($BlockType);
        return Inertia::render('blocktypes/Form', ['blockType' => $BlockType,
    'roomTypes'=>$roomTypes]);
    } 
    public function update(Request $request, BlockType $BlockType)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
                 'room_type_ids' => 'nullable|string',
        ]);  
        $BlockType->update($data);     
        return redirect()->back()->with('success', 'Block type updated successfully.');
    }
    public function destroy(BlockType $BlockType)
    {
        $BlockType->delete();   
        return redirect()->back()->with('success', 'Block type deleted successfully.');
    }
}
