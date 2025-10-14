<?php
namespace App\Http\Controllers;

use App\Models\ProjectType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $projectTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('projecttypes/Index', [
            'projectTypes' => $projectTypes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('projecttypes/Form', ['projectType' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        ProjectType::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Project type saved successfully.');
    }   
    public function edit(ProjectType $ProjectType)
    {
        //dd($ProjectType);
        return Inertia::render('projecttypes/Form', ['projectType' => $ProjectType]);
    } 
    public function update(Request $request, ProjectType $ProjectType)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);  
        $ProjectType->update($data);     
        return redirect()->back()->with('success', 'Project type updated successfully.');
    }
    public function destroy(ProjectType $ProjectType)
    {
        $ProjectType->delete();   
        return redirect()->back()->with('success', 'Project type deleted successfully.');
    }
}
