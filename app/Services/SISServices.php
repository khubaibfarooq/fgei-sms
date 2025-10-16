<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Hrms;
use App\Models\student;
use App\Models\SIS;

class SISServices
{
    public function getStudents($GetInstitutionID)
    {
        return student::Verified_Status()
            ->current_status()
            ->InSchool($GetInstitutionID)
            ->get();
    }

}
