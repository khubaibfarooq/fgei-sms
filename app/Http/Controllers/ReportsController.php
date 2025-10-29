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
use App\Models\Project;
use App\Models\ProjectType;

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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')->get()
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
    
    if ($request->institute_id && is_numeric($request->institute_id) && $request->institute_id > 0) {

        
         $blocks=Block::where('institute_id', $request->institute_id);
         $blockIds= $blocks->pluck('id')->toArray();
          $rooms =Room::whereIn('block_id',   $blockIds)->get();
         $instituteAssets= InstituteAsset::where('institute_id', $request->institute_id)->with([ 'institute', 'room', 'asset'])->get();
   $blocks->get();

    }
    if ($request->region_id && is_numeric($request->region_id) && $request->region_id > 0) {
       $institutes = Institute::where('region_id', $request->$region_id)
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')->get()
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
        'regions'=>$regions,
        'filters' => [
            'search' => '',
            'institute_id' =>'',
            'block_id' =>  '',
            'room_id' =>'',
            'asset_category_id' =>'',
            'asset_id' =>'',
            'region_id' =>'',
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')->get()
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

    $transports = $query->with(['institute.region', 'vehicleType'])
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')->get()
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
$regions = Institute::select('region_id as id', 'name')->where('type', 'Regional Office')->get()
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

        // -----------------------------------------------------------------
        // Regional Office → only its own institutes
        // -----------------------------------------------------------------
        if ($type === 'Regional Office') {
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
            $regions = Institute::select('region_id as id', \DB::raw('MAX(name) as name'))
                ->where('type', 'Regional Office')
                ->groupBy('region_id')
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
        $emptyPaginator = new LengthAwarePaginator(
            collect([]),
            0,
            10,
            1,
            ['path' => $request->url()]
        );

        return Inertia::render('Reports/Projects', [
            'institutes'    => $institutes,
            'regions'       => $regions,
            'projectTypes'  => $projectTypes,
            'projects'      => $emptyPaginator,
            'filters'       => [
                'search'          => '',
                'institute_id'    => '',
                'region_id'       => '',
                'project_type_id' => '',
                'status'          => '',
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

        $query = Project::query()->with(['institute', 'projecttype']);

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

}