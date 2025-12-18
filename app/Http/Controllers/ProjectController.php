<?php
namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ProjectType;
use App\Models\Milestone;
use Illuminate\Support\Facades\File;
use App\Models\ApprovalStage;
use App\Models\ProjectApproval;
use App\Models\FundHead;

class ProjectController extends Controller
{
    public function index(Request $request)
    {

        $query = Project::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');

        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
         
                  
        }
  if ($request->status) {
            $query->where('status',  $request->status);
                  
        }
       

        $projects = $query->with('currentStage')->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('project-add'),
        'can_edit'   => auth()->user()->can('project-edit'),
        'can_delete' => auth()->user()->can('project-delete'),
        'can_approve' => true, // Placeholder for now, or auth()->user()->can('project-approve')
    ];
        return Inertia::render('projects/Index', [
            'projects' => $projects,
            'filters' => ['search' => $request->search ?? '',
        'status'=>$request->status ?? '',
    ],
                'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if(!auth()->user()->can('project-add')){
            abort(403);
        }
        $projectTypes = ProjectType::pluck('name', 'id')->toArray();
        $fundHeads = FundHead::all();

        return Inertia::render('projects/Form', [
            'project' => null,
            'projectTypes' => $projectTypes,
            'fundHeads' => $fundHeads
        ]);
    }
public function store(Request $request)
{
    $request->validate([
        'name'             => 'required|string|max:255',
        'estimated_amount' => 'required|numeric',
        'fund_head_id'     => 'nullable|exists:fund_heads,id',
        'project_type_id'  => 'required|exists:project_types,id',
        'priority'         => 'nullable|string',
        'description'      => 'nullable|string',
        'status'           => 'required|in:waiting,inprogress,completed,draft',
        'actual_amount'    => 'required_if:status,completed|nullable|numeric',
        'final_comments'   => 'required_if:status,completed|nullable|string',

        'milestones.*.name'           => 'required_with:milestones.*.due_date|string|max:255',
        'milestones.*.description'    => 'nullable|string',
        'milestones.*.due_date'       => 'required_with:milestones.*.name|date',
        'milestones.*.img'            => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        'milestones.*.pdf'            => 'nullable|mimes:pdf|max:10240',
    ]);

    $project = Project::create([
        'name'             => $request->name,
        'estimated_amount' => $request->estimated_amount,
        'fund_head_id'     => $request->fund_head_id,
        'project_type_id'  => $request->project_type_id,
        'status'           => $request->status,
        'actual_amount'    => $request->actual_amount,
        'final_comments'   => $request->final_comments,
        'priority'         => $request->priority,
        'description'      => $request->description,
        'institute_id'     => session('sms_inst_id'),
        'submitted_by'     => auth()->id(),
        'overall_status'   => 'waiting',
    ]);

   

    if ($request->has('milestones')) {
        foreach ($request->input('milestones', []) as $index => $m) {
            if (empty($m['name']) || empty($m['due_date'])) {
                continue;
            }

            $payload = [
                'name'           => $m['name'],
                'description'    => $m['description'] ?? null,
                'due_date'       => $m['due_date'],
                'added_by'       => auth()->id(),
            ];

            if ($request->hasFile("milestones.$index.img")) {
                $file = $request->file("milestones.$index.img");
                $imageName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('assets/milestones'), $imageName);
                $payload['img'] = 'milestones/' . $imageName;
            }

            if ($request->hasFile("milestones.$index.pdf")) {
                $file = $request->file("milestones.$index.pdf");
                $pdfName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('assets/milestones/pdfs'), $pdfName);
                $payload['pdf'] = 'milestones/pdfs/' . $pdfName;
            }

            $project->milestones()->create($payload);
        }
    }

    return redirect()->route('projects.index')
        ->with('success', 'Project created successfully with milestones!');
}
//     public function store(Request $request)
// {
//     $isUpdate = $request->has('id') || $request->isMethod('put');

//     $data = $request->validate([
//         'name' => 'required|string|max:255',
//         'cost' => 'required|numeric',
//         'project_type_id' => 'required|exists:project_types,id',
//         'status' => 'required|in:planned,inprogress,completed',
//         'milestones.*.name' => 'required|required|string|max:255',
//         'milestones.*.description' => 'nullable|string',
//         'milestones.*.due_date' => 'required|date',
//         'milestones.*.status' => 'required|in:planned,inprogress,completed',
//         'milestones.*.completed_date' => 'nullable|date',
//         'milestones.*.img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5048',
//     ]);

//     $data['institute_id'] = session('sms_inst_id');

//     $project = $isUpdate
//         ? Project::findOrFail($request->id)
//         : new Project();

//     $project->fill($data);
//     $project->save();

//     // Handle milestones
//     if ($request->has('milestones')) {
//         foreach ($request->file('milestones', []) as $index => $fileItem) {
//              $resultImageName = null;
//         if ($request->hasFile('img')) {
//             $resultImage = $request->file('img');
//             $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
//             $resultImage->move('assets/milestones', $resultImageName);
//             $request['img'] = 'milestones/' . $resultImageName;
//         } else {
//             unset($request['img']);
//         }
            
//         }

//      //   $project->milestone()->delete(); // Optional: replace all

//         foreach ($request->input('milestones', []) as $m) {
//             if (!empty($m['name']) && !empty($m['due_date'])) {
//                 $project->milestones()->create([
//                     'name' => $m['name'],
//                     'description' => $m['description'] ?? null,
//                     'due_date' => $m['due_date'],
//                     'status' => $m['status'],
//                     'completed_date' => $m['completed_date'] ?? null,
//                     'img' => $m['img'] ?? null,
//                     'added_by' => auth()->id(),
//                 ]);
//             }
//         }
//     }

//     return redirect()->route('projects.index')
//         ->with('success', 'Project saved successfully with milestones.');
// }
    public function edit(Project $project)
    {
        if (!auth()->user()->can('project-edit')) {
            abort(403, 'You do not have permission to edit a project.');
        }
        $projectTypes = ProjectType::pluck('name', 'id')->toArray();
        $fundHeads = FundHead::all();
        $milestones = $project->milestones;
        return Inertia::render('projects/Form', [
            'project'     => $project,
            'projectTypes'=> $projectTypes,
            'fundHeads'   => $fundHeads,
            'milestones'  => $milestones,
        ]);
    }
  


public function update(Request $request, Project $project)
{
    $request->validate([
        'name'             => 'required|string|max:255',
        'estimated_amount' => 'required|numeric|min:0',
        'fund_head_id'     => 'nullable|exists:fund_heads,id',
        'project_type_id'  => 'required|exists:project_types,id',
        'priority'         => 'nullable|string',
        'description'      => 'nullable|string',
        'status'           => 'required|in:waiting,inprogress,completed,draft',
        'actual_amount'    => 'required_if:status,completed|nullable|numeric',
        'final_comments'   => 'required_if:status,completed|nullable|string',

        'milestones.*.id'             => 'nullable|integer|exists:milestones,id,project_id,' . $project->id,
        'milestones.*.name'           => 'required_with:milestones.*.due_date|string|max:255',
        'milestones.*.description'    => 'nullable|string',
        'milestones.*.due_date'       => 'required_with:milestones.*.name|date',
        'milestones.*.img'            => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        'milestones.*.pdf'            => 'nullable|mimes:pdf|max:10240',
    ]);

    // Update main project
    $project->update([
        'name'             => $request->name,
        'estimated_amount' => $request->estimated_amount,
        'fund_head_id'     => $request->fund_head_id,
        'project_type_id'  => $request->project_type_id,
        'status'           => $request->status,
        'actual_amount'    => $request->actual_amount,
        'final_comments'   => $request->final_comments,
        'priority'         => $request->priority,
        'description'      => $request->description,
        'institute_id'     => session('sms_inst_id'),
    ]);

    $submittedIds = [];

    if ($request->has('milestones')) {
        foreach ($request->input('milestones', []) as $index => $milestoneData) {
            $milestoneId = $milestoneData['id'] ?? null;

            // Skip completely empty rows
            if (empty($milestoneData['name']) && empty($milestoneData['due_date'])) {
                continue;
            }

            $payload = [
                'name'           => $milestoneData['name'],
                'description'    => $milestoneData['description'] ?? null,
                'due_date'       => $milestoneData['due_date'],
     
               
                'added_by'       => auth()->id(),
            ];

            // Handle image upload EXACTLY like in your store() method
            if ($request->hasFile("milestones.$index.img")) {
                $file = $request->file("milestones.$index.img");

                // Delete old image if exists (for existing milestone)
                if ($milestoneId) {
                    $oldMilestone = $project->milestones()->find($milestoneId);
                    if ($oldMilestone && $oldMilestone->img) {
                        $oldPath = public_path('assets/' . $oldMilestone->img);
                        if (File::exists($oldPath)) {
                            File::delete($oldPath);
                        }
                    }
                }

                // Upload new image using your exact naming & path
                $imageName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('assets/milestones'), $imageName);
                $payload['img'] = 'milestones/' . $imageName;
            }

            // Handle PDF upload
            if ($request->hasFile("milestones.$index.pdf")) {
                $file = $request->file("milestones.$index.pdf");

                // Delete old PDF if exists
                if ($milestoneId) {
                    $oldMilestone = $project->milestones()->find($milestoneId);
                    if ($oldMilestone && $oldMilestone->pdf) {
                        $oldPath = public_path('assets/' . $oldMilestone->pdf);
                        if (File::exists($oldPath)) {
                            File::delete($oldPath);
                        }
                    }
                }

                $pdfName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('assets/milestones/pdfs'), $pdfName);
                $payload['pdf'] = 'milestones/pdfs/' . $pdfName;
            }

            if ($milestoneId) {
                // Update existing milestone
                $project->milestones()->where('id', $milestoneId)->update($payload);
                $submittedIds[] = (int) $milestoneId;
            } else {
                // Create new milestone
                $newMilestone = $project->milestones()->create($payload);
                $submittedIds[] = $newMilestone->id;
            }
        }
    }

    // Delete milestones that were removed from the form
    $project->milestones()
        ->whereNotIn('id', $submittedIds)
        ->get()
        ->each(function ($milestone) {
            if ($milestone->img) {
                $path = public_path('assets/' . $milestone->img);
                if (File::exists($path)) {
                    File::delete($path);
                }
            }
            $milestone->delete();
        });

    return redirect()->back()->with('success', 'Project and milestones updated successfully!');
}
   public function destroy(Project $project)
{
    if (!auth()->user()->can('project-delete')) {
        abort(403, 'You do not have permission to delete a project.');
    }

    // Delete all milestone images
    foreach ($project->milestones as $milestone) {
        if ($milestone->img) {
            Storage::disk('public')->delete($milestone->img);
        }
    }

    // Delete milestones + project (cascading or manual)
    $project->milestones()->delete();
    $project->delete();

    return redirect()->route('projects.index')
        ->with('success', 'Project and all its milestones deleted successfully.');
}

    public function milestones(Project $project)
    {
        return response()->json($project->milestones()->orderBy('due_date')->get());
}
}
 
