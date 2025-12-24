<?php

namespace App\Http\Controllers;
use App\Models\Block;
use App\Models\BlockType;
use App\Models\RoomType;
use App\Models\Shift;
use App\Models\Type;

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
use App\Models\Project;
use App\Models\ProjectType;
use App\Models\FundHeld;
use App\Models\Fund;
use App\Models\FundHead;
use App\Models\Upgradation;
use App\Models\User;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Support\Facades\DB;
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
    $institute="";
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')  ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')->get()
            ->filter(function ($region) {
                return is_numeric($region->id) && 
                       $region->id > 0 && 
                       !empty(trim($region->id));
            })
            ->values();
    }  
 
    $instituteAssets =[];
  $blocks = [];
    $rooms =  [];
    $shifts=[];
   $upgradations=[];
    $funds=[];
    $projects=[];
    $transports=[];
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {

               $institute=Institute::find($request->institute_id);
              $blocks = Block::where('institute_id', $request->institute_id)->get();
        $blockIds = $blocks->pluck('id')->toArray();
        $rooms = Room::whereIn('block_id', $blockIds)->with('block')->get();
           $instituteAssets = InstituteAsset::query()
        ->where('institute_id', $request->institute_id)
        ->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
        ->select([
            'assets.id',
            'assets.name',
            DB::raw('SUM(institute_assets.current_qty) as total_qty'),
            DB::raw('COUNT(DISTINCT institute_assets.room_id) as locations_count')
        ])
        ->with(['institute', 'room', 'asset'])
        ->groupBy('assets.id', 'assets.name')
        ->orderBy('assets.name')
        ->get();
    
        
 
       $shifts=Shift::where('institute_id', $request->institute_id)->with('buildingType')->get();
      $upgradations=Upgradation::where('institute_id', $request->institute_id)->get();
    $funds=FundHeld::where('institute_id', $request->institute_id)->with('fundHead')->get();
    $transports=Transport::where('institute_id', $request->institute_id)->with('vehicleType')->get();
$projects = ProjectType::whereHas('projects', function($query) use ($request) {
        $query->where('institute_id', $request->institute_id);
    })
    ->withCount([
        'projects as completed' => function($query) use ($request) {
            $query->where('institute_id', $request->institute_id)
                  ->where('status', 'completed');
        },
        'projects as inprogress' => function($query) use ($request) {
            $query->where('institute_id', $request->institute_id)
                  ->where('status', 'inprogress');
        },
        'projects as planned' => function($query) use ($request) {
            $query->where('institute_id', $request->institute_id)
                  ->where('status', 'planned');
        }
    ])
    ->get();  
    }
    if ($request->region_id && is_numeric($request->region_id) && $request->region_id > 0) {
       $institutes = Institute::where('region_id', $request->region_id)
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
      'institute'=>$institute,
      'regions' => $regions,
        'instituteAssets' => $instituteAssets,
        'shifts' => $shifts,
        'upgradations' => $upgradations,
        'funds' => $funds,
        'projects' => $projects,
        'transports' => $transports,
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
 
    $shifts=[];
   $upgradations=[];
    $funds=[];
    $projects=[];
    $transports=[];
    $institute=[];
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {
        $institute=Institute::find($request->institute_id);
        $shifts=Shift::where('institute_id', $request->institute_id)->with('buildingType')->get();
      $upgradations=Upgradation::where('institute_id', $request->institute_id)->get();
    $funds=FundHeld::where('institute_id', $request->institute_id)->with('fundHead')->get();
        $transports=Transport::where('institute_id', $request->institute_id)->with('vehicleType')->get();
        $blocks = Block::where('institute_id', $request->institute_id)->get();
        $blockIds = $blocks->pluck('id')->toArray();
        $rooms = Room::whereIn('block_id', $blockIds)->with('block')->get();
        // $instituteAssets = InstituteAsset::where('institute_id', $request->institute_id)
        //     ->with(['institute', 'room', 'asset'])
        //     ->get();
       
              $instituteAssets = InstituteAsset::query()
        ->where('institute_id', $request->institute_id)
        ->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
        ->select([
            'assets.id',
            'assets.name',
            DB::raw('SUM(institute_assets.current_qty) as total_qty'),
            DB::raw('COUNT(DISTINCT institute_assets.room_id) as locations_count')
        ])
        ->with(['institute', 'room', 'asset'])
        ->groupBy('assets.id', 'assets.name')
        ->orderBy('assets.name')
        ->get();
$projects = ProjectType::whereHas('projects', function($query) use ($request) {
        $query->where('institute_id', $request->institute_id);
    })
    ->withCount([
        'projects as completed' => function($query) use ($request) {
            $query->where('institute_id', $request->institute_id)
                  ->where('status', 'completed');
        },
        'projects as inprogress' => function($query) use ($request) {
            $query->where('institute_id', $request->institute_id)
                  ->where('status', 'inprogress');
        },
        'projects as planned' => function($query) use ($request) {
            $query->where('institute_id', $request->institute_id)
                  ->where('status', 'planned');
        }
    ])
    ->get();  
}

    return response()->json([
'institute'=>$institute,
        'blocks' => $blocks,
        'rooms' => $rooms,
     
        'instituteAssets' => $instituteAssets,
        'shifts'=>$shifts,
        'upgradations'=>$upgradations,
        'funds'=>$funds,
        'projects'=>$projects,
        'transports'=>$transports,
       
    ]);
}

    public function blocks(Request $request)
    {
        $hrInstituteId = session('inst_id');
        $regionid = session('region_id');
        $type = session('type');
        $institutes = Institute::query();
        
        $regions = [];
        if($type == 'Regional Office'){
            // Fetch and filter institutes
            $institutes = Institute::where('region_id', $regionid)
                ->select('id', 'name')
                ->get()
                ->filter(function ($institute) {
                    return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
                })
                ->values();
        } else {
            $regions = Institute::select('region_id as id', 'name')
                ->where('type', 'Regional Office')
                ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
                ->get()
                ->filter(function ($region) {
                    return is_numeric($region->id) && 
                           $region->id > 0 && 
                           !empty(trim($region->id));
                })
                ->values();
        }
        
        // Initialize empty blocks
        $blocks = new LengthAwarePaginator(
            collect([]), // Empty collection for items
            0,           // Total items
            10,          // Per page
            1,           // Current page
            ['path' => request()->url()] // Preserve query string
        );
        $blocktypes=BlockType::all();
        return Inertia::render('Reports/Blocks', [
            'institutes' => $institutes,
            'blocks' => $blocks,
            'regions' => $regions,
            'blocktypes'=>$blocktypes,
            'filters' => [
                'search' => '',
                'institute_id' => '',
                'region_id' => '',
                'blocktype_id'=>'',
            ],
        ]);
    }
     public function rooms(Request $request)
    {
        $hrInstituteId = session('inst_id');
        $regionid = session('region_id');
        $type = session('type');
        $institutes = Institute::query();
         // Initialize empty rooms
        $rooms = new LengthAwarePaginator(
            collect([]), // Empty collection for items
            0,           // Total items
            10,          // Per page
            1,           // Current page
            ['path' => request()->url()] // Preserve query string
        );
     
        $regions = [];
        if($type == 'Regional Office'){
            // Fetch and filter institutes
            $institutes = Institute::where('region_id', $regionid)
                ->select('id', 'name')
                ->get()
                ->filter(function ($institute) {
                    return is_numeric($institute->id) && $institute->id > 0 && !empty(trim($institute->name));
                })
                ->values();
                  if($request->roomtype_id  && !empty($request->roomtype_id) && $request->roomtype_id!=0){
               $roomtypeIds = array_filter(explode(',', $request->roomtype_id));

           $rooms=Room::query()->with(['type', 'block.institute'])->where('region_id', $regionid)->whereHas('type', function ($q) use ($roomtypeIds) {
                $q->whereIn('id', $roomtypeIds);
            })->paginate(10)->withQueryString();
        }
        } else {
            $regions = Institute::select('region_id as id', 'name')
                ->where('type', 'Regional Office')
                ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
                ->get()
                ->filter(function ($region) {
                    return is_numeric($region->id) && 
                           $region->id > 0 && 
                           !empty(trim($region->id));
                })
                ->values();
                  if($request->roomtype_id  && !empty($request->roomtype_id) && $request->roomtype_id!=0){
               $roomtypeIds = array_filter(explode(',', $request->roomtype_id));

           $rooms=Room::query()->with(['type', 'block'])->whereHas('type', function ($q) use ($roomtypeIds) {
                $q->whereIn('id', $roomtypeIds);
            })->paginate(10)->withQueryString();
        }
        }
      

        $roomtypes = RoomType::all();
        return Inertia::render('Reports/Rooms', [
            'institutes' => $institutes,
            'rooms' => $rooms,
            'regions' => $regions,
            'roomtypes'=>$roomtypes,
            'filters' => [
                'search' => '',
                'institute_id' => '',
                'region_id' => '',
                'roomtype_id'=>'',
            ],
        ]);
    }
public function assets(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = Institute::query();
   
    
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')  ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')->get()
            ->filter(function ($region) {
                return is_numeric($region->id) && 
                       $region->id > 0 && 
                       !empty(trim($region->id));
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

    $assets = Asset::select('id', 'name')->orderBy('name', 'asc')
        ->get()
        ->filter(function ($asset) {
            return is_numeric($asset->id) && $asset->id > 0 && !empty(trim($asset->name));
        })
        ->values();



  

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
        'regions'=>$regions,
        'filters' => [
            'search' => '',
            'institute_id' =>'',
            'block_id' =>  '',
            'room_id' =>'',
            'asset_category_id' =>'',
            'asset_id' =>'',
            'region_id' =>'',
            'details'=>''
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
        $query = Block::query();

        // Apply filters
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('institute_id') && is_numeric($request->institute_id) && $request->institute_id>0) {
            $query->where('institute_id', $request->institute_id);
        }

        if ($request->filled('blocktype_id') && is_numeric($request->blocktype_id) && $request->blocktype_id>0) {
            $query->where('block_type_id', $request->blocktype_id);
        }

        if ($request->filled('region_id') && is_numeric($request->region_id) && $request->region_id>0) {
            $query->whereHas('institute', function ($q) use ($request) {
                $q->where('region_id', $request->region_id);
            });
        }

        // Eager load relationships
        $query->with(['institute', 'blockType']);

        // Handle pagination
        if ($request->boolean('all') || $request->get('export')) {
            $blocks = $query->get();
        } else {
            $blocks = $query->paginate(15)->withQueryString();
        }

        return response()->json($blocks);
    }

    public function getRooms(Request $request)
    {
        $blockId = $request->block_id;
        $rooms = Room::where('block_id', $blockId)->get();
        return response()->json($rooms);
    }
   public function getInstituteBlocks(Request $request)
    {
        $instituteId = $request->institute_id;
  $blocks = Block::where('institute_id', $instituteId)->get();
          return response()->json($blocks);
    }
    public function getRoomsReport(Request $request)
    {
        $query = Room::query();

        // Apply filters
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('institute_id') && is_numeric($request->institute_id) && $request->institute_id > 0) {
            $query->whereHas('block', function ($q) use ($request) {
                $q->where('institute_id', $request->institute_id);
            });
        }

        if ($request->filled('block_id') && is_numeric($request->block_id) && $request->block_id > 0) {
            $query->where('block_id', $request->block_id);
        }

        if ($request->filled('roomtype_id') && is_numeric($request->roomtype_id) && $request->roomtype_id > 0) {
            $query->where('room_type_id', $request->roomtype_id);
        }

        if ($request->filled('region_id') && is_numeric($request->region_id) && $request->region_id > 0) {
            $query->whereHas('block.institute', function ($q) use ($request) {
                $q->where('region_id', $request->region_id);
            });
        }

        // Eager load relationships
        $query->with(['block.institute', 'type']);

        // Handle pagination
        if ($request->boolean('all') || $request->get('export')) {
            $rooms = $query->get();
        } else {
            $rooms = $query->paginate(15)->withQueryString();
        }

        return response()->json($rooms);
    }


    public function getAssets(Request $request)
    {
        $assetCategoryId = $request->asset_category_id;
        if($assetCategoryId!=0){
        $assets = Asset::where('asset_category_id', $assetCategoryId)->orderBy('name', 'asc')->get();
        return response()->json($assets);
        }
                $assets = Asset::orderBy('name', 'asc')->get();

        return response()->json($assets);        
    }
   public function getInstitutes(Request $request)
{
    try {
        $request->validate([
            'region_id' => 'nullable|integer|min:1',
        ]);

        $query = Institute::query()->select('id', 'name');

        if ($request->region_id && is_numeric($request->region_id) && $request->region_id > 0) {
            $query->where('region_id', $request->region_id);
        }

        $institutes = $query->get()
            ->filter(function ($institute) {
                return is_numeric($institute->id) && 
                       $institute->id > 0 && 
                       !empty(trim($institute->name ?? ''));
            })
            ->values();

        return response()->json($institutes);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Failed to fetch institutes'], 500);
    }
}
   public function getInstituteAssets(Request $request)
{
    $query = InstituteAsset::query();

    // Apply filters (same as before)
    
        if ($request->filled('region_id') && is_numeric($request->region_id) && $request->region_id!=0) {
        $query->whereHas('institute', function ($q) use ($request) {
            $q->where('region_id', $request->region_id);
        });
    }
    if ($request->filled('institute_id') && is_numeric($request->institute_id) && $request->institute_id!=0) {
        $query->where('institute_id', $request->institute_id);
    }

    if ($request->filled('block_id') && is_numeric($request->block_id) && $request->block_id!=0) {
        $roomIds = Room::where('block_id', $request->block_id)->pluck('id');
        $query->whereIn('room_id', $roomIds);
    }
    if ($request->filled('room_id') && is_numeric($request->room_id) && $request->room_id!=0) {
        $query->where('room_id', $request->room_id);
    }
    if ($request->filled('asset_category_id') && is_numeric($request->asset_category_id) && $request->asset_category_id!=0) {
        $assetIds = Asset::where('asset_category_id', $request->asset_category_id)->pluck('id');
        $query->whereIn('asset_id', $assetIds);
    }
    if ($request->filled('asset_id') && is_numeric($request->asset_id) && $request->asset_id!=0) {
        $query->where('asset_id', $request->asset_id);
    }

    // KEY FIX: Always eager load relationships
    $query->with(['asset.category', 'room.block', 'institute']);

    // Only group/summarize when NOT in details mode
    if (!$request->boolean('details')) {
        $query->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
              ->select([
                  'assets.id',
                  'assets.name',
                  DB::raw('SUM(institute_assets.current_qty) as total_qty'),
                  DB::raw('COUNT(DISTINCT institute_assets.room_id) as locations_count')
              ])
              ->groupBy('assets.id', 'assets.name')
              ->orderBy('assets.name');
    } else {
        // In detailed mode: select full institute_assets + relationships already loaded via with()
        $query->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
        ->join('asset_categories','asset_categories.id','=','assets.asset_category_id')
        ->select('institute_assets.*'); // Important: select from institute_assets
        $query->orderBy('asset_categories.name', 'asc','assets.name','asc');
    }
    if ($request->filled('search')) {
        $query->where(function($q) use ($request) {
            $q->orWhereHas('asset', fn($sq) => $sq->where('name', 'like', '%' . $request->search . '%'))
              ->orWhereHas('institute', fn($sq) => $sq->where('name', 'like', '%' . $request->search . '%'))
              ->orWhereHas('asset.category', fn($sq) => $sq->where('name', 'like', '%' . $request->search . '%'));

        });
    }

    // Handle export (all data, no pagination)
    if ($request->boolean('all') || $request->get('export')) {
        $instituteAssets = $query->get();
    } else {
        $instituteAssets = $query->paginate(15)->withQueryString();
    }

    return response()->json($instituteAssets);
}

    public function transports(Request $request)
{
    $hrInstituteId = session('inst_id');
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
    ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
    ->get()
            ->filter(function ($region) {
                return is_numeric($region->id) && 
                       $region->id > 0 && 
                       !empty(trim($region->id));
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
      'regions'=>$regions,
        'filters' => [
            'search' => '',
            'institute_id' =>'',
            'vehicle_type_id' =>  '',
         'region_id' =>  '',
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
        $query->where('vehicle_type_id', $request->vehicle_type_id);
    }

    if ($request->region_id && is_numeric($request->region_id) && $request->region_id > 0) {
        $query->whereHas('institute', function ($q) use ($request) {
            $q->where('region_id', $request->region_id);
        });
    }

    $transports = $query->with(['institute', 'vehicleType'])
                        ->paginate(10)
                        ->withQueryString();

    return response()->json($transports);
}

        public function plants(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
$type=session('type');
 $institutes = Institute::query();
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
->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')->get()
            ->filter(function ($region) {
                return is_numeric($region->id) && 
                       $region->id > 0 && 
                       !empty(trim($region->id));
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
      'regions'=>$regions,
        'filters' => [
            'search' => '',
            'institute_id' =>'',
          'region_id' =>'',
        
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')  ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')->get()
            ->filter(function ($region) {
                return is_numeric($region->id) && 
                       $region->id > 0 && 
                       !empty(trim($region->id));
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
       'regions'=>$regions,
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

  
    public function Projects(Request $request)
    {
        $hrInstituteId = session('inst_id');
        $regionid      = session('region_id');
        $type          = session('type');

        $institutes = Institute::query();
        $regions    = [];
   $projects = new LengthAwarePaginator(
            collect([]),
            0,
            10,
            1,
            ['path' => $request->url()]
        );
        // -----------------------------------------------------------------
        // Regional Office → only its own institutes
        // -----------------------------------------------------------------
        if ($type === 'Regional Office') {
             if($request->status ){
                        $query = Project::query()->with(['institute', 'projecttype', 'currentStage']);
            $query->where('status', $request->status)->whereHas('institute', function ($q) use ($regionid) {
                $q->where('region_id', $regionid);
            });
            $projects = $query->paginate(10)->withQueryString();
 $projects->getCollection()->transform(function ($project) {
            $project->region = $project->institute?->region;
            return $project;
        });}
            $institutes = Institute::where('region_id', $regionid)
                ->select('id', 'name')
                ->get()
                ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && !empty(trim($i->name)))
                ->values();
        }
        // -----------------------------------------------------------------
        // Super-admin / HQ → all regions
        // -----------------------------------------------------------------
        else {
            if($request->status ){
                        $query = Project::query()->with(['institute', 'projecttype', 'currentStage']);
            $query->where('status', $request->status);
            $projects = $query->paginate(10)->withQueryString();
 $projects->getCollection()->transform(function ($project) {
            $project->region = $project->institute?->region;
            return $project;
        });
              
            }
            $regions = Institute::select('region_id as id','name')
                ->where('type', 'Regional Office')
               ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
                ->get()
                ->filter(fn($r) => is_numeric($r->id) && $r->id > 0 && !empty(trim($r->name)))
                ->values();
        }

        // -----------------------------------------------------------------
        // Project Types (always available)
        // -----------------------------------------------------------------
        $projectTypes = ProjectType::select('id', 'name')
            ->get()
            ->filter(fn($pt) => is_numeric($pt->id) && $pt->id > 0 && !empty(trim($pt->name)))
            ->values();

        // -----------------------------------------------------------------
        // Empty paginator – Inertia will fill it via getProjects()
        // -----------------------------------------------------------------
     

        // -----------------------------------------------------------------
        // Fund Heads (always available)
        // -----------------------------------------------------------------
        $fundHeads = FundHead::select('id', 'name')->where('type', 'regional')->get();

        return Inertia::render('Reports/Projects', [
            'institutes'    => $institutes,
            'regions'       => $regions,
            'projectTypes'  => $projectTypes,
            'fundHeads'     => $fundHeads,
            'projects'      => $projects,
            'filters'       => [
                'search'          => '',
                'institute_id'    => '',
                'region_id'       => '',
                'project_type_id' => '',
                'status'          => $request->status ?? '',
            ],
        ]);
    }
 public function Transactions(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionId      = session('region_id');
    $userType      = session('type'); // e.g., 'Regional Office', 'Super Admin', 'HQ'

    // -----------------------------------------------------------------
    // 1. Build filter options based on user role
    // -----------------------------------------------------------------
    $institutes = collect();
    $regions    = collect();
    $users      = User::select('id', 'name')
        ->whereNotNull('name')
        ->where('name', '!=', '')
        ->orderBy('name')
        ->get()
        ->filter(fn($u) => is_numeric($u->id) && $u->id > 0 && trim($u->name) !== '')
        ->values();

    // Regional Office → only institutes in their region
    if ($userType === 'Regional Office' && $regionId) {
        $institutes = Institute::where('region_id', $regionId)
            ->select('id', 'name')
            ->get()
            ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && trim($i->name) !== '')
            ->values();
    }
    // Super Admin / HQ → all regions + all institutes
    else {
        // Regions: one entry per region (using Regional Office institutes)
        $regions = Institute::select('region_id as id','name')
             ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
            ->where('type', 'Regional Office')
         
            ->get()
            ->filter(fn($r) => is_numeric($r->id) && $r->id > 0 && trim($r->name) !== '')
            ->values();

        // All institutes (optional: limit to active ones)
        $institutes = Institute::select('id', 'name')
            ->get()
            ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && trim($i->name) !== '')
            ->values();
    }

    // -----------------------------------------------------------------
    // 2. Empty paginator for initial load (Inertia will fetch via AJAX)
    // -----------------------------------------------------------------
    $emptyPaginator = new LengthAwarePaginator(
        collect([]),
        0,
        15, // same per_page as in getTransactions()
        1,
        [
            'path' => $request->url(),
            'pageName' => 'page',
        ]
    );

    // -----------------------------------------------------------------
    // 3. Return to Inertia with all needed props
    // -----------------------------------------------------------------
    $types = Type::select('id', 'name')->whereNull('parent_id')->get();

    return Inertia::render('Reports/Transactions', [
        'institutes' => $institutes,
        'regions'    => $regions,
        'users'      => $users,
        'types'      => $types,

        'transactions' => $emptyPaginator,

        'filters' => [
            'search'        => $request->get('search', ''),
            'institute_id'  => $request->get('institute_id', ''),
            'region_id'     => $request->get('region_id', ''),
            'added_by'      => $request->get('added_by', ''),
            'approved_by'   => $request->get('approved_by', ''),
            'type'          => $request->get('type', ''),
            'status'        => $request->get('status', ''),
            'date_from'     => $request->get('date_from', ''),
            'date_to'       => $request->get('date_to', ''),
        ],
    ]);
}
    /**
     * AJAX – return filtered projects (JSON)
     */
    public function getProjects(Request $request)
    {
        $hrInstituteId = session('inst_id');
        $regionid      = session('region_id');
        $type          = session('type');

        $query = Project::query()->with(['institute', 'projecttype', 'currentStage']);

        // -----------------------------------------------------------------
        // Global search
        // -----------------------------------------------------------------
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // -----------------------------------------------------------------
        // Institute filter
        // -----------------------------------------------------------------
        if ($request->filled('institute_id') && is_numeric($request->institute_id) && $request->institute_id > 0) {
            $query->where('institute_id', $request->institute_id);
        }

        // -----------------------------------------------------------------
        // Region filter (only for non-Regional users)
        // -----------------------------------------------------------------
        if ($request->filled('region_id') && $request->region_id !== '0' && is_numeric($request->region_id)) {
            $query->whereHas('institute', fn($q) => $q->where('region_id', $request->region_id));
        }
        // Regional Office user – restrict to own region automatically
        elseif ($type === 'Regional Office') {
            $query->whereHas('institute', fn($q) => $q->where('region_id', $regionid));
        }

        // -----------------------------------------------------------------
        // Project-type filter
        // -----------------------------------------------------------------
        if ($request->filled('project_type_id') && $request->project_type_id !== '0' && is_numeric($request->project_type_id)) {
            $query->where('project_type_id', $request->project_type_id);
        }

        // -----------------------------------------------------------------
        // Status filter
        // -----------------------------------------------------------------
        if ($request->filled('status') && in_array($request->status, ['planned', 'inprogress', 'completed'])) {
            $query->where('status', $request->status);
        }

        // -----------------------------------------------------------------
        // Pagination
        // -----------------------------------------------------------------
        $projects = $query->paginate(10)->withQueryString();

        // Attach region name for the front-end (if not already eager-loaded)
        $projects->getCollection()->transform(function ($project) {
            $project->region = $project->institute?->region;
            return $project;
        });

        return response()->json($projects);
    }


public function getByTid(Request $request){
    $tid = $request->tid;
    $transaction = Transaction::with(['institute', 'addedBy', 'approvedBy'])
        ->where('id', $tid)
        ->first();

    if (!$transaction) {
        return response()->json(['error' => 'Transaction not found.'], 404);
    }

    $transdetails = TransactionDetail::where('tid', $tid)
        ->with(['asset', 'room', 'fundHead'])
        ->get();

    return response()->json([
        'transaction'   => $transaction,
        'transdetails'  => $transdetails,
    ]);
}
public function ApproveTransaction(Request $request)
{
    $tid = $request->tid;

    return DB::transaction(function () use ($tid) {
        $transaction = Transaction::with(['Type', 'subType'])->find($tid);

        if (!$transaction) {
            throw new \Exception('Transaction not found.');
        }

        $transdetails = TransactionDetail::where('tid', $tid)->get();

        foreach ($transdetails as $detail) {
            $asset = $detail->asset_id;
            $assetname = $asset ? Asset::find($asset)->name : null;
            $quantity = $detail->qty;
            $institute_id = $transaction->institute_id;
            $room = $detail->room_id;
            $fundhead = $detail->fund_head_id;
            $type = $transaction->Type?->name;
            $subType = $transaction->subType?->name;

            // Update InstituteAsset stock
            if ($type == 'purchase') {
                $instituteAsset = InstituteAsset::where('institute_id', $institute_id)
                    ->where('asset_id', $asset)
                    ->where('room_id', $room)
                    ->first();

                if ($instituteAsset) {
                    // Asset exists in the room, update quantity
                    $instituteAsset->current_qty += $quantity;
                    $instituteAsset->save();
                } else {
                    // Asset does not exist in the room, create new record
                    InstituteAsset::create([
                        'institute_id' => $institute_id,
                        'asset_id'     => $asset,
                        'room_id'      => $room,
                        'current_qty'  => $quantity,
                        'added_date'   => now(),
                        'details'      => $assetname,
                        'added_by'=> auth()->user()->id,
                    ]);
                }

                // Update fund held (deduct for purchase)
                $fundHeld = FundHeld::where('institute_id', $institute_id)
                    ->where('fund_head_id', $fundhead)
                    ->first();

                if ($fundHeld) {
                    $fundHeld->balance -= $detail->amount;
                    $fundHeld->save();
                }
            }
            elseif ($type == 'condemned') {
                $instituteAsset = InstituteAsset::where('institute_id', $institute_id)
                    ->where('asset_id', $asset)
                    ->where('room_id', $room)
                    ->first();

                if ($instituteAsset) {
                    // Reduce quantity
                    $instituteAsset->current_qty -= $quantity;
                    if ($instituteAsset->current_qty < 0) {
                        $instituteAsset->current_qty = 0; // Prevent negative stock
                    }
                    $instituteAsset->save();
                }

                // Update fund held (add back for condemned)
                $fundHeld = FundHeld::where('institute_id', $institute_id)
                    ->where('fund_head_id', $fundhead)
                    ->first();

                if ($fundHeld) {
                    $fundHeld->balance += $detail->amount;
                    $fundHeld->save();
                } else {
                    FundHeld::create([
                        'institute_id'  => $institute_id,
                        'fund_head_id'  => $fundhead,
                        'balance'       => $detail->amount, // assuming 'balance' is the column
                    ]);
                }
            }else if($type == 'expense'){
                   $fundHeld = FundHeld::where('institute_id', $institute_id)
                    ->where('fund_head_id', $fundhead)
                    ->first();

                if ($fundHeld) {
                    $fundHeld->balance -= $detail->amount;
                    $fundHeld->save();
                } 
                }
            
            // Record in Fund table
            Fund::create([
                'institute_id'  => $institute_id,
                'fund_head_id'  => $fundhead,
                'amount'        => $detail->amount,
                'added_date'    => now(),
                'description'   => 'TID ' . $tid . ' - ' . ucfirst($type) . ' of ' . $assetname .' Qty: '.$quantity .' Room: '.$room   ,
                'type'          => in_array($type, ['purchase', 'maintenance']) ? 'out' : 'in',
                'added_by'      => auth()->user()->id,
                'status'        => 'Approved',
                'tid'=>$tid,
            ]);
        }

        // Update transaction status
        $transaction->status = 'approved';
        $transaction->approved_by = auth()->user()->id;
        $transaction->save();

        return response()->json(['message' => 'Transaction approved successfully.'], 200);
    });

}
public function getTransactions(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionId      = session('region_id');
    $userType      = session('type');

    $query = Transaction::with(['institute', 'addedBy', 'approvedBy', 'Type', 'subType'])
        ->select('transactions.*');

    // -----------------------------------------------------------------
    // Role-based scoping
    // -----------------------------------------------------------------
    if ($userType === 'Regional Office' && $regionId) {
        $query->whereHas('institute', fn($q) => $q->where('region_id', $regionId));
    }

    // -----------------------------------------------------------------
    // Filters
    // -----------------------------------------------------------------
    if ($search = $request->search) {
        $query->where(function ($q) use ($search) {
            $q->where('id', 'like', "%{$search}%")
              ->orWhere('total_amount', 'like', "%{$search}%")
              ->orWhere('type', 'like', "%{$search}%")
              ->orWhere('status', 'like', "%{$search}%");
        });
    }

    if ($instituteId = $request->institute_id) {
        $query->where('institute_id', $instituteId);
    }

    if ($regionIdFilter = $request->region_id) {
        $query->whereHas('institute', fn($q) => $q->where('region_id', $regionIdFilter));
    }

    if ($addedBy = $request->added_by) {
        $query->where('added_by', $addedBy);
    }

    if ($approvedBy = $request->approved_by) {
        $query->where('approved_by', $approvedBy);
    }

    if ($type = $request->type) {
        $query->where('type', $type);
    }

    if ($status = $request->status) {
        $query->where('status', $status);
    }

    if ($dateFrom = $request->date_from) {
        $query->whereDate('created_at', '>=', $dateFrom);
    }

    if ($dateTo = $request->date_to) {
        $query->whereDate('created_at', '<=', $dateTo);
    }

    // -----------------------------------------------------------------
    // Pagination
    // -----------------------------------------------------------------
    $transactions = $query->orderBy('created_at', 'desc')
        ->paginate(15)
        ->withQueryString();

    return response()->json($transactions);

    {
        $hrInstituteId = session('inst_id');
        $regionid      = session('region_id');
        $type          = session('type');

        $query = Transaction::query()->with(['institute']);

        // -----------------------------------------------------------------
        // Global search
        // -----------------------------------------------------------------
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // -----------------------------------------------------------------
        // Institute filter
        // -----------------------------------------------------------------
        if ($request->filled('institute_id') && is_numeric($request->institute_id) && $request->institute_id > 0) {
            $query->where('institute_id', $request->institute_id);
        }

        // -----------------------------------------------------------------
        // Region filter (only for non-Regional users)
        // -----------------------------------------------------------------
        if ($request->filled('region_id') && $request->region_id !== '0' && is_numeric($request->region_id)) {
            $query->whereHas('institute', fn($q) => $q->where('region_id', $request->region_id));
        }
        // Regional Office user – restrict to own region automatically
        elseif ($type === 'Regional Office') {
            $query->whereHas('institute', fn($q) => $q->where('region_id', $regionid));
        }

      
        // -----------------------------------------------------------------
        // Status filter
        // -----------------------------------------------------------------
        if ($request->filled('type') && in_array($request->type, ['purchase', 'maintenance', 'condemned'])) {
            $query->where('type', $request->type);
        }

        // -----------------------------------------------------------------
        // Pagination
        // -----------------------------------------------------------------
        $transactions = $query->paginate(10)->withQueryString();

        // Attach region name for the front-end (if not already eager-loaded)
        $transactions->getCollection()->transform(function ($transaction) {
            $transaction->region = $transaction->institute?->region;
            return $transaction;
        });

        return response()->json($transactions);
    }
}
public function Funds(Request $request)
    {
        $fundheads = FundHead::select('id', 'name')->get();
        $hrInstituteId = session('inst_id');
        $regionid      = session('region_id');
        $type          = session('type');
$balances=[];
        $institutes = [];
        $regions    = [];
         $funds = new LengthAwarePaginator(
                    collect([]),
                    0,
                    10,
                    1,
                    ['path' => $request->url()]
                );

        // -----------------------------------------------------------------
        // Regional Office → only its own institutes
        // -----------------------------------------------------------------
        if ($type === 'Regional Office') {
             $institutes = Institute::where('region_id', $regionid)
                ->select('id', 'name')
                ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
                ->get()
                ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && !empty(trim($i->name)))
                ->values();
        

                   if ($request->filled('fund_head_id') && $request->fund_head_id !== '0' && is_numeric($request->fund_head_id)) {
                $fundhead = $request->fund_head_id;

          $fundHeadBalances = FundHeld::query()->where('fund_head_id', $fundhead)
            ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
                        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')

             ->where('institutes.region_id', $regionid)
            ->select([
                'fund_heads.id',
                'fund_heads.name',
                DB::raw('SUM(fund_helds.balance) as balance')
            ])
            ->groupBy('fund_heads.id', 'fund_heads.name')
            ->get()
            ->keyBy('id');

        $balanceData = $fundHeadBalances->get($fundhead); // returns model or null

  $balances = collect([
        [
            'fund_head' => [
                'id' => $fundhead,
                'name' => $balanceData->name ?? 'N/A',
            ],
            'balance' => $balanceData->balance ?? 0,
        ]
    ])->values();
            } else{
                 $fundHeadBalances = FundHeld::query()
            ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
                        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')

             ->where('institutes.region_id', $regionid)
            ->select([
                'fund_heads.id',
                'fund_heads.name',
                DB::raw('SUM(fund_helds.balance) as balance')
            ])
            ->groupBy('fund_heads.id', 'fund_heads.name')
            ->get()
            ->keyBy('id');

        // Loop through all fund heads and add balance (0 if not found)
        $balances = $fundheads->map(function ($fundHead) use ($fundHeadBalances) {
            $balance = $fundHeadBalances->get($fundHead->id);
            return [
                'fund_head' => [
                    'id' => $fundHead->id,
                    'name' => $fundHead->name,
                ],
                'balance' => $balance ? $balance->balance : 0,
            ];
        })->values();
              
            }
            // Get fund balances per institute and fund head
    $fundBalancesByInstitute = FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->where('institutes.region_id', $regionid)
        ->select([
            'fund_helds.institute_id',
            'fund_helds.fund_head_id',
            'fund_heads.name as fund_head_name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_helds.institute_id', 'fund_helds.fund_head_id', 'fund_heads.name')
        ->get();

    // Group by institute and create fund head columns
    $funds = $institutes->map(function ($institute) use ($fundheads, $fundBalancesByInstitute) {
        $instituteBalances = $fundBalancesByInstitute->where('institute_id', $institute->id);
        
        // Build fund head columns dynamically
        $fundHeadColumns = [];
        $totalBalance = 0;
        
        foreach ($fundheads as $fundHead) {
            $balance = $instituteBalances
                ->where('fund_head_id', $fundHead->id)
                ->first()?->balance ?? 0;
            
            $fundHeadColumns[$fundHead->name] = $balance;
            $totalBalance += $balance;
        }

        return [
            'institute_id' => $institute->id,
            'institute_name' => $institute->name,
            'fund_heads' => $fundHeadColumns, // Each fund head as a column
            'total_balance' => $totalBalance,
        ];
    })->values(); 
   
        }
        // -----------------------------------------------------------------
        // Super-admin / HQ → all regions
        // -----------------------------------------------------------------
        else {
                        $regions = Institute::select('region_id as id', 'name')
                ->where('type', 'Regional Office')
                ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
                ->get()
                ->filter(fn($r) => is_numeric($r->id) && $r->id > 0 && !empty(trim($r->name)))
                ->values();
                  // Get balances for all institutes
      
    // Get all fund balances grouped by region and fund head
    $fundBalancesByRegion = FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->select([
            'institutes.region_id',
            'fund_helds.fund_head_id',
            'fund_heads.name as fund_head_name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('institutes.region_id', 'fund_helds.fund_head_id', 'fund_heads.name')
        ->get();

    // Build response: Group by region with fund head columns
    $funds = $regions->map(function ($region) use ($fundheads, $fundBalancesByRegion) {
        $regionBalances = $fundBalancesByRegion->where('region_id', $region->id);
        
        // Build fund head columns dynamically
        $fundHeadColumns = [];
        $totalBalance = 0;
        
        foreach ($fundheads as $fundHead) {
            $balance = $regionBalances
                ->where('fund_head_id', $fundHead->id)
                ->first()?->balance ?? 0;
            
            $fundHeadColumns[$fundHead->name] = $balance;
            $totalBalance += $balance;
        }

        return [
            'region_id' => $region->id,
            'region_name' => $region->name,
            'fund_heads' => $fundHeadColumns, // Each fund head as a column
            'total_balance' => $totalBalance,
        ];
    })->values();

 
            if ($request->filled('fund_head_id') && $request->fund_head_id !== '0' && is_numeric($request->fund_head_id)) {
                $fundhead = $request->fund_head_id;

            $fundHeadBalances = FundHeld::query()->where('fund_head_id', $fundhead)
            ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
                        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')

        
            ->select([
                'fund_heads.id',
                'fund_heads.name',
                DB::raw('SUM(fund_helds.balance) as balance')
            ])
            ->groupBy('fund_heads.id', 'fund_heads.name')
            ->get()
            ->keyBy('id');

         $balanceData = $fundHeadBalances->get($fundhead); // returns model or null

  $balances = collect([
        [
            'fund_head' => [
                'id' => $fundhead,
                'name' => $balanceData->name ?? 'N/A',
            ],
            'balance' => $balanceData->balance ?? 0,
        ]
    ])->values();

            }else{
                   $fundHeadBalances = FundHeld::query()
            ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
                        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')

        
            ->select([
                'fund_heads.id',
                'fund_heads.name',
                DB::raw('SUM(fund_helds.balance) as balance')
            ])
            ->groupBy('fund_heads.id', 'fund_heads.name')
            ->get()
            ->keyBy('id');

        // Loop through all fund heads and add balance (0 if not found)
        $balances = $fundheads->map(function ($fundHead) use ($fundHeadBalances) {
            $balance = $fundHeadBalances->get($fundHead->id);
            return [
                'fund_head' => [
                    'id' => $fundHead->id,
                    'name' => $fundHead->name,
                ],
                'balance' => $balance ? $balance->balance : 0,
            ];
        })->values();
            }
    
        }

        return Inertia::render('Reports/Funds', [
            'institutes'    => $institutes,
            'regions'       => $regions,
            'fundheads'     => $fundheads,
            'funds'         => $funds,
            'balances'      => $balances,
            'filters'       => [
                'institute_id'  => '',
                'region_id'     => '',
                'fund_head_id'  => $request->get('fund_head_id', ''),
            ],
        ]);
    }
public function getFunds(Request $request)
{
    $hrInstituteId = session('inst_id');
    $regionid = session('region_id');
    $type = session('type');

    $fundheads = FundHead::select('id', 'name')->get();
    $balances = [];
    $funds = [];

    if ($type === 'Regional Office') {
        $this->handleRegionalOffice($request, $regionid, $fundheads, $balances, $funds);
    } else {
        $this->handleSuperAdminOrHQ($request, $regionid, $type, $fundheads, $balances, $funds);
    }

    return response()->json([
        'funds' => $funds,
        'balances' => $balances,
    ]);
}

private function handleRegionalOffice($request, $regionid, $fundheads, &$balances, &$funds)
{
    $institutes = $this->getInstitutesForRegionalOffice($request, $regionid);

    if ($this->isFundHeadFiltered($request)) {
        $fundhead = $request->fund_head_id;
        $balances = $this->getBalancesForSingleFundHead($fundhead, $regionid);
     $funds = $this->buildFundsForInstitutes($institutes, $fundheads, $regionid);

    } else {
        $fundHeadBalances = $this->getFundHeadBalancesByRegion($regionid);
        $balances = $this->mapFundHeadBalances($fundheads, $fundHeadBalances);
        $funds = $this->buildFundsForInstitutes($institutes, $fundheads, $regionid);
    }
}

private function handleSuperAdminOrHQ($request, $regionid, $type, $fundheads, &$balances, &$funds)
{
    $isregionfiltered = false;

    if ($this->isRegionFiltered($request)) {
        $isregionfiltered = true;
        $regions = $this->getFilteredRegions($request);
        $fundBalancesByRegion = $this->getFundBalancesByFilteredRegion($request);
        $fundHeadBalances = $this->getFundHeadBalancesByFilteredRegion($request);
    } else {
        $regions = $this->getAllRegions();
        $fundBalancesByRegion = $this->getAllFundBalancesByRegion();
        $fundHeadBalances = $this->getAllFundHeadBalances();
    }

    $funds = $this->buildFundsForRegions($regions, $fundheads, $fundBalancesByRegion, $isregionfiltered);

    if ($this->isFundHeadFiltered($request)) {
        $fundhead = $request->fund_head_id;
        $balances = $this->getBalancesForSingleFundHeadSuperAdmin($request, $fundhead);
    } else {
        $balances = $this->mapFundHeadBalances($fundheads, $fundHeadBalances);
    }
}

private function getInstitutesForRegionalOffice($request, $regionid)
{
    if ($request->filled('institute_id') && $request->institute_id !== '0' && is_numeric($request->institute_id)) {
        return Institute::where('institute_id', $request->institute_id)
            ->select('id', 'name')
            ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
            ->get()
            ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && !empty(trim($i->name)))
            ->values();
    }

    return Institute::where('region_id', $regionid)
        ->select('id', 'name')
        ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
        ->get()
        ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && !empty(trim($i->name)))
        ->values();
}

private function isFundHeadFiltered($request)
{
    return $request->filled('fund_head_id') 
        && $request->fund_head_id !== '0' 
        && is_numeric($request->fund_head_id);
}

private function isRegionFiltered($request)
{
    return $request->filled('region_id') 
        && $request->region_id !== '0' 
        && is_numeric($request->region_id);
}

private function getBalancesForSingleFundHead($fundhead, $regionid)
{
    $fundHeadBalances = FundHeld::query()
        ->where('fund_head_id', $fundhead)
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->where('institutes.region_id', $regionid)
        ->select([
            'fund_heads.id',
            'fund_heads.name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_heads.id', 'fund_heads.name')
        ->get()
        ->keyBy('id');

    $balanceData = $fundHeadBalances->get($fundhead);

    return collect([
        [
            'fund_head' => [
                'id' => $fundhead,
                'name' => $balanceData->name ?? 'N/A',
            ],
            'balance' => $balanceData->balance ?? 0,
        ]
    ])->values();
}

private function getFundHeadBalancesByRegion($regionid)
{
    return FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->where('institutes.region_id', $regionid)
        ->select([
            'fund_heads.id',
            'fund_heads.name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_heads.id', 'fund_heads.name')
        ->get()
        ->keyBy('id');
}

private function mapFundHeadBalances($fundheads, $fundHeadBalances)
{
    return $fundheads->map(function ($fundHead) use ($fundHeadBalances) {
        $balance = $fundHeadBalances->get($fundHead->id);
        return [
            'fund_head' => [
                'id' => $fundHead->id,
                'name' => $fundHead->name,
            ],
            'balance' => $balance ? $balance->balance : 0,
        ];
    })->values();
}

private function buildFundsForInstitutes($institutes, $fundheads, $regionid)
{
    $fundBalancesByInstitute = FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->where('institutes.region_id', $regionid)
        ->select([
            'fund_helds.institute_id',
            'fund_helds.fund_head_id',
            'fund_heads.name as fund_head_name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_helds.institute_id', 'fund_helds.fund_head_id', 'fund_heads.name')
        ->get();

    return $institutes->map(function ($institute) use ($fundheads, $fundBalancesByInstitute) {
        $instituteBalances = $fundBalancesByInstitute->where('institute_id', $institute->id);
        
        $fundHeadColumns = [];
        $totalBalance = 0;
        
        foreach ($fundheads as $fundHead) {
            $balance = $instituteBalances
                ->where('fund_head_id', $fundHead->id)
                ->first()?->balance ?? 0;
            
            $fundHeadColumns[$fundHead->name] = $balance;
            $totalBalance += $balance;
        }

        return [
            'institute_id' => $institute->id,
            'institute_name' => $institute->name,
            'fund_heads' => $fundHeadColumns,
            'total_balance' => $totalBalance,
        ];
    })->values();
}

private function getFilteredRegions($request)
{
    return Institute::where('region_id', $request->region_id)
        ->get()
        ->filter(fn($i) => is_numeric($i->id) && $i->id > 0 && !empty(trim($i->name)))
        ->values();
}

private function getFundBalancesByFilteredRegion($request)
{
    return FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->where('institutes.region_id', $request->region_id)
        ->select([
            'fund_helds.institute_id',
            'fund_helds.fund_head_id',
            'fund_heads.name as fund_head_name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_helds.institute_id', 'fund_helds.fund_head_id', 'fund_heads.name')
        ->get();
}

private function getFundHeadBalancesByFilteredRegion($request)
{
    return FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->where('institutes.region_id', $request->region_id)
        ->select([
            'fund_heads.id',
            'fund_heads.name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_heads.id', 'fund_heads.name')
        ->get()
        ->keyBy('id');
}

private function getAllRegions()
{
    return Institute::select('region_id as id', DB::raw('MAX(name) as name'))
        ->where('type', 'Regional Office')
   
        ->groupBy('region_id')
             ->orderByRaw('ISNULL(MAX(`order`)) ASC, MAX(`order`) ASC, id DESC')
        ->get()
        ->filter(fn($r) => is_numeric($r->id) && $r->id > 0 && !empty(trim($r->name)))
        ->values();
}

private function getAllFundBalancesByRegion()
{
    return FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->select([
            'institutes.region_id',
            'fund_helds.fund_head_id',
            'fund_heads.name as fund_head_name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('institutes.region_id', 'fund_helds.fund_head_id', 'fund_heads.name')
        ->get();
}

private function getAllFundHeadBalances()
{
    return FundHeld::query()
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->select([
            'fund_heads.id',
            'fund_heads.name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_heads.id', 'fund_heads.name')
        ->get()
        ->keyBy('id');
}

private function buildFundsForRegions($regions, $fundheads, $fundBalancesByRegion, $isregionfiltered)
{ 
    //  dd($fundBalancesByRegion);
    //     print_r($regions);
    return $regions->map(function ($region) use ($fundheads, $fundBalancesByRegion, $isregionfiltered) {
       
         if ($isregionfiltered) {
        $regionBalances = $fundBalancesByRegion->where('institute_id', $region->id);
         }
         else{
                    $regionBalances = $fundBalancesByRegion->where('region_id', $region->id);

         }
        $fundHeadColumns = [];
        $totalBalance = 0;
        
        foreach ($fundheads as $fundHead) {
            $balance = $regionBalances
                ->where('fund_head_id', $fundHead->id)
                ->first()?->balance ?? 0;
            
            $fundHeadColumns[$fundHead->name] = $balance;
            $totalBalance += $balance;
        }

        if ($isregionfiltered) {
            return [
                'institute_id' => $region->id,
                'institute_name' => $region->name,
                'fund_heads' => $fundHeadColumns,
                'total_balance' => $totalBalance,
            ];
        }

        return [
            'region_id' => $region->id,
            'region_name' => $region->name,
            'fund_heads' => $fundHeadColumns,
            'total_balance' => $totalBalance,
        ];
    })->values();
}

private function getBalancesForSingleFundHeadSuperAdmin($request, $fundhead)
{
    $fundHeadBalances = FundHeld::query()
        ->where('fund_head_id', $fundhead)
        ->whereHas('institute', function ($q) use ($request) {
            if ($this->isRegionFiltered($request)) {
                $q->where('region_id', $request->region_id);
            }
        })
        ->join('fund_heads', 'fund_helds.fund_head_id', '=', 'fund_heads.id')
        ->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
        ->select([
            'fund_heads.id',
            'fund_heads.name',
            DB::raw('SUM(fund_helds.balance) as balance')
        ])
        ->groupBy('fund_heads.id', 'fund_heads.name')
        ->get()
        ->keyBy('id');

    $balanceData = $fundHeadBalances->get($fundhead);

    return collect([
        [
            'fund_head' => [
                'id' => $fundhead,
                'name' => $balanceData->name ?? 'N/A',
            ],
            'balance' => $balanceData->balance ?? 0,
        ]
    ])->values();
}
public function getFund(Request $request)
    {  if(!auth()->user()->can('reports-fundstrans')){
            abort(403);
        }
        $fundheadid =$request->fund_head_id;
        $hrInstituteId = $request->institute_id;
        // ---- Find FundHeld -------------------------------------------------
        $fundheld = FundHeld::with('institute', 'fundHead')->where('fund_head_id', $fundheadid)->first();

        if (!$fundheld) {
            return response()->json(['error' => 'Fund held record not found'], 404);
        }

        // ---- Build transaction query --------------------------------------
        $query = Fund::with(['institute', 'FundHead', 'user'])
            ->where('institute_id', $hrInstituteId)
            ->where('fund_head_id', $fundheadid);
  
        // Search
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Date range: from / to (ISO date strings from <input type="date">)
        if ($request->filled('from')) {
            $query->whereDate('added_date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('added_date', '<=', $request->to);
        }

        // Order + pagination
        $fundtrans = $query->orderBy('added_date', 'desc')
            ->paginate(10)
            ->withQueryString();

        // ---- Return Inertia page -------------------------------------------
        return Inertia::render('Reports/FundsTran', [
            'fundheld'  => $fundheld,
            'fundtrans' => $fundtrans,
            'filters'   => $request->only(['search', 'from', 'to','fund_head_id','institute_id','region_id']),
        ]);
    } 
    public function completion(Request $request)
    {
       $regionid = session('region_id');
    $type = session('type');
    $regions=[];
    $institutes=[];

    if($type=="Regional Office"){
  $institutes = Institute::select('id', 'name')
            ->where('region_id', $regionid)
            ->get()
            ->filter(fn($r) => is_numeric($r->id) && $r->id > 0 && !empty(trim($r->name)))
            ->values();
    
    }else{
  $regions = Institute::select('region_id as id', 'name')
            ->where('type', 'Regional Office')
            ->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
            ->get()
            ->filter(fn($r) => is_numeric($r->id) && $r->id > 0 && !empty(trim($r->name)))
            ->values();
    }
      $totalinstitutes = Institute::count();

        return Inertia::render('Reports/Completion', [
            'regions' => $regions,
            'institutes' => $institutes,
            'totalinstitutes' => $totalinstitutes,
            'filters' => [
                'region_id' => '',
                'institute_id' => '',
                'status' => '',
            ],
        ]);
    }

    public function getCompletionData(Request $request)
    {
       if (!auth()->user()->can('rpt-completion')) {
        abort(403, 'You do not have permission to add a plant.');
    }
             $regionid = session('region_id');
    $type = session('type');
        $query = Institute::query()
            ->with([
              
                'shifts',
                'fundHelds',
                'blocks.rooms',
                'instituteAssets',
                'institutePlants',
                'instituteTransports',
                'projects',
                'upgradations'
            ])->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC')
;
           
            if($type=="Regional Office"){
                $query->where('region_id', $regionid)->whereIn('type', ['School', 'College']);

            } // director or dg
            else{ 
                
                
                
                if ($request->filled('region_id') && is_numeric($request->region_id) && $request->region_id > 0) {
            $query->where('region_id', $request->region_id);
        }}
      

        if ($request->filled('institute_id') && is_numeric($request->institute_id) && $request->institute_id > 0) {
            $query->where('id', $request->institute_id);
        }

        $institutes = $query->get()->map(function ($institute) {
            $shiftsCount = $institute->shifts->count();
            $blocksCount = $institute->blocks->count();
            $roomsCount = $institute->blocks->sum(fn($b) => $b->rooms->count());
            $assetsCount = $institute->instituteAssets->count();
            $plantsCount = $institute->institutePlants->count();
            $transportsCount = $institute->instituteTransports->count();
            $fundsCount = $institute->fundHelds->count();
            $projectsCount = $institute->projects->count();
            $upgradationsCount = $institute->upgradations->count();

            // Percentage Calculation Logic
            $percentage = 0;
            $firstShift = $institute->shifts->first();
            $buildingTypeId = $firstShift ? $firstShift->building_type_id : null;
if($buildingTypeId!=null){
   

            if ($buildingTypeId == 1) { // Owned
                $percentage += 20; // Institute Profile
                if ($fundsCount > 0) $percentage += 20;
                if ($blocksCount > 0) $percentage += 10;
                if ($roomsCount > 0) $percentage += 10;
                if ($shiftsCount > 0) $percentage += 10;
                if ($plantsCount > 0) $percentage += 10;
                if ($assetsCount > 10) $percentage += 20;
            } else { // Rented / Other
                $percentage += 40; // Institute Profile
                if ($fundsCount > 0) $percentage += 40;
                if ($shiftsCount > 0) $percentage += 20;
            }
        }   
            // Cap at 100
            $percentage = min($percentage, 100);

            return [
                'id' => $institute->id,
                'name' => $institute->name,
                'region_id' => $institute->region_id,
                'region_name' => $institute->region->name ?? 'N/A',
                'shifts' => $shiftsCount,
                'blocks' => $blocksCount,
                'rooms' => $roomsCount,
                'assets' => $assetsCount,
                'plants' => $plantsCount,
                'transports' => $transportsCount,
                'funds' => $fundsCount,
                'projects' => $projectsCount,
                'upgradations' => $upgradationsCount,
                'percentage' => $percentage,
            ];
        });

        // Filter by Status if requested
        if ($request->filled('status')) {
            $status = $request->status;
            $institutes = $institutes->filter(function ($item) use ($status) {
                if ($status === 'completed') return $item['percentage'] == 100;
                if ($status === 'less_than_50') return $item['percentage'] < 50;
                if ($status === 'greater_than_50') return $item['percentage'] > 50;
                if ($status === 'zero') return $item['percentage'] == 0;
                return true;
            });
        }

        $institutes = $institutes->values();

        // Calculate Region Summary
        $summary = $institutes->groupBy('region_name')->map(function ($group, $regionName) {
            return [
                'region' => $regionName,
                'total_institutes' => $group->count(),
                'completed' => $group->where('percentage', 100)->count(),
                'less_than_50' => $group->where('percentage', '<', 50)->count(),
                'greater_than_50' => $group->where('percentage', '>', 50)->count(),
                'zero' => $group->where('percentage', 0)->count(),
            ];
        })->values();

        $details = $institutes;

        // If HQ/SuperAdmin and no region selected, show regions in details
        if ($type !== 'Regional Office' && (!$request->filled('region_id') || $request->region_id == 0)) {
             $details = $institutes->groupBy('region_id')->map(function ($group, $regionName) {
                 $first = $group->first();
                 $region = Institute::where('region_id', $first['region_id'])->where('type', "Regional Office")->first();
                 return [
                     'id' => $first['region_id'],
                     'name' => $region->name ?? 'SpecialEducation',
                     'is_region' => true,
                     'total_institutes' => $group->count(),
                     'completed' => $group->where('percentage', 100)->count(),
                     'less_than_50' => $group->where('percentage', '<', 50)->count(),
                     'greater_than_50' => $group->where('percentage', '>', 50)->count(),
                     'zero' => $group->where('percentage', 0)->count(),
                     'shifts' => $group->sum('shifts'),
                     'blocks' => $group->sum('blocks'),
                     'rooms' => $group->sum('rooms'),
                     'assets' => $group->sum('assets'),
                     'plants' => $group->sum('plants'),
                     'transports' => $group->sum('transports'),
                     'funds' => $group->sum('funds'),
                     'projects' => $group->sum('projects'),
                     'upgradations' => $group->sum('upgradations'),
                     'percentage' => 0, 
                 ];
             })->values();
        }
$institutesFilter = [];
if($type=="Regional Office"){
    $institutesFilter = Institute::whereIn('type', ['School', 'College'])->where('region_id', $regionid)->get();
}else{
    $institutesFilter = Institute::whereIn('type', ['School', 'College'])->get();
}

$totalinstitutes =Institute::count();
        return response()->json([
            'summary' => $summary,
            'details' => $details,
            'institutes' => $institutesFilter,
            'totalinstitutes' => $totalinstitutes,
        ]);
    }

    public function getInstituteCompletionDetails(Request $request)
    {
        $instituteId = $request->institute_id;
        if (!$instituteId) {
            return response()->json(['error' => 'Institute ID is required'], 400);
        }

        $institute = Institute::with([
            'shifts',
            'fundHelds',
            'blocks.rooms',
            'instituteAssets',
            'institutePlants',
            'instituteTransports',
            'projects',
            'upgradations'
        ])->find($instituteId);

        if (!$institute) {
            return response()->json(['error' => 'Institute not found'], 404);
        }

        $shiftsCount = $institute->shifts->count();
        $blocksCount = $institute->blocks->count();
        $roomsCount = $institute->blocks->sum(fn($b) => $b->rooms->count());
        $assetsCount = $institute->instituteAssets->count();
        $plantsCount = $institute->institutePlants->count();
        $transportsCount = $institute->instituteTransports->count();
        $fundsCount = $institute->fundHelds->count();
        $projectsCount = $institute->projects->count();
        $upgradationsCount = $institute->upgradations->count();

        $percentage = 0;
        $firstShift = $institute->shifts->first();
        $buildingTypeId = $firstShift ? $firstShift->building_type_id : null;
        
        $criteria = [];

        if ($buildingTypeId != null) {
            if ($buildingTypeId == 1) { // Owned
                
                // Institute Profile
                $criteria[] = [
                    'name' => 'Complete Institute Profile',
                    'weight' => 20,
                    'completed' => true, 
                    'message' => 'Profile Completed'
                ];
                $percentage += 20;

                // Funds
                $fundsCompleted = $fundsCount > 0;
                $criteria[] = [
                    'name' => 'Add Funds Information',
                    'weight' => 20,
                    'completed' => $fundsCompleted,
                    'message' => $fundsCompleted ? 'Funds Added' : 'No Funds Information'
                ];
                if ($fundsCompleted) $percentage += 20;

                // Blocks
                $blocksCompleted = $blocksCount > 0;
                $criteria[] = [
                    'name' => 'Add Blocks Information',
                    'weight' => 10,
                    'completed' => $blocksCompleted,
                    'message' => $blocksCompleted ? 'Blocks Added' : 'No Blocks Information'
                ];
                if ($blocksCompleted) $percentage += 10;

                // Rooms
                $roomsCompleted = $roomsCount > 0;
                $criteria[] = [
                    'name' => 'Add Rooms to Blocks',
                    'weight' => 10,
                    'completed' => $roomsCompleted,
                    'message' => $roomsCompleted ? 'Rooms Added' : 'No Rooms Information'
                ];
                if ($roomsCompleted) $percentage += 10;

                // Shifts
                $shiftsCompleted = $shiftsCount > 0;
                $criteria[] = [
                    'name' => 'Add Shifts Information',
                    'weight' => 10,
                    'completed' => $shiftsCompleted,
                    'message' => $shiftsCompleted ? 'Shifts Added' : 'No Shifts Information'
                ];
                if ($shiftsCompleted) $percentage += 10;

                // Plants
                $plantsCompleted = $plantsCount > 0;
                $criteria[] = [
                    'name' => 'Add Plants Information',
                    'weight' => 10,
                    'completed' => $plantsCompleted,
                    'message' => $plantsCompleted ? 'Plants Added' : 'No Plants Information'
                ];
                if ($plantsCompleted) $percentage += 10;

                // Assets
                $assetsCompleted = $assetsCount > 10;
                $criteria[] = [
                    'name' => 'Add at least 10 Assets',
                    'weight' => 20,
                    'completed' => $assetsCompleted,
                    'message' => $assetsCompleted ? 'Assets Added (>10)' : 'Assets Count: ' . $assetsCount
                ];
                if ($assetsCompleted) $percentage += 20;

            } else { // Rented / Other
                
                // Institute Profile
                $criteria[] = [
                    'name' => 'Complete Institute Profile',
                    'weight' => 40,
                    'completed' => true,
                    'message' => 'Profile Completed'
                ];
                $percentage += 40;

                // Funds
                $fundsCompleted = $fundsCount > 0;
                $criteria[] = [
                    'name' => 'Add Funds Information',
                    'weight' => 40,
                    'completed' => $fundsCompleted,
                    'message' => $fundsCompleted ? 'Funds Added' : 'No Funds Information'
                ];
                if ($fundsCompleted) $percentage += 40;

                // Shifts
                $shiftsCompleted = $shiftsCount > 0;
                $criteria[] = [
                    'name' => 'Add Shifts Information',
                    'weight' => 20,
                    'completed' => $shiftsCompleted,
                    'message' => $shiftsCompleted ? 'Shifts Added' : 'No Shifts Information'
                ];
                if ($shiftsCompleted) $percentage += 20;
            }
        } else {
             // Fallback if no shift/building type defined - assume default generic checks or fail everything?
             // Since buildingTypeId is null, original logic implies percentage 0.
             // We can check if they populated anything at all?
             // But following original logic: if buildingTypeId is null, they get nothing calculated in the main loop.
             // We should prompt them to add shifts first.
             $criteria[] = [
                 'name' => 'Add Shifts Information (Required)',
                 'weight' => 100,
                 'completed' => false,
                 'message' => 'Please add shifts to determine building type'
             ];
        }

        $percentage = min($percentage, 100);

        return response()->json([
            'institute' => $institute->name,
            'percentage' => $percentage,
            'criteria' => $criteria
        ]);
    }
}