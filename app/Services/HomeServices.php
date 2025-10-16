<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\student;

class HomeServices
{
    /**
     * Fetch a list of home services.
     *
     * @return array
     */
    public function CountTeachingStaff($GetInstitutionID = null, $GetRegionID = null)
    {


        $apiService = app(ApiService::class);
        $getTeachingStaff = $apiService->getTeachingStaffCount($GetInstitutionID, $GetRegionID);
        
        return $getTeachingStaff['data'] ?? 0;
    }

    public function CountNTSStaff($GetInstitutionID = null, $GetRegionID = null)
    {
        $apiService = app(ApiService::class);
        $getCountNTSStaff = $apiService->getCountNTSStaff($GetInstitutionID, $GetRegionID);
        return $getCountNTSStaff['data'] ?? 0;
    }

    public function CountgetHonoraryStaff($GetInstitutionID = null, $GetRegionID = null)
    {
        $apiService = app(ApiService::class);
        $CountgetHonoraryStaff = $apiService->CountgetHonoraryStaff($GetInstitutionID, $GetRegionID);
        return $CountgetHonoraryStaff['data'] ?? 0;
    }

    public function CountgetContracttaff($GetInstitutionID = null, $GetRegionID = null)
    {
        $apiService = app(ApiService::class);
        $CountgetContracttaff = $apiService->CountgetContracttaff($GetInstitutionID, $GetRegionID);
        return $CountgetContracttaff['data'] ?? 0;
    }


    public function getTVFStaff($GetInstitutionID = null)
    {
        $usercurrentroles = auth()->user()->getRoleNames()->implode(', ');
        $query = Employee::onService()
            ->permanent();
        if ($usercurrentroles == 'Institution') {
            $query->inDepartment($GetInstitutionID);
        }
        return $query->count();
    }

    public function CountgetInterneeStaff($GetInstitutionID = null, $GetRegionID = null)
    {
        $apiService = app(ApiService::class);
        $CountgetInterneeStaff = $apiService->CountgetInterneeStaff($GetInstitutionID, $GetRegionID);
        return $CountgetInterneeStaff['data'] ?? 0;
    }

    public function CountgetStudents($GetInstitutionID = null, $GetRegionID = null)
    {

        $SisApiservices = app(SisApiservices::class);
        $CountgetStudents = $SisApiservices->CountgetStudents($GetInstitutionID, $GetRegionID);
        return $CountgetStudents['data'] ?? 0;
    }





}
