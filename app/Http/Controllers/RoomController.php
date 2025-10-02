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
    $inst_id = session('sms_inst_id');
    $type = session('type');
    
    // Get blocks for the institute first
    $blocks = Block::where('institute_id', $inst_id)->pluck('name', 'id');
    
    // Start the query
    $query = Room::with(['type', 'block']);
    
    if ($type == 'school' || $type == 'college') {
        // Filter rooms by institute through the block relationship
        $query->whereHas('block', function ($q) use ($inst_id) {
            $q->where('institute_id', $inst_id);
        });
    }
    
    if ($request->search) {
        $query->where('name', 'like', '%' . $request->search . '%');
    }
    $permissions = [
        'can_add'    => auth()->user()->can('rooms-add'),
        'can_edit'   => auth()->user()->can('rooms-edit'),
        'can_delete' => auth()->user()->can('rooms-delete'),
    ];
    
     $query->orderBy('created_at', 'desc');
    // Add block filter
    if ($request->block) {
        $query->where('block_id', $request->block);
    }
    
    $rooms = $query->paginate(10)->withQueryString();

    return Inertia::render('rooms/Index', [
        'rooms' => $rooms,
        'filters' => [
            'search' => $request->search ?? '',
            'block' => $request->block ?? '',
        ],
        'blocks' => $blocks,
        'permissions' => $permissions,
    ]);
}
    public function create()
    {
        if (!auth()->user()->can('rooms-add')) {
        abort(403, 'You do not have permission to add Room.');
    }
        
        $roomTypes = RoomType::all();
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
    {
        
         if (!auth()->user()->can('rooms-edit')) {
        abort(403, 'You do not have permission to edit Room.');
    }$roomTypes = RoomType::all();
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
        if (!auth()->user()->can('rooms-delete')) {
        abort(403, 'You do not have permission to delete Room.');
    }
        $room->delete();
        return redirect()->back()->with('success', 'Room deleted successfully.');}
}
