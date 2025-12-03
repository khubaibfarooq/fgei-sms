import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type BreadcrumbItem } from '@/types';
import { DollarSign, FileText, User, CheckCircle, XCircle, Calendar, Eye, Download, Loader2, X } from 'lucide-react';
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
  { title: 'Transactions', href: '/transactions' },
  { title: 'Transactions', href: '/transactions' },
];

interface TransactionProp {
  id: number;
  total_amount: number;
  type?: { id: number; name?: string };
  sub_type?: { id: number; name?: string };
  description?: string;
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

  filters: {
    search: string;


    type?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  };
  user_type?: string;
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



export default function Transaction({
  transactions: initialTransactions,

  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const [type, setType] = useState(filters.type || '');
  const [status, setStatus] = useState(filters.status || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [transactions, setTransactions] = useState(initialTransactions);


  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionProp | null>(null);
  const [txDetails, setTxDetails] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);


  // Memoized options





  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Sub Type', key: 'sub_type', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Institute', key: 'institute', width: 30 },
      { header: 'Added By', key: 'added_by', width: 25 },
      { header: 'Approved By', key: 'approved_by', width: 25 },
      { header: 'Date', key: 'date', width: 18 },
    ];

    transactions.data.forEach((t) => {
      worksheet.addRow({
        id: t.id,
        amount: `${parseFloat(t.total_amount.toString()).toFixed(2)}`,
        type: t.type?.name ? t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1) : 'N/A',
        sub_type: t.sub_type?.name ? t.sub_type.name.charAt(0).toUpperCase() + t.sub_type.name.slice(1) : 'N/A',
        description: t.description || 'N/A',
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

    const headers = ['ID', 'Amount', 'Type', 'Sub Type', 'Description', 'Status', 'Institute', 'Added By', 'Approved By', 'Date'];
    const rows = transactions.data.map((t) => [
      t.id.toString(),
      `${parseFloat(t.total_amount.toString()).toFixed(2)}`,
      t.type?.name ? t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1) : 'N/A',
      t.sub_type?.name ? t.sub_type.name.charAt(0).toUpperCase() + t.sub_type.name.slice(1) : 'N/A',
      t.description || 'N/A',
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
  const debouncedApplyFilters = useMemo(
    () =>
      debounce(() => {
        const params = new URLSearchParams({
          search: search.trim(),

          type: type || '',
          status: status || '',
          date_from: dateFrom || '',
          date_to: dateTo || '',
        });

        fetch(`/transactions/gettransactions?${params.toString()}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
          }
        })
          .then((res) => {
            if (!res.ok) throw new Error('Network error');
            return res.json();
          })
          .then((data) => {
            setTransactions(data);
          })
          .catch((err) => {
            console.error('Fetch error:', err);
            toast.error('Failed to load transactions');
          });
      }, 400) as DebouncedFunc<() => void>,
    [search, , type, status, dateFrom, dateTo]
  );



  // Fetch transaction details for modal
  const fetchTransactionDetails = async (tid: number) => {
    setModalLoading(true);
    try {
      const res = await fetch(`/transactions/getbytid?tid=${tid}`);
      if (!res.ok) throw new Error('Failed to load details');
      const { transaction, transdetails } = await res.json();

      setSelectedTx(transaction);
      console.log('Transaction Details:', transdetails);
      setTxDetails(transdetails);
      setModalOpen(true);
    } catch (err) {
      toast.error('Could not load transaction details');
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Generate PDF for download
  const downloadPdf = (tx: TransactionProp, details: any[]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Transaction #${tx.id}`, 14, 15);

    const basicRows = [
      ['Institute', tx.institute?.name || 'N/A'],

      ['Amount', `RS ${parseFloat(tx.total_amount.toString()).toFixed(2)}`],
      ['Type', tx.type?.name ? tx.type.name.charAt(0).toUpperCase() + tx.type.name.slice(1) : 'N/A'],
      ['Sub Type', tx.sub_type?.name ? tx.sub_type.name.charAt(0).toUpperCase() + tx.sub_type.name.slice(1) : 'N/A'],
      ['Description', tx.description || 'N/A'],
      ['Status', tx.status.charAt(0).toUpperCase() + tx.status.slice(1)],
      ['Added By', tx.added_by?.name || 'N/A'],
      ['Approved By', tx.approved_by?.name || 'N/A'],
      ['Date', formatDate(tx.created_at)],
    ];

    autoTable(doc, {
      head: [['Field', 'Value']],
      body: basicRows,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [46, 124, 196] },
    });

    if (details.length) {
      const detailRows = details.map(d => [
        d.asset?.name || '-',
        d.room?.name || '-',
        d.fund_head?.name || '-',
        d.qty ?? '-',
        `RS ${parseFloat(d.amount?.toString() ?? '0').toFixed(2)}`,
      ]);

      autoTable(doc, {
        head: [['Asset', 'Room', 'Fund Head', 'Qty', 'Amount']],
        body: detailRows,
        startY: (doc as any).lastAutoTable.finalY + 10,
        styles: { fontSize: 9 },
      });
    }

    doc.save(`Transaction_#${tx.id}.pdf`);
  };

  // Cleanup modal on unmount
  useEffect(() => {
    return () => {
      setModalOpen(false);
      setSelectedTx(null);
      setTxDetails([]);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Transactions Report" />
        <div className="flex-1 p-1 md:p-1">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left: Filters */}
            <div className="w-full md:w-1/4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Filters
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">Refine transaction search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Search by ID, amount, type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />





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
            <div className="w-full md:w-full">
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
                          <th className="border p-2 font-medium">Sub Type</th>
                          <th className="border p-2 font-medium">Status</th>
                          <th className="border p-2 font-medium">Added By</th>
                          <th className="border p-2 font-medium">Approved By</th>
                          <th className="border p-2 font-medium">Date</th>
                          <th className="border p-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.data.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center p-4 text-muted-foreground">
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
                                  className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {tx.type?.name ? tx.type.name.charAt(0).toUpperCase() + tx.type.name.slice(1) : 'N/A'}
                                </span>
                              </td>
                              <td className="border p-2">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                                >
                                  {tx.sub_type?.name ? tx.sub_type.name.charAt(0).toUpperCase() + tx.sub_type.name.slice(1) : 'N/A'}
                                </span>
                              </td>
                              <td className="border p-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium flex items-center justify-center gap-1 ${tx.status === 'approved'
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
                              <td className="border p-2">{tx.added_by?.name || 'N/A'}</td>
                              <td className="border p-2">{tx.approved_by?.name || 'N/A'}</td>
                              <td className="border p-2 text-xs">
                                {formatDate(tx.created_at)}
                              </td>
                              <td className="border p-2">
                                <div className="flex items-center justify-center gap-2">
                                  {/* View Icon */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => fetchTransactionDetails(tx.id)}
                                    disabled={modalLoading}
                                    title="View details"
                                  >
                                    {modalLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>

                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Details Modal */}
                  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Transaction #{selectedTx?.id}
                        </DialogTitle>


                      </DialogHeader>

                      {selectedTx && (
                        <div className="mt-4 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Amount:</span> RS {parseFloat(selectedTx.total_amount.toString()).toFixed(2)}</div>
                            <div><span className="font-medium">Type:</span> {selectedTx.type?.name ? selectedTx.type.name.charAt(0).toUpperCase() + selectedTx.type.name.slice(1) : 'N/A'}</div>
                            <div><span className="font-medium">Sub Type:</span> {selectedTx.sub_type?.name ? selectedTx.sub_type.name.charAt(0).toUpperCase() + selectedTx.sub_type.name.slice(1) : 'N/A'}</div>
                            <div><span className="font-medium">Status:</span> {selectedTx.status.charAt(0).toUpperCase() + selectedTx.status.slice(1)}</div>
                            <div><span className="font-medium">Institute:</span> {selectedTx.institute?.name || 'N/A'}</div>
                            <div><span className="font-medium">Added By:</span> {selectedTx.added_by?.name || 'N/A'}</div>
                            <div><span className="font-medium">Approved By:</span> {selectedTx.approved_by?.name || 'N/A'}</div>
                            <div className="col-span-2"><span className="font-medium">Date:</span> {formatDate(selectedTx.created_at)}</div>
                            {selectedTx.description && (
                              <div className="col-span-2">
                                <span className="font-medium">Description:</span>
                                <p className="mt-1 text-muted-foreground">{selectedTx.description}</p>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {txDetails.length ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="border p-2 text-left">Asset</th>
                                    <th className="border p-2 text-left">Room</th>
                                    <th className="border p-2 text-left">Fund Head</th>
                                    <th className="border p-2 text-left">Qty</th>
                                    <th className="border p-2 text-left">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {txDetails.map((d, i) => (
                                    <tr key={i} className="hover:bg-muted/50">
                                      <td className="border p-2">{d.asset_name || '-'}</td>
                                      <td className="border p-2">{d.room_name || '-'}</td>
                                      <td className="border p-2">{d.fund_head_name || '-'}</td>
                                      <td className="border p-2">{d.qty ?? '-'}</td>
                                      <td className="border p-2">
                                        RS {parseFloat(d.amount?.toString() ?? '0').toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No line items.</p>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

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