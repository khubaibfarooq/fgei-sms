<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Models\ProjectEffect;
use App\Models\Fund;
use App\Models\FundHead;
use App\Models\Institute;
use App\Models\Block;
use App\Models\Room;
use App\Models\InstituteAsset;

class ProjectApprovalController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'status'              => ['required', Rule::in(['approved', 'rejected'])],
            'comments'            => 'nullable|string',
            'pdf'                 => 'nullable|file',
            'img'                 => 'nullable|file',
            'stage_id'            => 'nullable|integer|exists:approval_stages,id',
            'revert_to_stage_id'  => 'nullable|integer|exists:approval_stages,id',
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

        $errorRedirect = null;

        try {
            DB::transaction(function () use ($request, $project, $currentStage, &$errorRedirect) {
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
                        // Completion guards — milestones + payments must all be done
                        $completionErrors = $this->canCompleteProject($project);
                        if (!empty($completionErrors)) {
                            // Store error and abort — project stays in current state
                            $errorRedirect = redirect()->back()->with('error', "Cannot complete project:\n• " . implode("\n• ", $completionErrors));
                            throw new \Exception('COMPLETION_ERROR');
                        }

                        $project->update([
                            'final_comments' => $request->comments,
                            'status'         => 'completed',
                        ]);

                        // Apply all pending effects
                        $this->applyProjectEffects($project);
                    } else {
                        // Collect next stages for ALL fund heads in the JSON
                        // $fundHeadJson    = $project->fund_head_id ?? [];
                        // $fundHeadIds     = array_keys($fundHeadJson);
      $ids = $project->getRawOriginal('current_stage_id')
                ? json_decode($project->getRawOriginal('current_stage_id'), true)
                : [];
                $fundHeadIds = ApprovalStage::whereIn('id', $ids)->pluck('fund_head_id')->filter()->unique()->values();
                        // Map:` stage_name => first matching ApprovalStage (shared if same name)
                        $nextStagesByName = [];
       
       if(count($ids)==1 && count($fundHeadIds)==0 ){
        $fundHeadIds = [$currentStage->fund_head_id];
       }
       //dd($fundHeadIds);
                        foreach ($fundHeadIds as $headId) {
                            $nextStage = ApprovalStage::where('stage_order', '>', $currentStage->stage_order)
                                ->where('fund_head_id', (int) $headId)
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

                        // Special rule: "Execution of approved work" is only created
                        // when ALL fund heads share it as their next stage.
                        // If even one fund head has a different next stage, exclude it.
                        $executionStageName = 'Execution of approved work';
                        if (isset($nextStagesByName[$executionStageName]) && count($nextStagesByName) > 1 &&!isset($nextStagesByName["Regional Dev Committee"]) ) {
                            // Not all fund heads point to this stage exclusively → remove it
                            unset($nextStagesByName[$executionStageName]);
                        }else if(isset($nextStagesByName["Regional Dev Committee"]) && count($nextStagesByName) > 1 ) {
                            // Not all fund heads point to this stage exclusively → remove it
                            unset($nextStagesByName["Regional Dev Committee"]);
                        }
            // dd($nextStagesByName,count($nextStagesByName)  );
                        if (!empty($nextStagesByName)) {
                            // Save ALL next stage IDs as JSON array
                            $nextStageIds = array_values(
                                array_map(fn($s) => $s->id, array_values($nextStagesByName))
                            );
                 // dd($nextStageIds  );
                            $project->update(['current_stage_id' => $nextStageIds]);
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
                            $pendingcount = ProjectApproval::where('project_id', $project->id)->where('status', 'pending')->count();
                    
                            if ($currentStage->change_to_in_progress && $pendingcount ==1 ) {
                                $project->update([
                                    'approval_status' => 'approved',
                                    'status'          => 'inprogress',
                                    'actual_cost'     => null,
                                ]);
                            }


                         } 
                         else {
                            // No further stages for any fund head → project fully approved
                            // Completion guards — milestones + payments must all be done
                            $completionErrors = $this->canCompleteProject($project);
                            if (!empty($completionErrors)) {
                                $errorRedirect = redirect()->back()->with('error', 'Project cannot be completed: ' . implode('; ', $completionErrors));
                                throw new \Exception('COMPLETION_ERROR');
                            }

                            $project->update([
                                'approval_status' => 'approved',
                                'status'          => 'completed',
                            ]);

                            // Apply all pending effects
                            $this->applyProjectEffects($project);
                        }
                    }
                } else if($request->status === 'rejected') {
                    $project->update(['approval_status' => 'rejected']);

                    // If a revert stage was selected, re-create it as pending
                    if ($request->filled('revert_to_stage_id')) {
                        $revertStage = ApprovalStage::find((int) $request->revert_to_stage_id);
                        if ($revertStage) {
                            ProjectApproval::create([
                                'project_id'  => $project->id,
                                'stage_id'    => $revertStage->id,
                                'status'      => 'pending',
                                'approver_id' => null,
                                'comments'    => 'Stage reverted after rejection.',
                                'action_date' => null,
                            ]);
                            $project->update([
                                'current_stage_id' => [$revertStage->id],
                                'approval_status'  => 'inprogress',
                                'status'           => 'waiting',
                            ]);
                        }
                    }
                }
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'COMPLETION_ERROR' && $errorRedirect) {
                return $errorRedirect;
            }
            throw $e;
        }

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

            // --- 1. Merge new fund heads into existing JSON (comma-separated top-up) ---
            $existing = $project->fund_head_id ?? [];
            foreach ($request->fund_heads as $entry) {
                $key = (string) $entry['fund_head_id'];
                $newAmount = (float) $entry['sanction_amount'];
                if (isset($existing[$key])) {
                    // Append as comma-separated to keep history
                    $existing[$key] = $existing[$key] . ',' . $newAmount;
                } else {
                    $existing[$key] = (string) $newAmount;
                }
            }
            $project->update(['fund_head_id' => $existing]);

            // // --- 1.5. Add the submitted amounts to estimated_cost ---
            // $addedTotal = array_sum(array_column($request->fund_heads, 'sanction_amount'));
            // if ($addedTotal > 0) {
            //     $project->increment('estimated_cost', $addedTotal);
            // }

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

            // --- 3. Group stages by stage_name ---
            // stagesByName: name => first stage (used for one pending approval row per name)
            // allStagesByName: name => [all stages] (used to collect ALL ids for current_stage_id)
            $stagesByName    = [];
            $allStagesByName = [];
            foreach ($stagesPerHead as $headId => $stage) {
                $key = strtolower(trim($stage->stage_name));
                if (!isset($stagesByName[$key])) {
                    $stagesByName[$key] = $stage; // First stage → used for approval row
                }
                $allStagesByName[$key][] = $stage; // All stages → used for current_stage_id
            }

            // --- 4. Create a pending approval row for each unique stage name ---
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

            // --- 4.5. Auto-approve any pending "Extension" stage for this project ---
            $extensionStage = ApprovalStage::where('stage_name', 'Extension')->first();
            if ($extensionStage) {
                ProjectApproval::where('project_id', $project->id)
                    ->where('stage_id', $extensionStage->id)
                    ->where('status', 'pending')
                    ->update([
                        'status'      => 'approved',
                        'approver_id' => auth()->id(),
                        'comments'    => 'Extension approved via fund head assignment.',
                        'action_date' => now(),
                    ]);
            }

            // --- 5. Update project's current stage if not already in progress ---
            if ($firstStage && in_array($project->approval_status, ['waiting', null, 'inprogress'])) {
                // Collect ALL stage IDs across all same-name groups
                $allFirstStageIds = [];
                foreach ($allStagesByName as $stages) {
                    foreach ($stages as $s) {
                        $allFirstStageIds[] = $s->id;
                    }
                }
                $allFirstStageIds = array_values(array_unique($allFirstStageIds));

                $project->update([
                    'current_stage_id' => $allFirstStageIds,
                    'approval_status'  => 'inprogress',
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Fund head(s) selected and approval workflow initialized.']);
    }

    /**
     * Apply to extend project: creates an "Extension" pending approval stage.
     */
    public function applyExtension(Request $request, Project $project)
    {
        $request->validate([
            'description' => 'required|string|max:5000',
            'pdf'         => 'required|file|mimes:pdf|max:10240',
        ]);

        // Find or create the "Extension" approval stage
        $extensionStage = ApprovalStage::firstOrCreate(
            ['stage_name' => 'Extension'],
            [
                'stage_order'          => 999,
                'is_last'              => false,
                'is_mandatory'         => false,
                'is_user_required'     => false,
                'change_to_in_progress'=> false,
                'can_change_cost'      => false,
                'level'                => 'regional',
            ]
        );

        // Upload PDF
        $pdfPath = null;
        if ($request->hasFile('pdf')) {
            $file    = $request->file('pdf');
            $pdfName = time() . '-ext-' . uniqid() . '.' . $file->getClientOriginalExtension();

            if (!is_dir(public_path('approvals/extensions'))) {
                mkdir(public_path('approvals/extensions'), 0755, true);
            }

            $file->move(public_path('approvals/extensions'), $pdfName);
            $pdfPath = 'approvals/extensions/' . $pdfName;
        }

        DB::transaction(function () use ($request, $project, $extensionStage, $pdfPath) {
            // Mark the last pending stage as 'extension requested'
            $lastPending = ProjectApproval::where('project_id', $project->id)
                ->where('status', 'pending')
                ->orderBy('id', 'desc')
                ->first();
//dd($lastPending);
            if ($lastPending) {
                $lastPending->update(['status' => 'extension requested']);
            }

            // Create pending approval record for the extension stage
            ProjectApproval::create([
                'project_id'  => $project->id,
                'stage_id'    => $extensionStage->id,
                'approver_id' => null,
                'status'      => 'pending',
                'comments'    => $request->description,
                'pdf'         => $pdfPath,
                'action_date' => null,
            ]);

            // Update project current stage and status
            $project->update([
                'current_stage_id' => [$extensionStage->id],
                'approval_status'  => 'inprogress',
                'status'           => 'waiting',
            ]);
        });

        return redirect()->back()->with('success', 'Extension request submitted successfully.');
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
        if (!is_array($fundHeadJson)) {
            $fundHeadJson = [(string) $fundHeadJson => 0];
        }
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

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Check if a project is ready to be completed.
     * Returns an array of human-readable error strings (empty = all good).
     */
    private function canCompleteProject(Project $project): array
    {
        $errors = [];

        // 1. All milestones must be completed
        $pendingMilestones = $project->milestones()
            ->where('status', '!=', 'completed')
            ->get();

        if ($pendingMilestones->isNotEmpty()) {
            $names = $pendingMilestones->pluck('name')->implode(', ');
            $count = $pendingMilestones->count();
            $errors[] = "{$count} milestone(s) not completed: {$names}";
        }

        // 2. All payments (Funds) for this project must be Approved
        $pendingPayments = Fund::where('trans_type', 'project')
            ->where('tid', $project->id)
            ->where('status', '!=', 'Approved')
            ->get();

        if ($pendingPayments->isNotEmpty()) {
            $count = $pendingPayments->count();
            $total = number_format($pendingPayments->sum('amount'), 2);
            $errors[] = "{$count} payment(s) not approved (total Rs. {$total})";
        }

        // 3. Approved payments must equal actual cost
        $approvedPaymentsTotal = Fund::where('trans_type', 'project')
            ->where('tid', $project->id)
            ->where('status', 'Approved')
            ->sum('amount');

        $actualCost = $project->actual_cost ?? 0;

        if (round((float)$approvedPaymentsTotal, 2) !== round((float)$actualCost, 2)) {
            $errors[] = "Total approved payments (Rs. " . number_format($approvedPaymentsTotal, 2) . ") must be equal to the actual cost (Rs. " . number_format($actualCost, 2) . ")";
        }

        return $errors;
    }

    /**
     * Execute all unapplied ProjectEffect rows for the given project.
     * Creates Block/Room/Asset records as defined in each effect's `effect_data`.
     */
    private function applyProjectEffects(Project $project): void
    {
        $instituteId = $project->institute_id;

        foreach ($project->effects()->where('applied', false)->get() as $effect) {
            $data = $effect->effect_data;

            switch ($effect->effect_type) {

                case 'block':
                    $block = Block::create([
                        'name'           => $data['name'],
                        'area'           => $data['area'] ?? null,
                        'institute_id'   => $instituteId,
                        'block_type_id'  => $data['block_type_id'],
                        'establish_date' => now()->toDateString(),
                    ]);
                    foreach ($data['rooms'] ?? [] as $roomData) {
                        $room = Room::create([
                            'name'         => $roomData['name'],
                            'area'         => $roomData['area'] ?? null,
                            'room_type_id' => $roomData['room_type_id'],
                            'block_id'     => $block->id,
                        ]);

                        foreach ($roomData['assets'] ?? [] as $asset) {
                            InstituteAsset::create([
                                'institute_id' => $instituteId,
                                'asset_id'     => $asset['asset_id'],
                                'current_qty'  => (int)($asset['qty'] ?? 1),
                                'room_id'      => $room->id,
                                'details'      => $asset['details'] ?? 'Added via project completion',
                                'added_by'     => auth()->id(),
                                'added_date'   => now()->toDateString(),
                            ]);
                        }
                    }
                    break;

                case 'room':
                    Room::create([
                        'name'         => $data['name'],
                        'area'         => $data['area'] ?? null,
                        'room_type_id' => $data['room_type_id'],
                        'block_id'     => $data['block_id'],
                    ]);
                    break;

                case 'asset':
                    $existing = InstituteAsset::where('asset_id', $data['asset_id'])
                        ->where('room_id', $data['room_id'] ?? null)
                        ->where('institute_id', $instituteId)
                        ->first();

                    if ($existing) {
                        // Add to existing asset quantity
                        $existing->update([
                            'current_qty' => $existing->current_qty + (int)($data['qty'] ?? 1),
                        ]);
                    } else {
                        InstituteAsset::create([
                            'institute_id' => $instituteId,
                            'asset_id'     => $data['asset_id'],
                            'current_qty'  => (int)($data['qty'] ?? 1),
                            'room_id'      => $data['room_id'] ?? null,
                            'details'      => $data['details'] ?? 'Added via project completion',
                            'added_by'     => auth()->id(),
                            'added_date'   => now()->toDateString(),
                        ]);
                    }
                    break;
            }

            $effect->update([
                'applied'    => true,
                'applied_at' => now(),
                'applied_by' => auth()->id(),
            ]);
        }
    }
}
