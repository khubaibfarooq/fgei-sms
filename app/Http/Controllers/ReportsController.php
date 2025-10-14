<?php

namespace App\Http\Controllers;
use App\Models\Block;
use App\Models\Shift;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Institute;
use App\Models\InstituteAsset;
use App\Models\AssetCategory;
use App\Models\Asset;
use App\Models\Room;
use App\Models\VehicleType;
use App\Models\Transport;
use App\Models\Plant;
use App\Models\Upgradation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportsController extends Controller
{
    public function index(Request $request)
    {  $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = [];
 $regions=[];
    if($type=='Regional Office'){
    // Fetch and filter institutes
   

    $institutes = Institute::where('region_id', $regionid)
        ->select('id', 'name')
        ->get()
        ->filter(function ($institute) {
            return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
        })
        ->values();
    }else{
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')
          
            ->get()
            ->filter(function ($region) {
                return is_numeric($region->region_id) && 
                       $region->region_id > 0 && 
                       !empty(trim($region->region_id));
            })
            ->values();
    }  
    $instituteAssets =[];
  $blocks = [];
    $rooms =  [];
    
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {

        
         $blocks=Block::where('institute_id', $request->institute_id);
         $blockIds= $blocks->pluck('id')->toArray();
          $rooms =Room::whereIn('block_id',   $blockIds)->get();
         $instituteAssets= InstituteAsset::where('institute_id', $request->institute_id)->with([ 'institute', 'room', 'asset'])->get();
   $blocks->get();

    }
    if ($request->region_id && is_numeric($request->region_id) && $request->region_id > 0) {
       $institutes = Institute::where('region_id', $request->$regionid)
        ->select('id', 'name')
        ->get()
        ->filter(function ($institute) {
            return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
        })
        ->values();
 
    }

    return Inertia::render('Reports/Index', [
        'institutes' => $institutes,
        'blocks' => $blocks,
        'rooms' => $rooms,
      
      'regions' => $regions,
        'instituteAssets' => $instituteAssets,
        'filters' => [
            'search' => $request->search ?? '',
            'institute_id' =>$request->institute_id ?? '',
          'region_id' =>$request->region_id ?? '',
          
        ],
    ]);
        
    }
   
   public function getAllData(Request $request)
{   
    $instituteAssets = [];
    $blocks = [];
    $rooms = [];
    $institutes = []; // Assuming institutes are fetched somewhere
    $regions = []; // Assuming regions are fetched somewhere
    $shifts=[];
   $upgradations=[];
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
        $shifts=Shift::where('institute_id', $request->institute_id)->with('buildingType')->get();
      $upgradations=Upgradation::where('institute_id', $request->institute_id)->get();

        $blocks = Block::where('institute_id', $request->institute_id)->get();
        $blockIds = $blocks->pluck('id')->toArray();
        $rooms = Room::whereIn('block_id', $blockIds)->with('block')->get();
        $instituteAssets = InstituteAsset::where('institute_id', $request->institute_id)
            ->with(['institute', 'room', 'asset'])
            ->get();
    }

    return response()->json([
        'blocks' => $blocks,
        'rooms' => $rooms,
        'regions' => $regions,
        'instituteAssets' => $instituteAssets,
        'shifts'=>$shifts,
        'upgradations'=>$upgradations,
       
    ]);
}

    public function blocks(Request $request)
    {
        $id = $request->id;
        $query = Block::where('institute_id', $id);

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $blocks = $query->paginate(10)->withQueryString();
        $permissions = [
            'can_add'    => auth()->user()->can('block-add'),
            'can_edit'   => auth()->user()->can('block-edit'),
            'can_delete' => auth()->user()->can('block-delete'),
        ];

        return Inertia::render('Blocks/Index', [
            'blocks' => $blocks,
            'filters' => ['search' => $request->search ?? ''],
            'permissions' => $permissions,
        ]);
    }
//     public function assets(Request $request)
// {
//     $hrInstituteId = session('inst_id');
//     $regionid = session('region_id');

//     // Fetch and filter institutes
//     $institutes = Institute::where('region_id', $regionid)
//         ->select('id', 'name')
//         ->get()
//         ->filter(function ($institute) {
//             return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
//         })
//         ->values();

//     // Fetch and filter blocks based on institute_id
//     $blocks = $request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0
//         ? Block::where('institute_id', $request->institute_id)
//             ->select('id', 'name')
//             ->get()
//             ->filter(function ($block) {
//                 return is_numeric($block->id) && $block->id > 0 && !empty(trim($block->name));
//             })
//             ->values()
//         : [];

//     // Fetch and filter rooms based on block_id
//     $rooms = $request->block_id && is_numeric($request->block_id) && $request->block_id > 0
//         ? Room::where('block_id', $request->block_id)
//             ->select('id', 'name')
//             ->get()
//             ->filter(function ($room) {
//                 return is_numeric($room->id) && $room->id > 0 && !empty(trim($room->name));
//             })
//             ->values()
//         : [];

//     // Fetch and filter asset categories
//     $assetCategories = AssetCategory::select('id', 'name')
//         ->get()
//         ->filter(function ($category) {
//             return is_numeric($category->id) && $category->id > 0 && !empty(trim($category->name));
//         })
//         ->values();

//     // Fetch and filter assets based on asset_category_id
//     $assets = $request->asset_category_id && is_numeric($request->asset_category_id) && $request->asset_category_id > 0
//         ? Asset::where('asset_category_id', $request->asset_category_id)
//             ->select('id', 'name')
//             ->get()
//             ->filter(function ($asset) {
//                 return is_numeric($asset->id) && $asset->id > 0 && !empty(trim($asset->name));
//             })
//             ->values()
//         : [];

//     // Build the instituteAssets query
//     $query = InstituteAsset::query()->whereHas('institute', function ($q) use ($hrInstituteId) {
//         $q->where('hr_id', $hrInstituteId);
//     });

//     // Apply filters
//     if ($request->search) {
//         $query->where('details', 'like', '%' . $request->search . '%')
//               ->orWhereHas('assetCategory', function ($q) use ($request) {
//                   $q->where('name', 'like', '%' . $request->search . '%');
//               });
//     }
//     if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
//         $query->where('institute_id', $request->institute_id);
//     }
//     if ($request->block_id && is_numeric($request->block_id) && $request->block_id > 0) {
//         $query->where('block_id', $request->block_id);
//     }
//     if ($request->room_id && is_numeric($request->room_id) && $request->room_id > 0) {
//         $query->where('room_id', $request->room_id);
//     }
//     if ($request->asset_category_id && is_numeric($request->asset_category_id) && $request->asset_category_id > 0) {
//         $query->where('asset_category_id', $request->asset_category_id);
//     }
//     if ($request->asset_id && is_numeric($request->asset_id) && $request->asset_id > 0) {
//         $query->where('asset_id', $request->asset_id);
//     }

//     // Fetch institute assets with pagination
//     $instituteAssets = $query->with(['assetCategory', 'institute', 'block', 'room', 'asset'])->paginate(10)->withQueryString();

//     return Inertia::render('Reports/Assets', [
//         'institutes' => $institutes,
//         'blocks' => $blocks,
//         'rooms' => $rooms,
//         'assetCategories' => $assetCategories,
//         'assets' => $assets,
//         'instituteAssets' => $instituteAssets,
//         'filters' => [
//             'search' => $request->search ?? '',
//             'institute_id' => $request->institute_id ?? '',
//             'block_id' => $request->block_id ?? '',
//             'room_id' => $request->room_id ?? '',
//             'asset_category_id' => $request->asset_category_id ?? '',
//             'asset_id' => $request->asset_id ?? '',
//         ],
//     ]);
// }
public function assets(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = Institute::query();
    if($type=='Regional Office'){
    // Fetch and filter institutes
    $institutes = Institute::where('region_id', $regionid)
        ->select('id', 'name')
        ->get()
        ->filter(function ($institute) {
            return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
        })
        ->values();
    }
    // Fetch and filter blocks based on institute_id
    $blocks = [];

    // Fetch and filter rooms based on block_id
    $rooms =  [];

    // Fetch and filter asset categories
    $assetCategories = AssetCategory::select('id', 'name')
        ->get()
        ->filter(function ($category) {
            return is_numeric($category->id) && $category->id > 0 && !empty(trim($category->name));
        })
        ->values();

    $assets = [];



  

    // Fetch institute assets with related data
    $instituteAssets = new LengthAwarePaginator(
            collect([]), // Empty collection for items
            0,           // Total items
            10,          // Per page
            1,           // Current page
            ['path' => request()->url()] // Preserve query string
        );

    return Inertia::render('Reports/Assets', [
        'institutes' => $institutes,
        'blocks' => $blocks,
        'rooms' => $rooms,
        'assetCategories' => $assetCategories,
        'assets' => $assets,
        'instituteAssets' => $instituteAssets,
        'filters' => [
            'search' => '',
            'institute_id' =>'',
            'block_id' =>  '',
            'room_id' =>'',
            'asset_category_id' =>'',
            'asset_id' =>'',
        ],
    ]);
}
    // public function assets(Request $request)
    // {
    //     $hrInstituteId = session('inst_id');
    //     $regionid = session('region_id');

    //     $institutes = Institute::where('region_id', $regionid)->get();
    //     $blocks = $request->institute_id ? Block::where('institute_id', $request->institute_id)->get() : [];
    //     $rooms = $request->block_id ? Room::where('block_id', $request->block_id)->get() : [];
    //     $assetCategories = AssetCategory::all();
    //     $assets = $request->asset_category_id ? Asset::where('asset_category_id', $request->asset_category_id)->get() : [];

    //     $query = InstituteAsset::query()->whereHas('institute', function ($q) use ($hrInstituteId) {
    //         $q->where('hr_id', $hrInstituteId);
    //     });

    //     if ($request->search) {
    //         $query->where('details', 'like', '%' . $request->search . '%')
    //               ->orWhereHas('assetCategory', function ($q) use ($request) {
    //                   $q->where('name', 'like', '%' . $request->search . '%');
    //               });
    //     }
    //     if ($request->institute_id) {
    //         $query->where('institute_id', $request->institute_id);
    //     }
    //     if ($request->block_id) {
    //         $query->where('block_id', $request->block_id);
    //     }
    //     if ($request->room_id) {
    //         $query->where('room_id', $request->room_id);
    //     }
    //     if ($request->asset_category_id) {
    //         $query->where('asset_category_id', $request->asset_category_id);
    //     }
    //     if ($request->asset_id) {
    //         $query->where('asset_id', $request->asset_id);
    //     }

    //     $instituteAssets = $query->with(['assetCategory', 'institute', 'block', 'room', 'asset'])->paginate(10)->withQueryString();

    //     return Inertia::render('Reports/Assets', [
    //         'institutes' => $institutes,
    //         'blocks' => $blocks,
    //         'rooms' => $rooms,
    //         'assetCategories' => $assetCategories,
    //         'assets' => $assets,
    //         'instituteAssets' => $instituteAssets,
    //         'filters' => [
    //             'search' => $request->search ?? '',
    //             'institute_id' => $request->institute_id ?? '',
    //             'block_id' => $request->block_id ?? '',
    //             'room_id' => $request->room_id ?? '',
    //             'asset_category_id' => $request->asset_category_id ?? '',
    //             'asset_id' => $request->asset_id ?? '',
    //         ],
    //     ]);
    // }

    public function getBlocks(Request $request)
    {
        $instituteId = $request->institute_id;
        $blocks = Block::where('institute_id', $instituteId)->get();
        return response()->json($blocks);
    }

    public function getRooms(Request $request)
    {
        $blockId = $request->block_id;
        $rooms = Room::where('block_id', $blockId)->get();
        return response()->json($rooms);
    }

    public function getAssets(Request $request)
    {
        $assetCategoryId = $request->asset_category_id;
        $assets = Asset::where('asset_category_id', $assetCategoryId)->get();
        return response()->json($assets);
    }
     public function getInstituteAssets(Request $request)
    {
       $query = InstituteAsset::query();

    // Apply filters
    if ($request->search) {
        $query->where('details', 'like', '%' . $request->search . '%')
              ->orWhereHas('assetCategory', function ($q) use ($request) {
                  $q->where('name', 'like', '%' . $request->search . '%');
              });
    }
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
        $query->where('institute_id', $request->institute_id);
    }
    if ($request->block_id && is_numeric($request->block_id) && $request->block_id > 0) {
        $roomsids= Room::where('block_id', $request->block_id)->pluck('id')->toArray();
        $query->whereIn('room_id', $roomsids);
    }
    if ($request->room_id && is_numeric($request->room_id) && $request->room_id > 0) {
        $query->where('room_id', $request->room_id);
    }
    if ($request->asset_category_id && is_numeric($request->asset_category_id) && $request->asset_category_id > 0) {
        $assetsid= Asset::where('asset_category_id', $request->asset_category_id)->pluck('id')->toArray();
        $query->whereIn('asset_id', $assetsid);
        }
    if ($request->asset_id && is_numeric($request->asset_id) && $request->asset_id > 0) {
        $query->where('asset_id', $request->asset_id);
    }

    // Fetch institute assets with related data
    $instituteAssets = $query->with([ 'institute', 'room', 'asset'])->paginate(10)->withQueryString();
        return response()->json($instituteAssets);
    }

    public function transports(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = Institute::query();
    if($type=='Regional Office'){
    // Fetch and filter institutes
    $institutes = Institute::where('region_id', $regionid)
        ->select('id', 'name')
        ->get()
        ->filter(function ($institute) {
            return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
        })
        ->values();
    }
   

    // Fetch and filter asset categories
    $vehicleTypes = VehicleType::select('id', 'name')
        ->get()
        ->filter(function ($type) {
            return is_numeric($type->id) && $type->id > 0 && !empty(trim($type->name));
        })
        ->values();

 



  

    // Fetch institute assets with related data
    $transports = new LengthAwarePaginator(
            collect([]), // Empty collection for items
            0,           // Total items
            10,          // Per page
            1,           // Current page
            ['path' => request()->url()] // Preserve query string
        );

    return Inertia::render('Reports/Transport', [
        'institutes' => $institutes,
        'vehicleTypes' => $vehicleTypes,
        'transports' => $transports,
      
        'filters' => [
            'search' => '',
            'institute_id' =>'',
            'vehicle_type_id' =>  '',
        
        ],
    ]);
}

 public function getTransports(Request $request)
    {
       $query = Transport::query();

    // Apply filters
    if ($request->search) {
        $query->where('vehicle_no', 'like', '%' . $request->search . '%')
              ->orWhereHas('vehicleType', function ($q) use ($request) {
                  $q->where('name', 'like', '%' . $request->search . '%');
              });
    }
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
        $query->where('institute_id', $request->institute_id);
    }
    if ($request->vehicle_type_id && is_numeric($request->vehicle_type_id) && $request->vehicle_type_id > 0) {
        $vehicletypeids= VehicleType::where('id', $request->vehicle_type_id)->pluck('id')->toArray();
        $query->whereIn('vehicle_type_id', $vehicletypeids);
        }
  

    $transports = $query->with([ 'institute', 'vehicleType'])->paginate(10)->withQueryString();
        return response()->json($transports);
    }

        public function plants(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = Institute::query();
    if($type=='Regional Office'){
    // Fetch and filter institutes
    $institutes = Institute::where('region_id', $regionid)
        ->select('id', 'name')
        ->get()
        ->filter(function ($institute) {
            return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
        })
        ->values();
    }
   

    // Fetch institute assets with related data
    $plants = new LengthAwarePaginator(
            collect([]), // Empty collection for items
            0,           // Total items
            10,          // Per page
            1,           // Current page
            ['path' => request()->url()] // Preserve query string
        );

    return Inertia::render('Reports/Plants', [
        'institutes' => $institutes,
        'plants' => $plants,
      
        'filters' => [
            'search' => '',
            'institute_id' =>'',
          
        
        ],
    ]);
}

 public function getPlants(Request $request)
    {
       $query = Plant::query();

    // Apply filters
    if ($request->search) {
        $query->where('vehicle_no', 'like', '%' . $request->search . '%');

    }
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
        $query->where('institute_id', $request->institute_id);
    }
  
  

    $plants = $query->with([ 'institute'])->paginate(10)->withQueryString();
        return response()->json($plants);
    }
       public function upgradations(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = Institute::query();
    if($type=='Regional Office'){
    // Fetch and filter institutes
    $institutes = Institute::where('region_id', $regionid)
        ->select('id', 'name')
        ->get()
        ->filter(function ($institute) {
            return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
        })
        ->values();
    }
   

    // Fetch institute assets with related data
    $upgradations = new LengthAwarePaginator(
            collect([]), // Empty collection for items
            0,           // Total items
            10,          // Per page
            1,           // Current page
            ['path' => request()->url()] // Preserve query string
        );

    return Inertia::render('Reports/Upgradations', [
        'institutes' => $institutes,
        'upgradations' => $upgradations,
      
        'filters' => [
            'search' => '',
            'institute_id' =>'',
          
        
        ],
    ]);
}

 public function getUpgradations(Request $request)
    {
       $query = Upgradation::query();

    // Apply filters
    if ($request->search) {
        $query->where('details', 'like', '%' . $request->search . '%');

    }
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
        $query->where('institute_id', $request->institute_id);
    }
  
  

    $upgradations = $query->with([ 'institute'])->paginate(10)->withQueryString();
        return response()->json($upgradations);
    }
}