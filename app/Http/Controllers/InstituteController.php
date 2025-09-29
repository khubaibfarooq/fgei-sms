<?php

namespace App\Http\Controllers;


use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use App\Models\Institute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InstituteController extends Controller
{
    public function index(Request $request)
    {
        $type=session('type');
        if($type=='school' ||  $type=='college'){
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
            }}
            else{
        
        $query = Institute::query();

    if ($request->search) {
        $query->where('name', 'like', '%' . $request->search . '%');
    }

    $institutes = $query->paginate(10)->withQueryString();

    return Inertia::render('institute/Index', [
        'institutes' => $institutes,
        'filters' => [
            'search' => $request->search ?? '',
        ],
    ]);}
//         $institute = Institute::first(); // assuming one record
//        return Inertia::render('institute/Index', [
//     'institute' => $institute,
// ]);
    }
 public function create()
    {
       
       return Inertia::render('institute/Form', [
           'institute' => null,
       ]);
    }
    public function store(Request $request)
    {

        $data = $request->validate([
            'established_date' => 'required|string|max:255',
            'total_area' => 'required|numeric',
            'convered_area' => 'required|numeric',
            'video' => 'nullable|file|mimes:mp4,mov,avi|max:10240',
            'img_layout' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'img_3d' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
        ]);
  if ($request->hasFile('img_layout')) {
            $data['img_layout'] = $request->file('img_layout')->store('img_layout', 'public');
        } else {
            unset($data['img_layout']);
        }  
        if ($request->hasFile('img_3d')) {
            $data['img_3d'] = $request->file('img_3d')->store('img_3d', 'public');
        } else {
            unset($data['img_3d']);
        }
          if ($request->hasFile('video')) {
            $data['video'] = $request->file('video')->store('video', 'public');
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
            if($type=='school' || $type=='college'){
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
            'established_date' => 'required|string|max:255',
            'total_area' => 'required|numeric',
            'convered_area' => 'required|numeric',
            'video' => 'nullable|file|mimes:mp4,mov,avi|max:10240',
            'img_layout' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'img_3d' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
        ]);
  if ($request->hasFile('img_layout')) {
            $data['img_layout'] = $request->file('img_layout')->store('img_layout', 'public');
        } else {
            unset($data['img_layout']);
        }  
        if ($request->hasFile('img_3d')) {
            $data['img_3d'] = $request->file('img_3d')->store('img_3d', 'public');
        } else {
            unset($data['img_3d']);
        }
          if ($request->hasFile('video')) {
            $data['video'] = $request->file('video')->store('video', 'public');
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


