<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'company';
    protected $fillable = ['name', 'contact', 'email', 'address'];

    public function contractors()
    {
        return $this->hasMany(Contractor::class);
    }
}
