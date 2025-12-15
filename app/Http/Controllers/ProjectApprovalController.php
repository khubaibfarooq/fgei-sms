<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Project;
use App\Models\ProjectApproval;

class ProjectApprovalController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'comments' => 'nullable|string',
        ]);

        $currentStage = $project->currentStage;
        if (!$currentStage) {
            return response()->json(['message' => 'Project is not in an approval stage.'], 400);
        }

        // Check permission (mocking logic: assume if logic allows, implementation details for roles/permissions to be added)
        // For now, we allow any auth user for demo, or we check if user role matches `users_can_approve` JSON.
        
        DB::transaction(function () use ($request, $project, $currentStage) {
            // Record Approval
            ProjectApproval::create([
                'project_id' => $project->id,
                'stage_id' => $currentStage->id,
                'approver_id' => auth()->id(),
                'status' => $request->status,
                'comments' => $request->comments,
                'action_date' => now(),
            ]);

            if ($request->status === 'approved') {
                // Find next stage
                $nextStage = ApprovalStage::where('project_type_id', $project->project_type_id)
                    ->where('stage_order', '>', $currentStage->stage_order)
                    ->orderBy('stage_order')
                    ->first();

                if ($nextStage) {
                    $project->update([
                        'current_stage_id' => $nextStage->id,
                        'overall_status' => 'in_progress'
                    ]);
                } else {
                    // No next stage, final approval
                    $project->update([
                        'current_stage_id' => null, // Or keep last? Usually null or special completed stage.
                        'overall_status' => 'approved'
                    ]);
                }
            } else {
                // Rejected
                $project->update(['overall_status' => 'rejected']);
            }
        });

        return response()->json(['message' => 'Approval processed successfully.']);
    }

    public function history(Project $project)
    {
        $history = $project->approvals()->with('stage', 'approver')->orderBy('action_date', 'desc')->get();
        return response()->json($history);
    }
}
