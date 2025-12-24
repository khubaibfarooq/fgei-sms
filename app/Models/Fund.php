<?php




namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Fund extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['fund_head_id', 'amount','institute_id','added_date','status',	'description'	,'type',	'added_by'	,'tid','trans_type','img','approve_by','approved_date'
];

    protected $casts = [
        'approve_by' => 'integer',
        'approved_date' => 'datetime',
        'added_date' => 'date',
        'amount' => 'decimal:2',
    ];


    public function FundHead()
    {
        return $this->belongsTo(FundHead::class);
    } public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function approver(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'approve_by');
    }
 
}
