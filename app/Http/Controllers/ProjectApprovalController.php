<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Models\Fund;
use App\Models\FundHead;
use App\Models\Institute;

class ProjectApprovalController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'status'   => ['required', Rule::in(['approved', 'rejected'])],
            'comments' => 'nullable|string',
            'pdf'      => 'nullable|file',
            'img'      => 'nullable|file',
            'stage_id' => 'nullable|integer|exists:approval_stages,id',
        ]);

        // If a specific stage_id was submitted (user selected from radio buttons), use it.
        // Otherwise fall back to the first current stage from the JSON array.
        if ($request->filled('stage_id')) {
            $currentStage = ApprovalStage::find((int) $request->stage_id);
        } else {
            $currentStage = $project->currentStage; // accessor: returns first stage in JSON array
        }

        if (!$currentStage) {
            return response()->json(['message' => 'Project is not in an approval stage.'], 400);
        }

        DB::transaction(function () use ($request, $project, $currentStage) {
            $approval = ProjectApproval::where('project_id', $project->id)
                ->where('stage_id', $currentStage->id)
                ->orderBy('created_at', 'desc')
                ->first();

            $pdfPath = null;
            if ($request->hasFile('pdf')) {
                $file    = $request->file('pdf');
                $pdfName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('approvals'), $pdfName);
                $pdfPath = 'approvals/' . $pdfName;
            }

            $imgPath = null;
            if ($request->hasFile('img')) {
                $file    = $request->file('img');
                $imgName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('approvals/images'), $imgName);
                $imgPath = 'approvals/images/' . $imgName;
            }

            if ($approval) {
                $approval->update([
                    'approver_id' => auth()->id(),
                    'status'      => $request->status,
                    'comments'    => $request->comments,
                    'pdf'         => $pdfPath ?? $approval->pdf,
                    'img'         => $imgPath ?? $approval->img,
                    'action_date' => now(),
                ]);
            } else {
                ProjectApproval::create([
                    'project_id'  => $project->id,
                    'stage_id'    => $currentStage->id,
                    'approver_id' => auth()->id(),
                    'status'      => $request->status,
                    'comments'    => $request->comments,
                    'pdf'         => $pdfPath,
                    'img'         => $imgPath,
                    'action_date' => now(),
                ]);
            }
            $pendingcount = ProjectApproval::where('project_id', $project->id)->where('status', 'pending')->count();
            if ($request->status === 'approved' && $pendingcount ==0) {
                if ($currentStage->is_last) {
                    $project->update([
                        'final_comments' => $request->comments,
                        'status'         => 'completed',
                    ]);
                } else {
                    // Collect next stages for ALL fund heads in the JSON
                    $fundHeadJson    = $project->fund_head_id ?? [];
                    $fundHeadIds     = array_keys($fundHeadJson);

                    // Map: stage_name => first matching ApprovalStage (shared if same name)
                    $nextStagesByName = [];

                    foreach ($fundHeadIds as $headId) {
                        $nextStage = ApprovalStage::where('stage_order', '>', $currentStage->stage_order)
                            ->where('fund_head_id', (int) $currentStage->fund_head_id)
                            ->orderBy('stage_order')
                            ->first();

                        if ($nextStage) {
                            $stageName = $nextStage->stage_name;
                            // Same name → keep the first one (shared stage)
                            if (!isset($nextStagesByName[$stageName])) {
                                $nextStagesByName[$stageName] = $nextStage;
                            }
                        }
                    }
        //  dd($nextStagesByName, $fundHeadIds   );
                    // Special rule: "Execution of approved work" is only created
                    // when ALL fund heads share it as their next stage.
                    // If even one fund head has a different next stage, exclude it.
                    $executionStageName = 'Execution of approved work';
                    if (isset($nextStagesByName[$executionStageName]) && count($nextStagesByName) > 1) {
                        // Not all fund heads point to this stage exclusively → remove it
                        unset($nextStagesByName[$executionStageName]);
                    }

                    if (!empty($nextStagesByName)) {
                        // Save ALL next stage IDs as JSON array
                        $nextStageIds = array_values(
                            array_map(fn($s) => $s->id, array_values($nextStagesByName))
                        );
              
                        $project->update(['current_stage_id' => $nextStageIds]);

                        if ($currentStage->change_to_in_progress && $pendingcount ==0 ) {
                            $project->update([
                                'approval_status' => 'approved',
                                'status'          => 'inprogress',
                            ]);
                        }

                        // Create a pending approval row for each unique next stage
                        foreach ($nextStagesByName as $nextStage) {
                            ProjectApproval::create([
                                'project_id'  => $project->id,
                                'stage_id'    => $nextStage->id,
                                'status'      => 'pending',
                                'approver_id' => null,
                                'comments'    => null,
                            ]);
                        }
                    } else {
                        // No further stages for any fund head → project fully approved
                        $project->update([
                            'approval_status' => 'approved',
                            'status'          => 'completed',
                        ]);
                    }
                }
            } else if($request->status === 'rejected') {
                $project->update(['approval_status' => 'rejected']);
            }
        });

        return redirect()->back()->with('success', 'Approval processed successfully.');
    }

    /**
     * Return all pending ProjectApproval rows for a project with their stage names.
     * Used by the ApprovalModal frontend to display radio button choices.
     */
    public function pendingStages(Project $project)
    {
        $pending = ProjectApproval::where('project_id', $project->id)
            ->where('status', 'pending')
            ->with('stage:id,stage_name')
            ->get()
            ->map(fn($pa) => [
                'id'         => $pa->id,
                'stage_id'   => $pa->stage_id,
                'stage_name' => $pa->stage->stage_name ?? 'Unknown Stage',
            ]);

        return response()->json($pending);
    }

    public function history(Project $project)
    {
        $history = $project->approvals()->with('stage.fundHead', 'approver')->orderBy('id', 'asc')->get();
        return response()->json($history);
    }

    /**
     * Select (multiple) fund heads with their sanction amounts.
     *
     * Accepts:
     *   fund_heads: [{ fund_head_id: int, sanction_amount: numeric }, ...]
     *
     * Business rules:
     *  - Merges new entries into the existing JSON (won't overwrite existing heads unless same ID).
     *  - For each unique fund head, look up its first approval stage.
     *  - If multiple heads share the same stage_name -> create only ONE stage (shared).
     *  - If different stage_names -> create separate stages for each head.
     */
    public function selectHead(Request $request, Project $project)
    {
        $request->validate([
            'fund_heads'                    => 'required|array|min:1',
            'fund_heads.*.fund_head_id'     => 'required|integer|exists:fund_heads,id',
            'fund_heads.*.sanction_amount'  => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $project) {

            // --- 1. Merge new fund heads into existing JSON ---
            $existing = $project->fund_head_id ?? [];
            foreach ($request->fund_heads as $entry) {
                $existing[(string) $entry['fund_head_id']] = (float) $entry['sanction_amount'];
            }
            $project->update(['fund_head_id' => $existing]);

            // --- 2. For each fund head, find its first approval stage ---
            $newFundHeadIds = array_column($request->fund_heads, 'fund_head_id');

            // Group stages by stage_name to detect duplicates
            $stagesPerHead = [];
            foreach ($newFundHeadIds as $headId) {
                $stage = ApprovalStage::where('fund_head_id', $headId)
                    ->orderBy('stage_order', 'asc')
                    ->first();
                if ($stage) {
                    $stagesPerHead[$headId] = $stage;
                }
            }

            if (empty($stagesPerHead)) {
                return; // No stages configured – skip
            }

            // --- 3. Group stages by stage_name: same name = one stage, different = multiple ---
            $stagesByName = [];
            foreach ($stagesPerHead as $headId => $stage) {
                $key = strtolower(trim($stage->stage_name));
                if (!isset($stagesByName[$key])) {
                    $stagesByName[$key] = $stage; // Use the first one found
                }
            }

            // --- 4. Create a pending approval row for each unique stage ---
            //   Use the FIRST unique stage as the project's current stage
            $firstStage = null;
            foreach ($stagesByName as $stageName => $stage) {
                // Avoid duplicate pending approvals for same stage
                $exists = ProjectApproval::where('project_id', $project->id)
                    ->where('stage_id', $stage->id)
                    ->where('status', 'pending')
                    ->exists();

                if (!$exists) {
                    ProjectApproval::create([
                        'project_id'  => $project->id,
                        'stage_id'    => $stage->id,
                        'status'      => 'pending',
                        'approver_id' => null,
                        'comments'    => null,
                    ]);
                }

                if (!$firstStage) {
                    $firstStage = $stage;
                }
            }

            // --- 5. Update project's current stage if not already in progress ---
            if ($firstStage && in_array($project->approval_status, ['waiting', null, ''])) {
                // Save ALL first stage IDs as JSON array
                $allFirstStageIds = array_values(
                    array_map(fn($s) => $s->id, array_values($stagesByName))
                );
                $project->update([
                    'current_stage_id' => $allFirstStageIds,
                    'approval_status'  => 'inprogress',
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Fund head(s) selected and approval workflow initialized.']);
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

        $fundHeadJson = $project->fund_head_id ?? [];
        $fundHeadIds  = array_keys($fundHeadJson);

        // Find first stage for each fund head, group by stage_name
        $firstStagesByName = [];
        foreach ($fundHeadIds as $headId) {
            $stage = ApprovalStage::where('stage_order', 1)
                ->where('fund_head_id', (int) $headId)
                ->orderBy('stage_order')
                ->first();
            if ($stage && !isset($firstStagesByName[$stage->stage_name])) {
                $firstStagesByName[$stage->stage_name] = $stage;
            }
        }

        if ($request->actual_cost > $project->estimated_cost) {
            $lastApprovalStage = ProjectApproval::where('project_id', $project->id)
                ->orderBy('id', 'desc')
                ->first();

            $lastApprovalStage?->update([
                'status'   => 'rejected',
                'comments' => 'Actual cost(' . $request->actual_cost . ') greater than estimated cost(' . $project->estimated_cost . ')',
            ]);

            // Create pending approval row for each unique first stage
            foreach ($firstStagesByName as $stage) {
                ProjectApproval::create([
                    'project_id' => $project->id,
                    'stage_id'   => $stage->id,
                    'status'     => 'pending',
                ]);
            }

            // Save all first stage IDs as JSON array
            $firstStageIds = array_values(array_map(fn($s) => $s->id, array_values($firstStagesByName)));

            $project->update([
                'current_stage_id' => $firstStageIds,
                'approval_status'  => 'waiting',
                'status'           => 'waiting',
                'estimated_cost'   => $request->actual_cost,
            ]);
        } else {
            DB::transaction(function () use ($request, $project) {
                $project->update(['actual_cost' => $request->actual_cost]);
            });
            return redirect()->back()->with('success', 'Actual cost updated successfully.');
        }
    }
}
