<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contractor extends Model
{
    protected $table = 'contractor';
    protected $fillable = ['name', 'contact', 'email', 'address', 'company_id'];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
