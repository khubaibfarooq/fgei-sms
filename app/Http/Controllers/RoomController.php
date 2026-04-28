<?php
namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomType;

use App\Models\Block;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
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
        $query->where('rooms.name', 'like', '%' . $request->search . '%');
    }
    $permissions = [
        'can_add'    => auth()->user()->can('rooms-add'),
        'can_edit'   => auth()->user()->can('rooms-edit'),
        'can_delete' => auth()->user()->can('rooms-delete'),
    ];
    
    if ($request->orderBy) {
        if ($request->orderBy === 'Room Asc') {
            $query->orderBy('rooms.name', 'asc');
        } elseif ($request->orderBy === 'Room Desc') {
            $query->orderBy('rooms.name', 'desc');
        } elseif ($request->orderBy === 'Block Asc') {
             $query->select('rooms.*')->join('blocks', 'rooms.block_id', '=', 'blocks.id')->orderBy('blocks.name', 'asc');
        } elseif ($request->orderBy === 'Block Desc') {
             $query->select('rooms.*')->join('blocks', 'rooms.block_id', '=', 'blocks.id')->orderBy('blocks.name', 'desc');
        } elseif ($request->orderBy === 'RoomType Asc') {
             $query->select('rooms.*')->join('room_types', 'rooms.room_type_id', '=', 'room_types.id')->orderBy('room_types.name', 'asc');
        } elseif ($request->orderBy === 'RoomType Desc') {
             $query->select('rooms.*')->join('room_types', 'rooms.room_type_id', '=', 'room_types.id')->orderBy('room_types.name', 'desc');
        } else {
             $query->orderBy('rooms.id', 'asc');
        }
    } else {
        $query->orderBy('rooms.id', 'asc');
    }
    // Add block filter
    if ($request->block) {
        $query->where('rooms.block_id', $request->block);
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
            'orderBy' => $request->orderBy ?? '',
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
        try{
         
        if (!auth()->user()->can('rooms-delete')) {
        abort(403, 'You do not have permission to delete Room.');
    }
   $assets=DB::table('institute_assets')->where('room_id', $room->id)->get();
            $trans=DB::table('transaction_details')->where('room_id', $room->id)->get();
           if($assets->count()>0){
            return redirect()->back()->with('error', 'Room has assets. Please delete the assets first.');
           }
           if($trans->count()>0){
            return redirect()->back()->with('error', 'Room has transactions. Please delete the transactions first.');
           }
    if ($room->img) {
        $oldPath = public_path('assets/room_img/' . $room->img);
        if (File::exists($oldPath)) {
            File::delete($oldPath);
        }
    }
        $room->delete();
        return redirect()->back()->with('success', 'Room deleted successfully.');
        }catch(Exception $e){
            return redirect()->back()->with('error', 'Room deleted failed.'.$e->getMessage());
        }}
}
