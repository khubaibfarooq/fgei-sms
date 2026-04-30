<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Institute;
use App\Models\User;
use App\Models\FundHead;
use App\Models\Fund;
use App\Models\FundHeld;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ApiFundController extends Controller
{
    // Define your associative array mapping here
    // 'Incoming Name' => FundHead ID
    private $headMapping = [
        'Admission Fee' => 14,
        'SLC Fee' => 14,
        'Tuition Fee'=>14,
        'IDF'=>14,
        'Exam Fee'=>9,
        'IT Fee'=>10,
        'CSF'=>15,
        'RDF'=>12,
        'CDF'=>18,
        'Security Fund'=>11,
    ];

    private function getFundHeadId($incomingName)
    {
        if (array_key_exists($incomingName, $this->headMapping)) {
            return $this->headMapping[$incomingName];
        }
        
        // Fallback: look up by name if not in mapping
        $head = FundHead::where('name', $incomingName)->first();
        return $head ? $head->id : null;
    }

    private function validateToken(Request $request)
    {
        $token = $request->header('token');
        if (empty($token) || $token !== env('JWT_SECRET_KEY')) {
            return false;
        }
        return true;
    }

    public function storeInTransaction(Request $request)
    {
        if (!$this->validateToken($request)) {
            return response()->json(['error' => 'Unauthorized: Invalid token'], 401);
        }

        $request->validate([
            'institution_id' => 'required',
            'heads' => 'required|array|min:1',
            'heads.*.name' => 'required|string',
            'heads.*.amount' => 'required|numeric|min:0.01',
            'heads.*.description' => 'nullable|string',
        ]);

        try {
            $institutionId = $request->institution_id;
            
            $institute = Institute::where('hr_id', $institutionId)->first();
            if (!$institute) {
                return response()->json(['error' => 'Institute not found'], 404);
            }

            $user = User::where('inst_id', $institutionId)->first();
            $userId = $user ? $user->id : null;

            $date = Carbon::now()->format('Y-m-d');
            $status = 'Approved';
            $type = 'in';

            DB::transaction(function () use ($request, $institute, $userId, $date, $type, $status) {
                foreach ($request->heads as $headData) {
                    $fundHeadId = $this->getFundHeadId($headData['name']);
                    
                    if (!$fundHeadId) {
                        throw new \Exception("Fund head '{$headData['name']}' could not be mapped or found.");
                    }

                    $fundHeld = FundHeld::where('fund_head_id', $fundHeadId)
                        ->where('institute_id', $institute->id)
                        ->first();

                    if ($fundHeld) {
                        $newBalance = $fundHeld->balance + $headData['amount'];
                        $fundHeld->update(['balance' => $newBalance]);
                    } else {
                        $newBalance = $headData['amount'];
                        FundHeld::create([
                            'fund_head_id' => $fundHeadId,
                            'institute_id' => $institute->id,
                            'balance'      => $newBalance,
                            'added_by'     => $userId,
                        ]);
                    }

                    Fund::create([
                        'fund_head_id'  => $fundHeadId,
                        'institute_id'  => $institute->id,
                        'amount'        => $headData['amount'],
                        'added_by'      => $userId,
                        'added_date'    => $date,
                        'status'        => $status,
                        'type'          => $type,
                        'description'   => $headData['description']." From head:".$headData['name'] ?? null,
                        'trans_type'    => 'funds',
                        'approve_by'    => $userId,
                        'approved_date' => now(),
                        'balance'       => $newBalance,
                    ]);
                }
            });

            return response()->json(['message' => 'Fund transaction(s) processed successfully'], 200);

        } catch (\Exception $e) {
            Log::error('API storeInTransaction error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function transferToRegion(Request $request)
    {
        if (!$this->validateToken($request)) {
            return response()->json(['error' => 'Unauthorized: Invalid token'], 401);
        }

        $request->validate([
            'institution_id' => 'required',
            'heads' => 'required|array|min:1',
            'heads.*.from_head' => 'required|string',
            'heads.*.to_head' => 'required|string',
            'heads.*.amount' => 'required|numeric|min:0.01',
            'heads.*.description' => 'nullable|string',
        ]);

        try {
            $institutionId = $request->institution_id;
            
            $institute = Institute::where('hr_id', $institutionId)->first();
            if (!$institute) {
                return response()->json(['error' => 'Institute not found'], 404);
            }

            $regionalOffice = Institute::where('region_id', $institute->region_id)
                                       ->where('type', 'Regional Office')
                                       ->first();
            if (!$regionalOffice) {
                return response()->json(['error' => 'Regional Office not found for this institute'], 404);
            }

            $user = User::where('inst_id', $institutionId)->first();
            $userId = $user ? $user->id : null;
            $date = Carbon::now()->format('Y-m-d');

            DB::transaction(function () use ($request, $institute, $regionalOffice, $userId, $date) {
                foreach ($request->heads as $headData) {
                    $fromHeadId = $this->getFundHeadId($headData['from_head']);
                    if (!$fromHeadId) {
                        throw new \Exception("From Fund head '{$headData['from_head']}' could not be mapped or found.");
                    }

                    $toHeadId = $this->getFundHeadId($headData['to_head']);
                    if (!$toHeadId) {
                        throw new \Exception("To Fund head '{$headData['to_head']}' could not be mapped or found.");
                    }

                    $outBalance = $this->updateAndGetFundBalance($institute->id, $fromHeadId, -$headData['amount'], $userId);
                    $inBalance = $this->updateAndGetFundBalance($regionalOffice->id, $toHeadId, $headData['amount'], $userId);

                    // 1. OUT transaction for base institute
                    Fund::create([
                        'fund_head_id' => $fromHeadId,
                        'description'  => $headData['description'] ?? 'Transfer to Regional ' . $headData['to_head'],
                        'amount'       => $headData['amount'],
                        'type'         => 'out',
                        'added_date'   => $date,
                        'status'       => 'Approved',
                        'approved_date'=> now(),
                        'approve_by'   => $userId,
                        'added_by'     => $userId,
                        'institute_id' => $institute->id,
                        'tid'          => $regionalOffice->id,
                        'trans_type'   => 'transfer',
                        'balance'      => $outBalance,
                    ]);

                    // 2. IN transaction for regional office
                    Fund::create([
                        'fund_head_id' => $toHeadId,
                        'description'  => $headData['description'] ?? 'Transfer from ' . $headData['from_head'] . ' Inst: ' . $institute->name,
                        'amount'       => $headData['amount'],
                        'type'         => 'in',
                        'added_date'   => $date,
                        'status'       => 'Approved',
                        'approved_date'=> now(),
                        'approve_by'   => $userId,
                        'added_by'     => $userId,
                        'institute_id' => $regionalOffice->id,
                        'tid'          => $institute->id,
                        'trans_type'   => 'transfer',
                        'balance'      => $inBalance,
                    ]);
                }
            });

            return response()->json(['message' => 'Funds transferred successfully'], 200);

        } catch (\Exception $e) {
            Log::error('API transferToRegion error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function updateAndGetFundBalance($instituteId, $fundHeadId, $amountChange, $userId)
    {
        $fundHeld = FundHeld::firstWhere([
            'institute_id' => $instituteId,
            'fund_head_id' => $fundHeadId
        ]);

        if ($fundHeld) {
            $newBalance = $fundHeld->balance + $amountChange;
            $fundHeld->update(['balance' => $newBalance]);
            return $newBalance;
        } else {
            FundHeld::create([
                'institute_id' => $instituteId,
                'fund_head_id' => $fundHeadId,
                'balance'      => $amountChange,
                'added_by'     => $userId,
            ]);
            return $amountChange;
        }
    }
}
