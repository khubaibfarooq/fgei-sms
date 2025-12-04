import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import axios from 'axios';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface FundTransaction {
  id: number;
  amount: number;
  type: 'in' | 'out';
  description: string;
  date: string;
  status: string;
  added_date: string;
  created_at: string;
  updated_at: string;
  added_by: number;
  tid?: number | null;
  user: {
    id: number;
    name: string;
  };
}

interface TransactionDetail {
  id: number;
  fund_head_id: number;
  tid: number;
  asset_id: number;
  room_id: number;
  amount: string;
  qty: number;
  created_at: string;
  updated_at: string;
  fund_head_name: string;
  asset_name: string;
  room_name: string;
}

interface FundHeld {
  id: number;
  balance: number;
  fund_head_id: number;
  institute_id: number;
  institute: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  fund_head: {
    id: number;
    name: string;
    code?: string;
    description?: string;
  };
  added_by: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  fundheld: FundHeld;
  fundtrans: {
    data: FundTransaction[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
  };
  filters: {
    search: string;
    from?: string;
    to?: string;
    fund_head_id?: string;
    institute_id?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Funds', href: '/reports/funds' },
  { title: 'Fund Transactions', href: '#' },
];

export default function FundsTran({ fundheld, fundtrans, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [fromDate, setFromDate] = useState(filters.from || '');
  const [toDate, setToDate] = useState(filters.to || '');
  console.log(fundtrans);
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FundTransaction | null>(null);
  const [txDetails, setTxDetails] = useState<TransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Apply filters
  const applyFilters = () => {
    router.get(
      window.location.pathname,
      {
        search,
        from: fromDate || undefined,
        to: toDate || undefined,
        fund_head_id: filters.fund_head_id || undefined,
        institute_id: filters.institute_id || undefined,
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyFilters();
  };

  // Totals
  const calculateTotalIn = () =>
    fundtrans.data
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const calculateTotalOut = () =>
    fundtrans.data
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + Number(t.amount), 0);

  // Badges
  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { variant: any; icon: any }> = {
      Approved: { variant: 'default', icon: CheckCircle },
      Pending: { variant: 'secondary', icon: FileText },
      Rejected: { variant: 'destructive', icon: XCircle },
    };
    const c = cfg[status] || cfg.Pending;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: 'in' | 'out') =>
    type === 'in' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
        IN
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
        OUT
      </Badge>
    );

  // Open modal and fetch detail by tid
  const openDetailModal = async (tx: FundTransaction) => {
    if (!tx.tid) return;

    setSelectedTx(tx);
    setModalOpen(true);
    setLoadingDetail(true);

    try {
      const { data } = await axios.get(`/transactions/getbytid?tid=${tx.tid}`);
      console.log('API Response:', data); // You’ll see the array here
      setTxDetails(data.transdetails?.[0] || null); // Extract first item
    } catch (err) {
      console.error('Failed to load transaction details:', err);
      setTxDetails(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Fund Transactions - ${fundheld.fund_head.name}`} />

      <div className="flex-1 p-2 md:p-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/funds">
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {fundheld.fund_head.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{fundheld.institute.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {fundheld.balance.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-3 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total In</p>
                      <p className="text-2xl font-bold text-green-600">
                        {calculateTotalIn().toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">IN</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Out</p>
                      <p className="text-2xl font-bold text-red-600">
                        {calculateTotalOut().toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">OUT</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold text-blue-600">{fundtrans.total}</p>
                    </div>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Search</label>
                <Input
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKey}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <Button onClick={applyFilters} className="w-full md:w-auto">
                Fetch
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {fundtrans.from} to {fundtrans.to} of {fundtrans.total} transactions
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary dark:bg-gray-800">
                    <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Date</th>
                    <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Description</th>
                    <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Type</th>
                    <th className="border p-3 text-right text-sm font-medium text-white dark:text-gray-200">Amount</th>
                    <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Status</th>
                    <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundtrans.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">No transactions found.</p>
                      </td>
                    </tr>
                  ) : (
                    fundtrans.data.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(transaction.added_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="border p-3 text-sm">{transaction.description}</td>
                        <td className="border p-3 text-center">{getTypeBadge(transaction.type)}</td>
                        <td className="border p-3 text-right text-sm font-medium">
                          <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'in' ? '+' : '-'}
                            {transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="border p-3 text-center">{getStatusBadge(transaction.status)}</td>
                        <td className="border p-3 text-center">
                          {transaction.tid ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetailModal(transaction)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {fundtrans.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {fundtrans.links.map((link, i) => (
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

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTx && `Fund Transaction ID: ${selectedTx.id} | TID: ${selectedTx.tid}`}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : txDetails ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Fund Head:</strong> {txDetails.fund_head_name}</div>
                <div><strong>Asset:</strong> {txDetails.asset_name}</div>
                <div><strong>Room:</strong> {txDetails.room_name}</div>
                <div><strong>Quantity:</strong> {txDetails.qty}</div>
                <div><strong>Amount:</strong> <span className="text-green-600">+{txDetails.amount}</span></div>
                <div><strong>Date:</strong> {format(new Date(txDetails.created_at), 'dd MMM yyyy HH:mm')}</div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="h-3 w-3" />
                <span>Transaction ID: <code>{txDetails.id}</code> | TID: <code>{txDetails.tid}</code></span>
              </div>

              {selectedTx?.user && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Added by <strong>{selectedTx.user.name}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No details available.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}