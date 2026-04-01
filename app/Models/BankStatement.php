<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankStatement extends Model
{
    use HasFactory;

    protected $fillable = [
        'institute_id',
        'image',
        'uploaded_by',
    ];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
