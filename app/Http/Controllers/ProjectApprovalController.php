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
            'pdf' => 'nullable|mimes:pdf|max:10240',
            'img' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $currentStage = $project->currentStage;
        if (!$currentStage) {
            return response()->json(['message' => 'Project is not in an approval stage.'], 400);
        }

        DB::transaction(function () use ($request, $project, $currentStage) {
            // Update the last approval record for the current stage or create new
            $approval = ProjectApproval::where('project_id', $project->id)
                ->where('stage_id', $currentStage->id)
                ->orderBy('created_at', 'desc')
                ->first();

            $pdfPath = null;
            if ($request->hasFile('pdf')) {
                $file = $request->file('pdf');
                $pdfName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('approvals'), $pdfName);
                $pdfPath = 'approvals/' . $pdfName;
            }

            $imgPath = null;
            if ($request->hasFile('img')) {
                $file = $request->file('img');
                $imgName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('approvals/images'), $imgName);
                $imgPath = 'approvals/images/' . $imgName;
            }

            if ($approval) {
                $approval->update([
                    'approver_id' => auth()->id(),
                    'status' => $request->status,
                    'comments' => $request->comments,
                    'pdf' => $pdfPath ?? $approval->pdf,
                    'img' => $imgPath ?? $approval->img,
                    'action_date' => now(),
                ]);
            } else {
                ProjectApproval::create([
                    'project_id' => $project->id,
                    'stage_id' => $currentStage->id,
                    'approver_id' => auth()->id(),
                    'status' => $request->status,
                    'comments' => $request->comments,
                    'pdf' => $pdfPath,
                    'img' => $imgPath,
                    'action_date' => now(),
                ]);
            }

            if ($request->status === 'approved') {
                if ($currentStage->is_last) {
                    $project->update([
                        'overall_status' => 'approved' 
                    ]);
                } else {
                    // Find next stage (GLOBAL sequence)
                    $nextStage = ApprovalStage::where('stage_order', '>', $currentStage->stage_order)
                        ->orderBy('stage_order')
                        ->first();

                    if ($nextStage) {
                        $project->update([
                            'current_stage_id' => $nextStage->id,
                            'overall_status' => 'in_progress'
                        ]);
                        
                        // Create pending approval row for the next stage
                        ProjectApproval::create([
                            'project_id' => $project->id,
                            'stage_id' => $nextStage->id,
                            'status' => 'pending',
                            'approver_id' => null,
                            'comments' => null,
                        ]);
                    } else {
                        // No next stage found, treat as approved
                        $project->update([
                            'overall_status' => 'approved'
                        ]);
                    }
                }
            } else {
                // Rejected
                $project->update(['overall_status' => 'rejected']);
            }
        });

        return redirect()->back()->with('success', 'Approval processed successfully.');
    }

    public function history(Project $project)
    {
        $history = $project->approvals()->with('stage', 'approver')->orderBy('action_date', 'desc')->get();
        return response()->json($history);
    }
    public function selectHead(Request $request, Project $project)
    {
        $request->validate([
            'fund_head_id' => 'required|exists:fund_heads,id',
        ]);

        DB::transaction(function () use ($request, $project) {
            $project->update([
                'fund_head_id' => $request->fund_head_id,
            ]);

            // Find first stage for this SPECIFIC fund head
            $firstStage = ApprovalStage::where('fund_head_id', $request->fund_head_id)
                ->orderBy('stage_order', 'asc')
                ->first();

            if ($firstStage) {
                ProjectApproval::create([
                    'project_id' => $project->id,
                    'stage_id' => $firstStage->id,
                    'status' => 'pending',
                ]);

                $project->update([
                    'current_stage_id' => $firstStage->id,
                    'overall_status'   => 'in_progress',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Fund head selected and approval workflow initialized.');
    }
}
