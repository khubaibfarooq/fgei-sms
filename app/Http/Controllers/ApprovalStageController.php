<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStage;
use App\Models\ProjectType;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\FundHead;

class ApprovalStageController extends Controller
{
    public function index(Request $request)
    {
        $query = ApprovalStage::with('fundHead')->orderBy('stage_order');

        if ($request->has('fund_head_id') && $request->fund_head_id) {
            $query->where('fund_head_id', $request->fund_head_id);
        }

        $stages = $query->get();
        $users = User::select('id', 'name')->get();
        $fundHeads = FundHead::select('id', 'name')->get();

        return Inertia::render('approval_stages/Index', [
            'stages' => $stages,
            'users' => $users,
            'fundHeads' => $fundHeads,
            'filters' => [
                'fund_head_id' => $request->fund_head_id
            ]
        ]);
    }

    public function create()
    {
        $fundHeads = FundHead::all();
        $roles = Role::all(); 
        $users = User::select('id', 'name')->get(); 

        return Inertia::render('approval_stages/Form', [
            'fundHeads' => $fundHeads,
            'users' => $users,
            'roles' => $roles
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'stage_name' => 'required|string|max:255',
            'fund_head_id' => 'nullable|exists:fund_heads,id',
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
        $fundHeads = FundHead::all();
        $users = User::select('id', 'name')->get();
        
        return Inertia::render('approval_stages/Form', [
            'stage' => $approvalStage,
            'fundHeads' => $fundHeads,
            'users' => $users
        ]);
    }

    public function update(Request $request, ApprovalStage $approvalStage)
    {
        $request->validate([
             'stage_name' => 'required|string|max:255',
            'fund_head_id' => 'nullable|exists:fund_heads,id',
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
