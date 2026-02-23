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
use App\Models\Fund;
use App\Models\Institute;
use App\Models\Contractor;
use App\Models\Company;
use App\Models\ProjectImage;

class ProjectController extends Controller
{
    public function index(Request $request)
    {

        $query = Project::with('institute','fundHead','projecttype');
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
        $contractors = Contractor::all();
        $companies = Company::all();

        return Inertia::render('projects/Form', [
            'project' => null,
            'projectTypes' => $projectTypes,
            'contractors' => $contractors,
            'companies' => $companies,
        ]);
    }
public function store(Request $request)
{
    $request->validate([
        'name'             => 'required|string|max:255',
        'estimated_cost'   => 'required|numeric',
        'project_type_id'  => 'required|exists:project_types,id',
        'priority'         => 'nullable|string',
        'description'      => 'nullable|string',
        'actual_cost'      => 'required_if:status,completed|nullable|numeric',
        'pdf'              => 'nullable|file|max:10240',
        'structural_plan'  => 'nullable|file|max:10240',
        'contractor_id'    => 'nullable|exists:contractor,id',

        'final_comments'   => 'required_if:status,completed|nullable|string',

        'milestones.*.name'           => 'required_with:milestones.*.days|string|max:255',
        'milestones.*.description'    => 'nullable|string',
        'milestones.*.days'           => 'required_with:milestones.*.name|integer',
        'milestones.*.status'         => 'nullable|string',
        'milestones.*.completed_date' => 'nullable|date',
        'milestones.*.img'            => 'nullable|file|max:5120',
        'milestones.*.pdf'            => 'nullable|file|max:10240',
    ]);


    $project = Project::create([
        'name'             => $request->name,
        'estimated_cost'   => $request->estimated_cost,
        'fund_head_id'     => $request->fund_head_id,
        'project_type_id'  => $request->project_type_id,
        'status'           => 'waiting',
        'actual_cost'      => $request->actual_cost,
        'final_comments'   => $request->final_comments,
        'priority'         => $request->priority,
        'description'      => $request->description,
        'institute_id'     => session('sms_inst_id'),
        'submitted_by'     => auth()->id(),
        'approval_status'  => 'waiting',
        'contractor_id'    => $request->contractor_id,
        'updated_by'       => auth()->id(),
    ]);

    if ($request->hasFile("pdf")) {
        $file = $request->file("pdf");
        $FILENAME = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('assets/projects'), $FILENAME);
        $project->pdf = 'projects/' . $FILENAME;
        $project->save();
    }

    if ($request->hasFile("structural_plan")) {
        $file = $request->file("structural_plan");
        $FILENAME = time() . '-plan-' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('assets/projects/plans'), $FILENAME);
        $project->structural_plan = 'projects/plans/' . $FILENAME;
        $project->save();
    }
  
    if ($request->has('milestones')) {
        foreach ($request->input('milestones', []) as $index => $m) {
            if (empty($m['name']) || empty($m['days'])) {
                continue;
            }

            $payload = [
                'name'           => $m['name'],
                'description'    => $m['description'] ?? null,
                'days'           => $m['days'],
                'status'         => $m['status'] ?? 'pending',
                'completed_date' => $m['completed_date'] ?? null,
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
        $milestones = $project->milestones;
        $contractors = Contractor::all();
        $companies = Company::all();

        return Inertia::render('projects/Form', [
            'project'     => $project,
            'projectTypes'=> $projectTypes,
            'contractors' => $contractors,
            'companies'   => $companies,
            'milestones'  => $milestones,
        ]);
    }
  


public function update(Request $request, Project $project)
{
    $request->validate([
        'name'             => 'required|string|max:255',
        'estimated_cost'   => 'required|numeric|min:0',        'project_type_id'  => 'required|exists:project_types,id',
        'priority'         => 'nullable|string',
        'description'      => 'nullable|string',
        'actual_cost'      => 'required_if:status,completed|nullable|numeric',
        'pdf'              => 'nullable|file|max:10240',
        'structural_plan'  => 'nullable|file|max:10240',
        'contractor_id'    => 'nullable|exists:contractor,id',
        'final_comments'   => 'required_if:status,completed|nullable|string',

        'milestones.*.id'             => 'nullable|integer|exists:milestones,id,project_id,' . $project->id,
        'milestones.*.name'           => 'required_with:milestones.*.days|string|max:255',
        'milestones.*.description'    => 'nullable|string',
        'milestones.*.days'           => 'required_with:milestones.*.name|integer',
        'milestones.*.status'         => 'nullable|string',
        'milestones.*.completed_date' => 'nullable|date',
        'milestones.*.img'            => 'nullable|file|max:5120',
        'milestones.*.pdf'            => 'nullable|file|max:10240',
    ]);

    if ($request->hasFile("pdf")) {
        // Delete old PDF if exists
        if ($project->pdf) {
            $oldPdfPath = public_path('assets/' . $project->pdf);
            if (File::exists($oldPdfPath)) {
                File::delete($oldPdfPath);
            }
        }
        
        $file = $request->file("pdf");
        $FILENAME = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('assets/projects'), $FILENAME);
        $project->pdf = 'projects/' . $FILENAME;
    }

    if ($request->hasFile("structural_plan")) {
        // Delete old plan if exists
        if ($project->structural_plan) {
            $oldPlanPath = public_path('assets/' . $project->structural_plan);
            if (File::exists($oldPlanPath)) {
                File::delete($oldPlanPath);
            }
        }
        
        $file = $request->file("structural_plan");
        $FILENAME = time() . '-plan-' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('assets/projects/plans'), $FILENAME);
        $project->structural_plan = 'projects/plans/' . $FILENAME;
    }

    // Update main project
    $project->update([
        'name'             => $request->name,
        'estimated_cost'   => $request->estimated_cost,
        'project_type_id'  => $request->project_type_id,
        'actual_cost'      => $request->actual_cost,
        'pdf'              =>  $project->pdf,
        'structural_plan'  =>  $project->structural_plan,
        'final_comments'   => $request->final_comments,
        'priority'         => $request->priority,
        'description'      => $request->description,
        'institute_id'     => session('sms_inst_id'),
        'contractor_id'    => $request->contractor_id,
        'updated_by'       => auth()->id(),
    ]);

    $submittedIds = [];

    if ($request->has('milestones')) {
        foreach ($request->input('milestones', []) as $index => $milestoneData) {
            $milestoneId = $milestoneData['id'] ?? null;

            // Skip completely empty rows
            if (empty($milestoneData['name']) && empty($milestoneData['days'])) {
                continue;
            }

            $payload = [
                'name'           => $milestoneData['name'],
                'description'    => $milestoneData['description'] ?? null,
                'days'           => $milestoneData['days'],
                'status'         => $milestoneData['status'] ?? 'pending',
                'completed_date' => $milestoneData['completed_date'] ?? null,
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

    // Guard: block deletion if project has approval records
    if ($project->approvals()->exists()) {
        return redirect()->back()
            ->with('error', 'Cannot delete this project because it has approval records.');
    }

    // Guard: block deletion if project has fund/payment records
    $hasFunds = \App\Models\Fund::where('tid', $project->id)
        ->where('trans_type', 'project')
        ->exists();

    if ($hasFunds) {
        return redirect()->back()
            ->with('error', 'Cannot delete this project because it has associated fund transactions.');
    }

    // Delete all project images (files + records)
    foreach ($project->images as $image) {
        $path = public_path('assets/' . $image->image);
        if (File::exists($path)) {
            File::delete($path);
        }
    }
    $project->images()->delete();

    // Delete all milestone images
    foreach ($project->milestones as $milestone) {
        if ($milestone->img) {
            $path = public_path('assets/' . $milestone->img);
            if (File::exists($path)) {
                File::delete($path);
            }
        }
    }

    // Delete milestones + project
    $project->milestones()->delete();
    $project->delete();

    return redirect()->route('projects.index')
        ->with('success', 'Project deleted successfully.');
}

    public function milestones(Project $project)
    {
        return response()->json($project->milestones()->get());
    }

    public function payments(Project $project)
    {
        $project->load('currentStage');
        return response()->json([
            'payments' => Fund::with('FundHead')
                ->where('trans_type', 'project')
                ->where('tid', $project->id)
                ->orderBy('added_date', 'asc')
                ->get(),
            'current_stage' => $project->currentStage
        ]);
    }

    public function requestPayment(Request $request, Project $project)
    {
        if (!$project->actual_cost) {
            return response()->json(['success' => false, 'message' => 'Actual cost not set.'], 400);
        }

        // Validate request
        $request->validate([
            'stage_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $stageName = $request->stage_name;
        $requestedAmount = $request->amount;

        $existingFunds = Fund::where('trans_type', 'project')
            ->where('tid', $project->id)
            ->get();

        $totalPaid = $existingFunds->where('status', 'Approved')->sum('amount');
        $remainingAmount = $project->actual_cost - $totalPaid;

        // Validate amount doesn't exceed remaining
        if ($requestedAmount > $remainingAmount) {
            return response()->json([
                'success' => false, 
                'message' => "Amount exceeds remaining budget. Maximum allowed: " . number_format($remainingAmount, 2)
            ], 400);
        }

        $regionid = Institute::where("region_id", $project->institute->region_id)
            ->where("type", "Regional Office")
            ->first()->id;

        Fund::create([
            'fund_head_id' => $project->fund_head_id,
            'institute_id' => $regionid,
            'amount' => round($requestedAmount, 2),
            'added_by' => auth()->id(),
            'added_date' => now(),
            'status' => 'Pending',
            'type' => 'out',
            'trans_type' => 'project',
            'tid' => $project->id,
            'description' => "Payment request for: " . $stageName . " (" . $project->name . ")",
        ]);

        return response()->json(['success' => true, 'message' => 'Payment request created successfully.']);
    }
public function projectDetails(Project $project)
{$project->load('institute');
    return response()->json($project);
}

    public function details(Project $project)
    {
        $project->load([
            'institute', 
            'fundHead', 
            'projecttype', 
            'currentStage',
            'contractor.company',
        ]);

        $canEditMilestones = session('sms_inst_id') == $project->institute_id && $project->status !== 'completed';

        return Inertia::render('projects/ProjectDetails', [
            'project' => $project,
            'canEditMilestones' => $canEditMilestones,
        ]);
    }

    public function updateCompletion(Request $request, Project $project)
    {
        $request->validate([
            'completion_per' => 'required|numeric|min:0|max:100',
        ]);

        $project->update([
            'completion_per' => $request->completion_per,
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Completion percentage updated successfully.'
        ]);
    }

    public function projectImages(Project $project)
    {
        return response()->json($project->images()->orderBy('date', 'desc')->get());
    }

    public function storeProjectImage(Request $request, Project $project)
    {
        $request->validate([
            'desc'  => 'nullable|string|max:1000',
            'date'  => 'nullable|date',
            'image' => 'required|file|max:51200',
        ]);

        $file = $request->file('image');
        $fileName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('assets/project_images'), $fileName);

        $image = $project->images()->create([
            'desc'  => $request->desc,
            'date'  => $request->date,
            'image' => 'project_images/' . $fileName,
        ]);

        return response()->json(['success' => true, 'message' => 'Image uploaded successfully.', 'image' => $image]);
    }

    public function deleteProjectImage(ProjectImage $projectImage)
    {
        $path = public_path('assets/' . $projectImage->image);
        if (File::exists($path)) {
            File::delete($path);
        }
        $projectImage->delete();

        return response()->json(['success' => true, 'message' => 'Image deleted successfully.']);
    }
    public function reject(Request $request, Project $project)
    {
        // if (auth()->user()->roles[0]->name !== 'Region') {
        //     abort(403, 'Unauthorized action.');
        // }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $project->update([
            'status' => 'rejected',
            'approval_status' => 'rejected',
            'final_comments' => $request->reason,
            'updated_by'       => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Project rejected successfully.');
    }

    public function initiate(Request $request, Project $project)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $project->update([
            'status' => 'waiting',
            'approval_status' => 'waiting',
            'final_comments' => $request->reason,
            'updated_by'       => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Project initiated successfully.');
    }

    public function timeline(Project $project)
    {
        $projectAuditLogs = \App\Models\AuditLog::where('table_name', 'projects')
            ->where('record_id', $project->id)
            ->with('user')
            ->orderBy('changed_at', 'desc')
            ->get();
        
        // Optionally include milestone logs if desired, merging and sorting them would be needed.
        // For now, focusing on project-level activities as requested, or we can add milestone logs too.
        // Let's stick to project logs first as per standard timeline requests, but user said "all activities related project".
        // Let's also fetch milestone logs.
        $milestoneIds = $project->milestones()->pluck('id')->toArray();
        $milestoneAuditLogs = \App\Models\AuditLog::where('table_name', 'milestones')
            ->whereIn('record_id', $milestoneIds)
            ->with('user')
            ->orderBy('changed_at', 'desc')
            ->get();

        $allLogs = $projectAuditLogs->merge($milestoneAuditLogs)->sortByDesc('changed_at')->values();

        return response()->json($allLogs);
    }
}
 
