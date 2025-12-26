<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Models\Fund;
use App\Models\Institute;
class ProjectApprovalController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'comments' => 'nullable|string',
            'pdf' => 'nullable|file',
            'img' => 'nullable|file',
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
                        
                        'status' => 'completed'
                    ]);
                } else {
                    
                    // Find next stage (GLOBAL sequence)
                    $nextStage = ApprovalStage::where('stage_order', '>', $currentStage->stage_order)
                        ->orderBy('stage_order')
                        ->first();

                    if ($nextStage) {
                        $project->update([
                            'current_stage_id' => $nextStage->id,
                      
                        ]);
                        if($currentStage->change_to_in_progress){
                        $project->update([
                            'overall_status' => 'approved',
                            'status' => 'inprogress',
                        ]);
                    }
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
                            'overall_status' => 'approved',
                            'status' => 'completed',
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
        $history = $project->approvals()->with('stage', 'approver')->orderBy('id', 'asc')->get();
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
                    'overall_status'   => 'inprogress',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Fund head selected and approval workflow initialized.');
    }

    public function updateActualCost(Request $request, Project $project)
    {
        $request->validate([
            'actual_cost' => 'required|numeric|min:0',
        ]);

        $currentStage = $project->currentStage;
        if (!$currentStage || !$currentStage->can_change_cost) {
            return redirect()->back()->with('error', 'You are not allowed to update the cost at this stage.');
        }

        DB::transaction(function () use ($request, $project) {
            $project->update([
                'actual_cost' => $request->actual_cost,
            ]);

            // 2. Transaction for the Region (20% of actual cost)
            if ($project->institute && $project->institute->region_id) {
                $regionid=Institute::where("region_id",$project->institute->region_id)->where("type","Regional Office")->first()->id;
                Fund::create([
                    'fund_head_id' => $project->fund_head_id,
                    'institute_id' => $regionid,
                    'amount'       => $project->actual_cost * 0.20,
                    'added_by'     => auth()->id(),
                    'added_date'   => now(),
                    'status'       => 'Pending',
                    'type'         => 'out',
                    'description'  => 'Region share (20%) for project: ' . $project->name,
                    'trans_type'   => 'project',
                    'tid'          => $project->id,
                ]);
            }
        });
        return redirect()->back()->with('success', 'Actual cost updated successfully.');
    }
}
