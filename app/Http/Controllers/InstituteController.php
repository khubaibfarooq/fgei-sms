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
    ]);
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
            'hr_institute_id' => 'required|int',
            'established_date' => 'required|string|max:255',
            'total_area' => 'required|double',
            'convered_area' => 'required|double',
            'video' => 'nullable|string',
            'img_layout' => 'nullable|string',
            'img_3d' => 'nullable|string',
        ]);
        $hrInstituteId = $request->hr_institute_id;

$institute = Institute::where('hr_institute_id', $hrInstituteId)->first();
        if ($institute) {
            $institute->update($data);
        } else {
            $institute = Institute::create($data);
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
            'hr_institute_id' => 'required|int',
            'established_date' => 'required|string|max:255',
            'total_area' => 'required|double',
            'convered_area' => 'required|double',
            'video' => 'nullable|string',
            'img_layout' => 'nullable|string',
            'img_3d' => 'nullable|string',
        ]); 
        $institute->update($data);
        return redirect()->back()->with('success', 'Institute updated successfully.');
    }
    public function destroy(Institute $institute)
    {
        $institute->delete();   
        return redirect()->back()->with('success', 'Institute deleted successfully.');
    }
}


