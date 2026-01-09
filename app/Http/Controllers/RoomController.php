<?php
namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomType;

use App\Models\Block;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

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
    
   
        // Filter rooms by institute through the block relationship
        $query->whereHas('block', function ($q) use ($inst_id) {
            $q->where('institute_id', $inst_id);
        });
    
    
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
     if ($request->roomtype && !empty($request->roomtype) && $request->roomtype!=0) {
   $roomtypeIds = array_filter(explode(',', $request->roomtype));
            $query->whereHas('type', function ($q) use ($roomtypeIds) {
        $q->whereIn('id', $roomtypeIds);
       
    });
        }
    $rooms = $query->paginate(10)->withQueryString();
$roomtypes=RoomType::pluck('name', 'id');
    return Inertia::render('rooms/Index', [
        'rooms' => $rooms,
        'filters' => [
            'search' => $request->search ?? '',
            'block' => $request->block ?? '',
            'roomtype'=> $request->roomtype ?? '',
        ],
        'blocks' => $blocks,
        'permissions' => $permissions,
        'roomtypes'=>$roomtypes,
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
                        'img' => 'nullable|file',

        ]);
          $resultImageName = null;
        if ($request->hasFile('img')) {
            $resultImage = $request->file('img');
            $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
            
            $destinationPath = public_path('assets/room_img');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            (new ImageManager(new Driver()))->read($resultImage->getPathname())
                ->scale(width: 1280)
                ->save($destinationPath . '/' . $resultImageName, quality: 60);

            $data['img'] = 'room_img/' . $resultImageName;
        } else {
            unset($data['img']);
        }
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
             'img' => 'nullable|file',

        ]);
           $resultImageName = null;
        if ($request->hasFile('img')) {
                 if ($room->img) {
            $oldPath = public_path('assets/room_img/' . $room->img);
            if (File::exists($oldPath)) {
                File::delete($oldPath);
            }
        }
            $resultImage = $request->file('img');
            $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
            
            $destinationPath = public_path('assets/room_img');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            (new ImageManager(new Driver()))->read($resultImage->getPathname())
                ->scale(width: 1280)
                ->save($destinationPath . '/' . $resultImageName, quality: 60);

            $data['img'] = 'room_img/' . $resultImageName;
        } else {
            unset($data['img']);
        }
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
