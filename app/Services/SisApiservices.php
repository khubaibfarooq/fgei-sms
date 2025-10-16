<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\ConnectionException;
class SisApiservices
{
    protected $baseUrl;
    protected $token;

    public function __construct()
    {
         $this->token = config('services.sis_api.token');
        $this->baseUrl = config('services.sis_api.url');
    }


    public function CountgetStudents($Inst_id = null, $region_id = null)
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
                $this->baseUrl . '/api/CountgetStudents',
                $params
            );
            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Students from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    public function GetStudentbyInstitution($Inst_id)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetStudentbyInstitution', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Students by Institution from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }

    public function SectionClassMapping($Inst_id)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/SectionClassMapping', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Students by Institution from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
  public function Classes($Inst_id)
    {

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/Classes', [
                'Inst_id' => $Inst_id,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Classes by Institution from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }


    public function FetchAllStudents($ClassSecionId)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/FetchAllStudents', [
                'ClassSecionId' => $ClassSecionId,
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                throw new Exception('Failed to fetch Students by Fetch All Students from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
    public function MonthlySchoolLevelFund($institution_id)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])
                ->timeout(60)
                ->retry(3, 1000)
                ->get($this->baseUrl . '/api/MonthlySchoolLevelFund', [
                    'institution_id' => $institution_id,
                ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                Log::warning('API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'institution_id' => $institution_id,
                ]);
                throw new Exception('Failed to fetch level from the API: ' . $response->status());
            }
        } catch (ConnectionException $e) {
            Log::error('API connection error', [
                'message' => $e->getMessage(),
                'institution_id' => $institution_id,
                'url' => $this->baseUrl . '/api/MonthlySchoolLevelFund',
            ]);
            throw new Exception('API connection timed out after retries: ' . $e->getMessage());
        } catch (RequestException $e) {
            Log::error('API request error', [
                'message' => $e->getMessage(),
                'institution_id' => $institution_id,
            ]);
            throw new Exception('API request failed: ' . $e->getMessage());
        } catch (Exception $e) {
            Log::error('Unexpected error in MonthlySchoolLevelFund', [
                'message' => $e->getMessage(),
                'institution_id' => $institution_id,
            ]);
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
}
