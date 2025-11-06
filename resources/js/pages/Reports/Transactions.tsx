import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { DollarSign, FileText, User, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import type { DebouncedFunc } from 'lodash';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/utils/dateFormatter';
import Combobox from '@/components/ui/combobox';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Transactions', href: '/reports/transactions' },
];

interface TransactionProp {
  id: number;
  total_amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'approved' | 'rejected';
  bill_img?: string;
  created_at: string;
  institute?: { id: number; name?: string };
  added_by?: { id: number; name?: string };
  approved_by?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
}

interface Props {
  transactions: {
    data: TransactionProp[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  institutes: Item[];
  regions: Item[];
  users: Item[];
  filters: {
    search: string;
    institute_id?: string;
    region_id?: string;
    added_by?: string;
    approved_by?: string;
    type?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  };
  user_type?: string; // 'Regional Office', 'Super Admin', etc.
}

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
    toast.error('An error occurred. Please try again.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <p className="text-red-600">Error: {this.state.error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">Retry</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const isValidItem = (item: any): item is Item => {
  return item != null && typeof item.id === 'number' && item.id > 0 && typeof item.name === 'string' && item.name.trim() !== '';
};

export default function Transaction({
  transactions: initialTransactions,
  institutes: initialInstitutes,
  regions,
  users,
  filters,
  user_type,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [addedBy, setAddedBy] = useState(filters.added_by || '');
  const [approvedBy, setApprovedBy] = useState(filters.approved_by || '');
  const [type, setType] = useState(filters.type || '');
  const [status, setStatus] = useState(filters.status || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(initialInstitutes || []);

  // Memoized options
  const memoizedInstitutes = useMemo(() => filteredInstitutes.filter(isValidItem), [filteredInstitutes]);
  const memoizedRegions = useMemo(() => regions.filter(isValidItem), [regions]);
  const memoizedUsers = useMemo(() => users.filter(isValidItem), [users]);

  // Fetch institutes by region (only for Super Admin)
  const fetchInstitutes = async (regionId: string) => {
    if (!regionId || regionId === '0') {
      setFilteredInstitutes(initialInstitutes || []);
      if (institute) setInstitute('');
      return;
    }

    try {
      const params = new URLSearchParams({ region_id: regionId }).toString();
      const response = await fetch(`/reports/transactions/getinstitutes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch institutes');
      const data = await response.json();
      setFilteredInstitutes(data);
      if (institute && !data.some((i: Item) => i.id.toString() === institute)) {
        setInstitute('');
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to load institutes');
      setFilteredInstitutes([]);
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
    fetchInstitutes(value);
  
  };

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Institute', key: 'institute', width: 30 },
      { header: 'Added By', key: 'added_by', width: 25 },
      { header: 'Approved By', key: 'approved_by', width: 25 },
      { header: 'Date', key: 'date', width: 18 },
    ];

    transactions.data.forEach((t) => {
      worksheet.addRow({
        id: t.id,
        amount: `$${parseFloat(t.total_amount.toString()).toFixed(2)}`,
        type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
        status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
        institute: t.institute?.name || 'N/A',
        added_by: t.added_by?.name || 'N/A',
        approved_by: t.approved_by?.name || 'N/A',
        date: formatDate(t.created_at),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, 'Transactions_Report.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Transactions Report', 14, 15);

    const headers = ['ID', 'Amount', 'Type', 'Status', 'Institute', 'Added By', 'Approved By', 'Date'];
    const rows = transactions.data.map((t) => [
      t.id.toString(),
      `$${parseFloat(t.total_amount.toString()).toFixed(2)}`,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.status.charAt(0).toUpperCase() + t.status.slice(1),
      t.institute?.name || 'N/A',
      t.added_by?.name || 'N/A',
      t.approved_by?.name || 'N/A',
      formatDate(t.created_at),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [46, 124, 196], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save('Transactions_Report.pdf');
  };
// Debounced filter apply
// Debounced filter apply – **FIXED**
const debouncedApplyFilters = useMemo(
  () =>
    debounce(() => {
      const params = new URLSearchParams({
        search: search.trim(),
        institute_id: institute || '',
        region_id: region || '',
        added_by: addedBy || '',
        approved_by: approvedBy || '',
        type: type || '',
        status: status || '',
        date_from: dateFrom || '',
        date_to: dateTo || '',
      });

      fetch(`/reports/transactions/gettransactions?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then((data) => {
          console.log('Filtered transactions:', data);
          setTransactions(data);
        })
        .catch((err) => {
          console.error('Fetch error:', err);
          toast.error('Failed to load transactions');
        });
    }, 400) as DebouncedFunc<() => void>, // <-- Use lodash DebouncedFunc so .cancel() exists
  [search, institute, region, addedBy, approvedBy, type, status, dateFrom, dateTo]
);


  // Trigger filter on change
 useEffect(() => {
  debouncedApplyFilters();
  return () => {
    debouncedApplyFilters.cancel();
  };
}, [debouncedApplyFilters]);
  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Transactions Report" />
        <div className="flex-1 p-1 md:p-1">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left: Filters */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Filters
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">Refine transaction search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <Input
                    placeholder="Search by ID, amount, type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {/* Region (Super Admin only) */}
                  {user_type !== 'Regional Office' && memoizedRegions.length > 0 && (
                    <Select value={region} onValueChange={handleRegionChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All Regions</SelectItem>
                        {memoizedRegions.map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Institute */}
                  <Combobox
                    entity="institute"
                    value={institute}
                    onChange={setInstitute}
                    options={memoizedInstitutes.map((i) => ({ id: i.id.toString(), name: i.name }))}
                    includeAllOption={true}
                    allOptionLabel="All Institutes"
                    placeholder="Select Institute"
                  />

                  {/* Added By */}
                  <Combobox
                    entity="user"
                    value={addedBy}
                    onChange={setAddedBy}
                    options={memoizedUsers.map((u) => ({ id: u.id.toString(), name: u.name }))}
                    includeAllOption={true}
                    allOptionLabel="All Users"
                    placeholder="Added By"
                  />

                  {/* Approved By */}
                  <Combobox
                    entity="user"
                    value={approvedBy}
                    onChange={setApprovedBy}
                    options={memoizedUsers.map((u) => ({ id: u.id.toString(), name: u.name }))}
                    includeAllOption={true}
                    allOptionLabel="All Users"
                    placeholder="Approved By"
                  />

                  {/* Type */}
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="condemned">Condemned</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status */}
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Range */}
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  <Button onClick={debouncedApplyFilters} className="w-full">
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Transactions List */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <FileText className="w-6 h-6" />
                      Transactions Report
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportToPDF} className="w-full md:w-auto">
                      Export PDF
                    </Button>
                    <Button onClick={exportToExcel} className="w-full md:w-auto">
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-white text-center">
                          <th className="border p-2 font-medium">ID</th>
                          <th className="border p-2 font-medium">Amount</th>
                          <th className="border p-2 font-medium">Type</th>
                          <th className="border p-2 font-medium">Status</th>
                          <th className="border p-2 font-medium">Institute</th>
                          <th className="border p-2 font-medium">Added By</th>
                          <th className="border p-2 font-medium">Approved By</th>
                          <th className="border p-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.data.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center p-4 text-muted-foreground">
                              No transactions found.
                            </td>
                          </tr>
                        ) : (
                          transactions.data.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                              <td className="border p-2">#{tx.id}</td>
                              <td className="border p-2 font-medium">
                                {parseFloat(tx.total_amount.toString()).toFixed(2)}
                              </td>
                              <td className="border p-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    tx.type === 'income'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                </span>
                              </td>
                              <td className="border p-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium flex items-center justify-center gap-1 ${
                                    tx.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : tx.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {tx.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                  {tx.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                </span>
                              </td>
                              <td className="border p-2">{tx.institute?.name || 'N/A'}</td>
                              <td className="border p-2">{tx.added_by?.name || 'N/A'}</td>
                              <td className="border p-2">{tx.approved_by?.name || 'N/A'}</td>
                              <td className="border p-2 text-xs">
                                {formatDate(tx.created_at)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {transactions.links.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
                      {transactions.links.map((link, i) => (
                        <Button
                          key={i}
                          disabled={!link.url}
                          variant={link.active ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                        >
                          <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}