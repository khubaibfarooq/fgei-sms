<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStage;
use App\Models\ProjectType;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApprovalStageController extends Controller
{
    public function index(Request $request)
    {
        $query = ApprovalStage::with('projectType')->orderBy('project_type_id')->orderBy('stage_order');

        if ($request->has('project_type_id') && $request->project_type_id) {
            $query->where('project_type_id', $request->project_type_id);
        }

        $stages = $query->get();
        $users = User::select('id', 'name')->get();
        $projectTypes = ProjectType::select('id', 'name')->get();

        return Inertia::render('approval_stages/Index', [
            'stages' => $stages,
            'users' => $users,
            'projectTypes' => $projectTypes,
            'filters' => [
                'project_type_id' => $request->project_type_id
            ]
        ]);
    }

    public function create()
    {
        $projectTypes = ProjectType::all();
        $roles = Role::all(); 
        $users = User::select('id', 'name')->get(); 

        return Inertia::render('approval_stages/Form', [
            'projectTypes' => $projectTypes,
            'users' => $users,
            'roles' => $roles
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'stage_name' => 'required|string|max:255',
            'project_type_id' => 'required|exists:project_types,id',
            'stage_order' => 'required|integer',
            'users_can_approve' => 'nullable|array',
            'is_mandatory' => 'boolean',
            'description' => 'nullable|string',
            'is_last' => 'boolean',
            'level' => 'string',
            'is_user_required' => 'boolean',
        ]);

        ApprovalStage::create($request->all());

        return redirect()->route('approval-stages.index')->with('success', 'Stage created successfully.');
    }

    public function edit(ApprovalStage $approvalStage)
    {
        $projectTypes = ProjectType::all();
        $users = User::select('id', 'name')->get();
        
        return Inertia::render('approval_stages/Form', [
            'stage' => $approvalStage,
            'projectTypes' => $projectTypes,
            'users' => $users
        ]);
    }

    public function update(Request $request, ApprovalStage $approvalStage)
    {
        $request->validate([
             'stage_name' => 'required|string|max:255',
            'project_type_id' => 'required|exists:project_types,id',
            'stage_order' => 'required|integer',
            'users_can_approve' => 'nullable|array',
            'is_mandatory' => 'boolean',
            'description' => 'nullable|string',
            'is_last' => 'boolean',
            'level' => 'string',
            'is_user_required' => 'boolean',
        ]);

        $approvalStage->update($request->all());

        return redirect()->route('approval-stages.index')->with('success', 'Stage updated successfully.');
    }

    public function destroy(ApprovalStage $approvalStage)
    {
        $approvalStage->delete();
        return redirect()->back()->with('success', 'Stage deleted successfully.');
    }
}
