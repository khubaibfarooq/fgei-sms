<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;


class Project extends Model
{
    use HasFactory, HasRoles;

    protected $fillable = [
        'name',
        'estimated_cost',
        'actual_cost',
        'final_comments',
        'institute_id',
        'fund_head_id',
        'project_type_id',
        'status',
        'description',
        'submitted_by',
        'current_stage_id',
        'approval_status',
        'priority',
        'completion_per',
        'pdf',
        'structural_plan',
        'contractor_id',
        'updated_by',
        'ddo',
    ];

    /**
     * fund_head_id  stores JSON like {"12": 100000, "5": 50000}
     * current_stage_id stores JSON like [12, 15] (array of active stage IDs)
     * Cast both as array so Laravel auto-encodes/decodes them.
     */
    protected $casts = [
        'fund_head_id'     => 'array',
        'current_stage_id' => 'array',
    ];

    /**
     * Get a list of fund heads with their names and sanction amounts.
     * Returns: [["id" => 12, "name" => "...", "sanction_amount" => 100000], ...]
     */
    public function getFundHeadsListAttribute(): array
    {
        $data = $this->fund_head_id ?? [];
        if (empty($data)) return [];

        $ids = array_keys($data);
        $heads = FundHead::whereIn('id', $ids)->pluck('name', 'id');

        $result = [];
        foreach ($data as $headId => $sanctionValue) {
            // Support comma-separated history: "100000,5000" → sum = 105000
            $total = array_sum(array_map('floatval', explode(',', (string) $sanctionValue)));
            $result[] = [
                'id'              => (int) $headId,
                'name'            => $heads[$headId] ?? 'Unknown',
                'sanction_amount' => $total,
            ];
        }
        return $result;
    }

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * currentStage relationship — eager-loadable via with('currentStage').
     *
     * current_stage_id is a JSON array like [12, 15].
     * We expose the first ID through the virtual attribute `_first_stage_id`
     * so Eloquent's BelongsTo can resolve it with a normal WHERE query.
     */
    public function currentStage()
    {
        // Temporarily resolve first ID so BelongsTo can use it as a FK
        $ids = $this->getRawOriginal('current_stage_id')
            ? json_decode($this->getRawOriginal('current_stage_id'), true)
            : [];
        $firstId = is_array($ids) && !empty($ids) ? (int) array_values($ids)[0] : null;
        $this->attributes['_first_stage_id'] = $firstId;

        return $this->belongsTo(ApprovalStage::class, '_first_stage_id');
    }

    /**
     * Direct property access: $project->currentStage (also used when relation isn't eager-loaded).
     * Returns the first ApprovalStage from the JSON array.
     */
    public function getCurrentStageAttribute()
    {
        // If the relation was eager-loaded, return it directly
        if ($this->relationLoaded('currentStage')) {
            return $this->getRelation('currentStage');
        }
        $ids = $this->current_stage_id ?? [];
        if (empty($ids)) return null;
        $firstId = is_array($ids) ? array_values($ids)[0] : $ids;
        return ApprovalStage::find((int) $firstId);
    }

    /**
     * Returns ALL current ApprovalStage models from the JSON array.
     */
    public function getCurrentStagesAttribute(): array
    {
        $ids = $this->current_stage_id ?? [];
        if (empty($ids)) return [];
        return ApprovalStage::whereIn('id', array_values($ids))->get()->all();
    }

    public function approvals()
    {
        return $this->hasMany(ProjectApproval::class);
    }

    public function projecttype()
    {
        return $this->belongsTo(ProjectType::class, 'project_type_id');
    }

    public function region()
    {
        return $this->institute?->region ?? null;
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }

    public function contractor()
    {
        return $this->belongsTo(Contractor::class);
    }

    public function images()
    {
        return $this->hasMany(ProjectImage::class);
    }
}
