<?php
namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ProjectType;


class ProjectController extends Controller
{
    public function index(Request $request)
    {

        $query = Project::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');

        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
            ->Where('institute_id', $inst_id);
                  
        }

       

        $projects = $query->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('project-add'),
        'can_edit'   => auth()->user()->can('project-edit'),
        'can_delete' => auth()->user()->can('project-delete'),
    ];
        return Inertia::render('projects/Index', [
            'projects' => $projects,
            'filters' => ['search' => $request->search ?? ''],
                'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if(!auth()->user()->can('project-add')){
            abort(403);
        }
                $projectTypes = ProjectType::pluck('name', 'id')->toArray();

        return Inertia::render('projects/Form', ['project' => null,'projectTypes'=>$projectTypes]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'cost' => 'required|numeric',
           'project_type_id' => 'required|exists:project_types,id',
           'status' => 'required|string',
        ]);
$data['institute_id'] = session('sms_inst_id');

        Project::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Project saved successfully.');
    }
    public function edit(Project $project)
    {if (!auth()->user()->can('project-edit')) {
        abort(403, 'You do not have permission to edit a project.');
    }
     $projectTypes = ProjectType::pluck('name', 'id')->toArray();
        return Inertia::render('projects/Form', ['project' => $project,
    'projectTypes'=>$projectTypes]);
    }
    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'cost' => 'required|numeric',
    'project_type_id' => 'required|exists:project_types,id',    'status' => 'required|string',

        ]); 
        $data['institute_id'] = session('sms_inst_id');

        $project->update($data);       
        return redirect()->back()->with('success', 'Project updated successfully.');
    }
    public function destroy(Project $project)
    {if (!auth()->user()->can('project-delete')) {
        abort(403, 'You do not have permission to delete a project.');
    }
        $project->delete();   
        return redirect()->back()->with('success', 'Project deleted successfully.');
    }
}
 
