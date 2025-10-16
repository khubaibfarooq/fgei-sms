<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ApiService
{
    protected $baseUrl;
    protected $token;

    public function __construct()
    {

        $this->token = config('services.hrms_api.token');
        $this->baseUrl = config('services.hrms_api.url');

    }

    //  Use in SMS
    public function getRegions()
    {
        $cacheKey = 'api_regions';

        return Cache::remember($cacheKey, now()->addMonth(), function () {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/regions');

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch regions from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }


    //  Use in SMS

    public function GetLevel($institution_id)
    {
        $cacheKey = 'level' . $institution_id;
        return Cache::remember($cacheKey, now()->addHours(2), function () use ($institution_id) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Get-Level', [
                    'institution_id' => $institution_id,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch level from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }




    //  Use in SMS
    public function GetInstitutionByRegion($RegionId)
    {


        $cacheKey = 'api_Employee_Count_' . $RegionId;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetInstitutionByRegion', [
                'RegionIds' => $RegionId,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
    //  Use in SMS
    public function GetInstitutionDetail($institution_id)
    {
        $cacheKey = 'GetInstitutionDetail' . $institution_id;
        return Cache::remember($cacheKey, now()->addHours(2), function () use ($institution_id) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Institution-Detail', [
                    'institution_id' => $institution_id,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch Institution Detail from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }

//SMS


    public function GetSections($Inst_id, $class_id)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetSections', [
                'Inst_id' => $Inst_id,
                'class_id' => $class_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Get Sections from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }

    }

    //  Use in SMS

    public function getTeachingStaff($Inst_id)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/getTeachingStaff', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }

    }


    public function GetmainIcp($teacherId)
    {


        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetmainIcp', [
                'officer_id' => $teacherId,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to Fetch Get Main Icp from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    //  Use in SMS

    public function getNtsStaff($Inst_id)
    {


        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/getNtsStaff', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Nts Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }

    }
    //  Use in SMS

    public function GetHonoraryStaff($Inst_id)
    {



        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetHonoraryStaff', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Get Honorary Staff Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }

    }
    //  Use in SMS
    public function ContractStaff($Inst_id)
    {



        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/ContractStaff', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Get Contract Staff Staff Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }

    }

    //  Use in SMS

    public function InterneeStaff($Inst_id)
    {



        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/InterneeStaff', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Get Internee Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }

    }

    // SMS Total Count Of Teacher
    public function getTeachingStaffCount($Inst_id = null, $region_id = null)
    {

        try {
            $headers = ['Authorization' => 'Bearer ' . $this->token];
            $params = [];
            if ($Inst_id !== null) {
                $params['Inst_id'] = $Inst_id;
            }
            if ($region_id !== null) {
                $params['region_id'] = $region_id;
            }
            $response = Http::withHeaders($headers)->get(
                $this->baseUrl . '/api/getTeachingStaffCount',
                $params
            );
            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
    public function getCountNTSStaff($Inst_id = null, $region_id = null)
    {
        try {
            $headers = ['Authorization' => 'Bearer ' . $this->token];
            $params = [];
            if ($Inst_id !== null) {
                $params['Inst_id'] = $Inst_id;
            }
            if ($region_id !== null) {
                $params['region_id'] = $region_id;
            }
            $response = Http::withHeaders($headers)->get(
                $this->baseUrl . '/api/GetCountNTSStaff',
                $params
            );
            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee Non Teaching Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
    public function CountgetHonoraryStaff($Inst_id = null, $region_id = null)
    {
        try {
            $headers = ['Authorization' => 'Bearer ' . $this->token];
            $params = [];
            if ($Inst_id !== null) {
                $params['Inst_id'] = $Inst_id;
            }
            if ($region_id !== null) {
                $params['region_id'] = $region_id;
            }
            $response = Http::withHeaders($headers)->get(
                $this->baseUrl . '/api/CountgetHonoraryStaff',
                $params
            );
            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee Honorary Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    public function CountgetContracttaff($Inst_id = null, $region_id = null)
    {

        try {
            $headers = ['Authorization' => 'Bearer ' . $this->token];
            $params = [];
            if ($Inst_id !== null) {
                $params['Inst_id'] = $Inst_id;
            }
            if ($region_id !== null) {
                $params['region_id'] = $region_id;
            }
            $response = Http::withHeaders($headers)->get(
                $this->baseUrl . '/api/CountgetContracttaff',
                $params
            );
            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee Contract Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
    public function CountgetInterneeStaff($Inst_id = null, $region_id = null)
    {
        try {
            $headers = ['Authorization' => 'Bearer ' . $this->token];
            $params = [];
            if ($Inst_id !== null) {
                $params['Inst_id'] = $Inst_id;
            }
            if ($region_id !== null) {
                $params['region_id'] = $region_id;
            }
            $response = Http::withHeaders($headers)->get(
                $this->baseUrl . '/api/CountgetInterneeStaff',
                $params
            );
            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Employee Contract Staff from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    public function getInstitution()
    {
        $cacheKey = 'api_Institution';
        return Cache::remember($cacheKey, now()->addMinutes(30), function () {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Instituions');

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch Instituions from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }
    // ///////////////////////////////////////////////////////////// End Use in SMS



    public function GetEmployee()
    {
        $cacheKey = 'api_Employee';
        return Cache::remember($cacheKey, now()->addMinutes(5), function () {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Employee');

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }

    public function GetEmployeecountInst($institution_id)
    {



        $cacheKey = 'api_Employee_Count_' . $institution_id;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($institution_id) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Employee-Count-Instituion', [
                    'institution_id' => $institution_id,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }
    // public function GetEmployeeListsInst($instID)
    // {
    //     $cacheKey = 'api_Employee_list_' . $instID;
    //     return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($instID) {
    //         try {
    //             $response = Http::withHeaders([
    //                 'Authorization' => 'Bearer ' . $this->token,
    //             ])->get($this->baseUrl . '/api/Employee-List-Instituion', [
    //                 'institution_id' => $instID,
    //             ]);

    //             if ($response->successful()) {
    //                 return $response->json();
    //             } else {
    //                 throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
    //             }
    //         } catch (Exception $e) {
    //             throw new Exception('An error occurred: ' . $e->getMessage());
    //         }
    //     });
    // }
  public function GetEmployeeListsInst($instID)
    {

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get($this->baseUrl . '/api/Employee-List-Instituion', [
            'institution_id' => $instID,
        ]);

        if ($response->successful()) {
            return $response->json();
        } else {
            throw new Exception('Failed to fetch Employee from the API: ' . $response->status());
        }
    }
    public function GetGender($institution_id)
    {
        $cacheKey = 'Gender' . $institution_id;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($institution_id) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Get-Gender', [
                    'institution_id' => $institution_id,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch Gender from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }

    public function GetRegionDetail($institution_id)
    {
        $cacheKey = 'Region_detail' . $institution_id;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($institution_id) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/Get-Region-detail', [
                    'institution_id' => $institution_id,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to fetch Region from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }


    public function FetchPrinciapl($institution_id)
    {
        $cacheKey = 'FetchPrinciapl' . $institution_id;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($institution_id) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/FetchPrinciapl', [
                    'institution_id' => $institution_id,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to Fetch Princiapl from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }

    public function ClassIncharge($teacherId)
    {
        $cacheKey = 'ClassIncharge' . $teacherId;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($teacherId) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/ClassIncharge', [
                    'teacherId' => $teacherId,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to Fetch Class Incharge from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }
    public function FetchIntIdClassIncharge($EmployeeId)
    {
        $cacheKey = 'FetchIntIdClassIncharge' . $EmployeeId;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($EmployeeId) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/FetchInstIdClassIncharge', [
                    'EmployeeId' => $EmployeeId,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to Fetch Class Incharge by Institution Id from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }
    public function FetchIntNameClassIncharge($EmployeeId)
    {
        $cacheKey = 'FetchIntNameClassIncharge' . $EmployeeId;
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($EmployeeId) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->baseUrl . '/api/FetchIntNameClassIncharge', [
                    'EmployeeId' => $EmployeeId,
                ]);

                if ($response->successful()) {
                    return $response->json();
                } else {
                    throw new Exception('Failed to Fetch Class Incharge by Institution name from the API: ' . $response->status());
                }
            } catch (Exception $e) {
                throw new Exception('An error occurred: ' . $e->getMessage());
            }
        });
    }
    public function GetHrmsToken($Hrmstoken)
    {


        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetSMSHrmsToken', [
                'Hrmstoken' => $Hrmstoken,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to Fetch Hrms Token from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
}
