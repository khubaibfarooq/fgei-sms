<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Hrms;

class HrmsServices
{
    /**
     * Fetch a list of home services.
     *
     * @return array
     */
    public function getTeachingStaff($Inst_id)
    {


        $apiService = app(ApiService::class);
        $getTeachingStaff = $apiService->getTeachingStaff($Inst_id);
        $query = $getTeachingStaff['data'];

        return $query;



    }

    public function getNtsStaff($GetInstitutionID)
    {
        $apiService = app(ApiService::class);
        $getNtsStaff = $apiService->getNtsStaff($GetInstitutionID);
        $query = $getNtsStaff['data'];
        return $query;



    }
    public function GetHonoraryStaff($Inst_id)
    {



        $apiService = app(ApiService::class);
        $GetHonoraryStaff = $apiService->GetHonoraryStaff($Inst_id);
        $query = $GetHonoraryStaff['data'];
        return $query;

    }


    public function ContractStaff($Inst_id)
    {

        $apiService = app(ApiService::class);
        $ContractStaff = $apiService->ContractStaff($Inst_id);
        $query = $ContractStaff['data'];
        return $query;



    }

    public function InterneeStaff($Inst_id)
    {

        $apiService = app(ApiService::class);
        $InterneeStaff = $apiService->InterneeStaff($Inst_id);
        $query = $InterneeStaff['data'];
        return $query;




    }
    public function getStudents($GetInstitutionID)
    {
        return student::Verified_Status()
            ->current_status()
            ->InSchool($GetInstitutionID)
            ->count();
    }
}
