<?php
namespace App\Http\Controllers;

use App\Models\Block;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BlockType;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
class BlockController extends Controller
{
    public function index(Request $request)
    {

      
$inst_id = session('sms_inst_id');
$type=session('type');
  $query = Block::Where('institute_id', $inst_id)->with('institute','rooms');
        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
            ->Where('institute_id', $inst_id);
                  
        }

       

        $blocks = $query->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('block-add'),
        'can_edit'   => auth()->user()->can('block-edit'),
        'can_delete' => auth()->user()->can('block-delete'),
    ];
    $blocks->getCollection()->transform(function ($block) {
    $block->rooms_count = $block->rooms->count();
    return $block;
});
        return Inertia::render('blocks/Index', [
            'blocks' => $blocks,
            'filters' => ['search' => $request->search ?? ''],
                'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if(!auth()->user()->can('block-add')){
            abort(403);
        }
        $blockTypes = BlockType::pluck('name', 'id')->toArray();
        $roomTypes = \App\Models\RoomType::pluck('name', 'id')->toArray();

        return Inertia::render('blocks/Form', ['block' => null, 'blockTypes' => $blockTypes, 'roomTypes' => $roomTypes]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            // accept uploaded image files
            'img' => 'nullable|file',
            'area' => 'required|numeric',
           'block_type_id' => 'required|exists:block_types,id',
           'establish_date' => 'nullable|date',
           'rooms' => 'nullable|array',
           'rooms.*.name' => 'required_with:rooms|string|max:255',
           'rooms.*.area' => 'required_with:rooms|numeric',
           'rooms.*.room_type_id' => 'required_with:rooms|exists:room_types,id',
           'rooms.*.img' => 'nullable|file',
        ]);
        $data['institute_id'] = session('sms_inst_id');
        $resultImageName = null;
        if ($request->hasFile('img')) {
            $resultImage = $request->file('img');
            $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
            
            $destinationPath = public_path('assets/block_img');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            (new ImageManager(new Driver()))->read($resultImage->getPathname())
                ->scale(width: 1280)
                ->save($destinationPath . '/' . $resultImageName, quality: 60);

            $data['img'] = 'block_img/' . $resultImageName;
        } else {
            unset($data['img']);
        }

        $roomsData = $data['rooms'] ?? [];
        unset($data['rooms']);

        $block = Block::create($data);

        if (!empty($roomsData)) {
            foreach ($roomsData as $index => $roomData) {
                $roomImageName = null;
                if ($request->hasFile("rooms.{$index}.img")) {
                    $roomImage = $request->file("rooms.{$index}.img");
                    $roomImageName = time() . '-' . uniqid() . '.' . $roomImage->getClientOriginalExtension();
                    
                    $destinationPath = public_path('assets/room_img');
                    if (!file_exists($destinationPath)) {
                        mkdir($destinationPath, 0755, true);
                    }

                    (new ImageManager(new Driver()))->read($roomImage->getPathname())
                        ->scale(width: 1280)
                        ->save($destinationPath . '/' . $roomImageName, quality: 60);

                    $roomData['img'] = 'room_img/' . $roomImageName;
                } else {
                    unset($roomData['img']);
                }

                $roomData['institute_id'] = session('sms_inst_id');
                $roomData['block_id'] = $block->id;
                \App\Models\Room::create($roomData);
            }
        }

        return redirect()->back()->with('success', 'Block saved successfully.');
    }
    public function edit(Block $block)
    {if (!auth()->user()->can('block-edit')) {
        abort(403, 'You do not have permission to edit a block.');
    }
     $blockTypes = BlockType::pluck('name', 'id')->toArray();
     $roomTypes = \App\Models\RoomType::pluck('name', 'id')->toArray();
        return Inertia::render('blocks/Form', [
            'block' => $block,
            'blockTypes' => $blockTypes,
            'roomTypes' => $roomTypes
        ]);
    }
    public function update(Request $request, Block $block)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
            'block_type_id' => 'required|exists:block_types,id',
            // accept uploaded image files
            'img' => 'nullable|file',
            'establish_date' => 'nullable|date',
        ]);
        $data['institute_id'] = session('sms_inst_id');
        $resultImageName = null;
        if ($request->hasFile('img')) {
                 if ($block->img) {
            $oldPath = public_path('assets/block_img/' . $block->img);
            if (File::exists($oldPath)) {
                File::delete($oldPath);
            }
        }
            $resultImage = $request->file('img');
            $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
            
            $destinationPath = public_path('assets/block_img');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            (new ImageManager(new Driver()))->read($resultImage->getPathname())
                ->scale(width: 1280)
                ->save($destinationPath . '/' . $resultImageName, quality: 60);

            $data['img'] = 'block_img/' . $resultImageName;
        } else {
            unset($data['img']);
        }
       
        $block->update($data);
        return redirect()->back()->with('success', 'Block updated successfully.');
    }
    public function destroy(Block $block)
    {
        try{
        if (!auth()->user()->can('block-delete')) {
        abort(403, 'You do not have permission to delete a block.');
    }
    $rooms=DB::table('rooms')->where('block_id', $block->id)->get();
    $trans=DB::table('transaction_details')->where('block_id', $block->id)->get();

    if($rooms->count()>0){
        return redirect()->back()->with('error', 'Block has rooms. Please delete the rooms first.');
    }
       if($trans->count()>0){
            return redirect()->back()->with('error', 'Block has transactions. Please delete the transactions first.');
           }
    if ($block->img) {
        $oldPath = public_path('assets/block_img/' . $block->img);
        if (File::exists($oldPath)) {
            File::delete($oldPath);
        }
    }
        $block->delete();   
        return redirect()->back()->with('success', 'Block deleted successfully.');
    }catch(Exception $e){
            return redirect()->back()->with('error', 'Block deleted failed.'.$e->getMessage());
        }}
}
