<?php

namespace App\Http\Controllers;


use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;

use App\Models\Institute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InstituteController extends Controller
{
    public function index(Request $request)
    {
        $type=session('type');
       
            $hrInstituteId=session('inst_id');
            $institute = Institute::where('hr_id', $hrInstituteId)->first();
            if($institute){
                 session(['sms_inst_id' => $institute->id]);
            return Inertia::render('institute/Form', [
                'institute' => $institute,
            ]);}
            else{
                return Inertia::render('institute/Form', [
                    'institute' => null,
                ]);
            }
            
          
    }

      public function institutes(Request $request)
    {
          if (!auth()->user()->can('all-institutes-view')) {
        abort(403, 'You do not have permission to View this Page.');
    }
        $type=session('type');
       $regionId=session('region_id');
        $query = Institute::query();
       if($type=='Regional Office'){
          
           $query->where('region_id', $regionId);
    if ($request->search) {
        $query->where('name', 'like', '%' . $request->search . '%')
        ->where('region_id', $regionId);
    }}
    else{
         if ($request->search) {
        $query->where('name', 'like', '%' . $request->search . '%');
    }}
      

    
    $institutes = $query->paginate(10)->withQueryString();

    return Inertia::render('institute/Index', [
        'institutes' => $institutes,
        'filters' => [
            'search' => $request->search ?? '',
        ],
    ]);
}

    
 public function create()
    {
       
    //    return Inertia::render('institute/Form', [
    //        'institute' => null,
    //    ]);
    }
    public function store(Request $request)
    {

        $data = $request->validate([
            'name' => 'required|string',
            'established_date' => 'required|string|max:255',
            'total_area' => 'required|numeric',
            'convered_area' => 'required|numeric',
            'video' => 'nullable|file',
            'img_layout' => 'nullable|file',
            'img_3d' => 'nullable|file',
        ]);
 $resultImageName = null;
            if ($request->hasFile('img_layout')) {
                $resultImage = $request->file('img_layout');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/img_layout', $resultImageName);
                 $data['img_layout']='img_layout/'.$resultImageName;
            }  else{
                 unset($data['img_layout']);
            }
//   if ($request->hasFile('img_layout')) {
//             $data['img_layout'] = $request->file('img_layout')->store('img_layout', 'public');
//         } else {
//             unset($data['img_layout']);
//         }  
$resultImageName = null;
        if ($request->hasFile('img_3d')) {
$resultImage = $request->file('img_3d');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/img_3d', $resultImageName);
                 $data['img_3d']='img_3d/'.$resultImageName;        } 
                 else {
            unset($data['img_3d']);
        }
        $resultImageName = null;
          if ($request->hasFile('video')) {
           $resultImage = $request->file('video');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/video', $resultImageName);
                 $data['video']='video/'.$resultImageName; 
        } else {
            unset($data['video']);
        }
        $hrInstituteId = session('inst_id');
  $type = session('type');
  $regionId = session('region_id');

$institute = Institute::where('hr_id', $hrInstituteId)->first();
        if ($institute) {
            $institute->update($data);
        } else {
          $data['hr_id'] = $hrInstituteId;
$data['type'] = $type;
            if($type=='School' || $type=='College' || $type=='Regional Office'){
                $data['region_id'] = $regionId;
            }
            else{
                $data['region_id'] = null;
            }
            $institute = Institute::create($data);
            $id = $institute->id;
            session(['sms_inst_id' => $id]);
        }

        return redirect()->back()->with('success', 'Institute saved successfully.');
    }
    public function edit(Institute $institute)
    {
        return Inertia::render('institute/Form', [
            'institute' => $institute,
        ]);
    } 
    public function update(Request $request, Institute $institute)
    {
          $data = $request->validate([
               'name' => 'required|string',
            'established_date' => 'required|string|max:255',
            'total_area' => 'required|numeric',
            'convered_area' => 'required|numeric',
            'video' => 'nullable|file',
            'img_layout' => 'nullable|file',
            'img_3d' => 'nullable|file',
        ]);

        $resultImageName = null;
            if ($request->hasFile('img_layout')) {
                $resultImage = $request->file('img_layout');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/img_layout', $resultImageName);
                 $data['img_layout']='img_layout/'.$resultImageName;
            }  else{
                 unset($data['img_layout']);
            }
//   if ($request->hasFile('img_layout')) {
//             $data['img_layout'] = $request->file('img_layout')->store('img_layout', 'public');
//         } else {
//             unset($data['img_layout']);
//         }  
$resultImageName = null;
        if ($request->hasFile('img_3d')) {
$resultImage = $request->file('img_3d');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/img_3d', $resultImageName);
                 $data['img_3d']='img_3d/'.$resultImageName;        } 
                 else {
            unset($data['img_3d']);
        }
        $resultImageName = null;
          if ($request->hasFile('video')) {
           $resultImage = $request->file('video');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/video', $resultImageName);
                 $data['video']='video/'.$resultImageName; 
        } else {
            unset($data['video']);
        }
        $hrInstituteId = session('inst_id');
  $type = session('type');
  $regionId = session('region_id');

$institute = Institute::where('hr_id', $hrInstituteId)->first();
       
            $institute->update($data);
        
        return redirect()->back()->with('success', 'Institute updated successfully.');
    }
    public function destroy(Institute $institute)
    {
        $institute->delete();   
        return redirect()->back()->with('success', 'Institute deleted successfully.');
    }
}


