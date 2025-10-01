<?php
namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomType;

use App\Models\Block;

use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::with(['type', 'block']);

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $rooms = $query->paginate(10)->withQueryString();

        return Inertia::render('rooms/Index', [
            'rooms' => $rooms,
            'filters' => [
                'search' => $request->search ?? '',
            ],
        ]);
    }

    public function create()
    {$roomTypes = RoomType::all();
        $institute_id = session('sms_inst_id');
        $blocks = Block::where('institute_id', $institute_id)->get();
        return Inertia::render('rooms/Form', [
            'room' => null,
            'roomTypes' => $roomTypes,
            'blocks' => $blocks,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
            'room_type_id' => 'required|exists:room_types,id',
            'block_id' => 'required|exists:blocks,id',
        ]);
$data['institute_id'] = session('sms_inst_id');
        Room::updateOrCreate(
            ['id' => $request->id ?? null],
            $data
        );

        return redirect()->back()->with('success', 'Room saved successfully.');
    }
    public function edit(Room $room)
    {$roomTypes = RoomType::all();
        $institute_id = session('sms_inst_id');
        $blocks = Block::where('institute_id', $institute_id)->get();
        return Inertia::render('rooms/Form', [
            'room' => $room,
            'roomTypes' => $roomTypes,
            'blocks' => $blocks,
        ]);
    } 
    public function update(Request $request, Room $room)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
            'room_type_id' => 'required|exists:room_types,id',
            'block_id' => 'required|exists:blocks,id',
        ]);
            $data['institute_id'] = session('sms_inst_id');
        $room->update($data);
        return redirect()->back()->with('success', 'Room updated successfully.');}
    public function destroy(Room $room)
    {
        $room->delete();
        return redirect()->back()->with('success', 'Room deleted successfully.');}
}
