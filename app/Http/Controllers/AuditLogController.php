<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\AuditLog::with('user')
            ->orderByDesc('changed_at');

        if ($request->filled('table')) {
            $query->where('table_name', $request->table);
        }

        if ($request->filled('record_id')) {
            $query->where('record_id', $request->record_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('changed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('changed_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(20)
            ->withQueryString();

        $tables = \App\Models\AuditLog::distinct()
            ->pluck('table_name')
            ->sort()
            ->values();

        // Collect IDs for lookup
        $userIds = collect();
        $fundHeadIds = collect();
        $instituteIds = collect();
        $assetIds = collect();
        $roomIds = collect();

        foreach ($logs->items() as $log) {
            // Check old values
            if ($log->old_values) {
                if (isset($log->old_values['fund_head_id'])) $fundHeadIds->push($log->old_values['fund_head_id']);
                if (isset($log->old_values['institute_id'])) $instituteIds->push($log->old_values['institute_id']);
                if (isset($log->old_values['asset_id'])) $assetIds->push($log->old_values['asset_id']);
                if (isset($log->old_values['room_id'])) $roomIds->push($log->old_values['room_id']);
                
                if (isset($log->old_values['changed_by'])) $userIds->push($log->old_values['changed_by']);
                if (isset($log->old_values['added_by'])) $userIds->push($log->old_values['added_by']);
                if (isset($log->old_values['approver_id'])) $userIds->push($log->old_values['approver_id']);
                if (isset($log->old_values['user_id'])) $userIds->push($log->old_values['user_id']);
            }
            // Check new values
            if ($log->new_values) {
                if (isset($log->new_values['fund_head_id'])) $fundHeadIds->push($log->new_values['fund_head_id']);
                if (isset($log->new_values['institute_id'])) $instituteIds->push($log->new_values['institute_id']);
                if (isset($log->new_values['asset_id'])) $assetIds->push($log->new_values['asset_id']);
                if (isset($log->new_values['room_id'])) $roomIds->push($log->new_values['room_id']);

                if (isset($log->new_values['changed_by'])) $userIds->push($log->new_values['changed_by']);
                if (isset($log->new_values['added_by'])) $userIds->push($log->new_values['added_by']);
                if (isset($log->new_values['approver_id'])) $userIds->push($log->new_values['approver_id']);
                if (isset($log->new_values['user_id'])) $userIds->push($log->new_values['user_id']);
            }
            // Check changed_by column
            if ($log->changed_by) $userIds->push($log->changed_by);
        }

        $usersLookup = \App\Models\User::whereIn('id', $userIds->unique()->filter())->pluck('name', 'id');
        $fundHeadsLookup = \App\Models\FundHead::whereIn('id', $fundHeadIds->unique()->filter())->pluck('name', 'id');
        $institutesLookup = \App\Models\Institute::whereIn('id', $instituteIds->unique()->filter())->pluck('name', 'id');
        $assetsLookup = \App\Models\Asset::whereIn('id', $assetIds->unique()->filter())->pluck('name', 'id');
        $roomsLookup = \App\Models\Room::whereIn('id', $roomIds->unique()->filter())->pluck('room_number', 'id');

        return Inertia::render('auditlogs/Index', [
            'logs' => $logs,
            'tables' => $tables,
            'filters' => $request->only(['table', 'record_id', 'date_from', 'date_to']),
            'users_lookup' => $usersLookup,
            'fund_heads_lookup' => $fundHeadsLookup,
            'institutes_lookup' => $institutesLookup,
            'assets_lookup' => $assetsLookup,
            'rooms_lookup' => $roomsLookup,
        ]);
    }
}
