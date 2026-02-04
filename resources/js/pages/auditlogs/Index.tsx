import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_by: number | null;
  changed_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface Props {
  logs: {
    data: AuditLog[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  tables: string[];
  filters: {
    table?: string;
    record_id?: string;
    date_from?: string;
    date_to?: string;
  };
  users_lookup: Record<number, string>;
  fund_heads_lookup: Record<number, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Audit Log',
    href: '/audit-logs',
  },
];

export default function AuditLogIndex({ logs, tables, filters, users_lookup, fund_heads_lookup }: Props) {
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  const [params, setParams] = useState({
    table: filters.table || '',
    record_id: filters.record_id || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const toggleExpand = (id: number) => {
    setExpandedLogs((prev) =>
      prev.includes(id) ? prev.filter((logId) => logId !== id) : [...prev, id]
    );
  };

  const updateParam = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    router.get('/audit-logs', params as any, { preserveState: true, preserveScroll: true });
  };

  const handleReset = () => {
    const emptyParams = { table: '', record_id: '', date_from: '', date_to: '' };
    setParams(emptyParams);
    router.get('/audit-logs', emptyParams, { preserveState: true, preserveScroll: true });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLogValue = (key: string, value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">null</span>;

    // Check if it's a User ID
    if (['changed_by', 'added_by', 'approver_id', 'user_id'].includes(key) && typeof value === 'number') {
      const name = users_lookup[value];
      return name ? <span>{value} <span className="text-blue-600 font-medium">({name})</span></span> : value;
    }

    // Check if it's a Fund Head ID
    if (key === 'fund_head_id' && typeof value === 'number') {
      const name = fund_heads_lookup[value];
      return name ? <span>{value} <span className="text-indigo-600 font-medium">({name})</span></span> : value;
    }

    // Handle timestamps
    if (['created_at', 'updated_at', 'action_date', 'deadline', 'completed_date'].includes(key) && typeof value === 'string') {
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return value;
      }
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? <span className='text-green-600'>true</span> : <span className='text-red-600'>false</span>;
    }

    // Handle JSON objects recursively or stringify
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  };

  const LogChanges = ({ values }: { values: Record<string, any> }) => (
    <div className="bg-background border rounded px-3 py-2 text-xs overflow-auto max-h-60 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      {Object.entries(values).map(([key, val]) => (
        <React.Fragment key={key}>
          <div className="font-medium text-muted-foreground">{key}:</div>
          <div className="break-all">{formatLogValue(key, val)}</div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Audit Log" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Audit Log</CardTitle>
                <p className="text-muted-foreground text-sm">
                  System-wide change history tracked by database triggers
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Table Name</Label>
                <Select
                  value={params.table}
                  onValueChange={(val) => updateParam('table', val === 'all' ? '' : val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {tables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Record ID</Label>
                <Input
                  placeholder="ID"
                  type="number"
                  className="h-8"
                  value={params.record_id}
                  onChange={(e) => updateParam('record_id', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>From Date</Label>
                <Input
                  type="date"
                  className="h-8"
                  value={params.date_from}
                  onChange={(e) => updateParam('date_from', e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>To Date</Label>
                <Input
                  type="date"
                  className="h-8"
                  value={params.date_to}
                  onChange={(e) => updateParam('date_to', e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button size="sm" className="h-8 flex-1" onClick={handleSearch}>
                  Search
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={handleReset} title="Reset Filters">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-4">
            {/* List Logs */}
            {logs.data.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit logs found matching your criteria.</p>
            ) : (
              logs.data.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-md bg-card hover:bg-muted/30 transition overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                      <div className='flex flex-col'>
                        <span className="font-semibold text-sm">
                          {log.table_name.toUpperCase()} #{log.record_id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {log.user?.name ?? 'System/Unknown'} • {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {expandedLogs.includes(log.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {expandedLogs.includes(log.id) && (
                    <div className="bg-muted/50 px-4 py-3 text-sm border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.old_values && (
                          <div>
                            <h4 className="font-semibold mb-1 text-red-600">Old Values</h4>
                            <LogChanges values={log.old_values} />
                          </div>
                        )}
                        {log.new_values && (
                          <div>
                            <h4 className="font-semibold mb-1 text-green-600">New Values</h4>
                            <LogChanges values={log.new_values} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Pagination */}
            {logs.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {logs.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => router.visit(link.url || '', { preserveScroll: true, preserveState: true, only: ['logs'] })}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
