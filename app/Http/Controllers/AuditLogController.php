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

        return Inertia::render('auditlogs/Index', [
            'logs' => $logs,
            'tables' => $tables,
            'filters' => $request->only(['table', 'record_id', 'date_from', 'date_to']),
        ]);
    }
}
