import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import Combobox from '@/components/ui/combobox';

import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Images,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface FundTransaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface Fund {
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
  transactions?: FundTransaction[];
  created_at?: string;
  updated_at?: string;
}

interface BankStatementItem {
  id: number;
  image: string;
  uploaded_at: string;
}

interface FundHeadInfo {
  id: number;
  name: string;
  type: string;
}

interface OwnBalance {
  id: number;
  institute_id: number;
  fund_head_id: number;
  balance: number;
  fund_head: FundHeadInfo;
}

interface RegionalOffice {
  id: number;
  name: string;
}

interface Props {
  funds: {
    data: Fund[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
  permissions: {
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
  bankStatements: Record<string, BankStatementItem[]>;
  instituteId: number;
  fundHeads: FundHeadInfo[];
  regionalOffice: RegionalOffice | null;
  ownBalances: OwnBalance[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Funds', href: '/funds' },
];

const formatAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)} Mn`;
  }
  return amount.toLocaleString();
};

const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function FundIndex({ funds, filters, permissions, bankStatements, instituteId, fundHeads = [], regionalOffice = null, ownBalances = [] }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  // Transfer Modal State
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferType, setTransferType] = useState<'Own Heads' | 'Region'>('Own Heads');
  const [fromHeadId, setFromHeadId] = useState<number | ''>('');
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [transferRows, setTransferRows] = useState<{ head_id: number | ''; amount: number | '' }[]>([
    { head_id: '', amount: '' },
  ]);
  const [transferSubmit, setTransferSubmit] = useState(false);

  // Bank statements state
  const statements: BankStatementItem[] = bankStatements[instituteId] ?? [];
  const lastStatement = statements.length > 0 ? statements[0] : null;

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: number) => {
    router.delete(`/funds/${id}`, {
      onSuccess: () => toast.success('Fund deleted successfully'),
      onError: () => toast.error('Failed to delete fund'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/funds', { ...filters, search }, { preserveScroll: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(null);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    router.post(`/institutes/${instituteId}/bank-statements`, formData as any, {
      forceFormData: true,
      onSuccess: () => {
        toast.success('Bank statement uploaded');
        setUploadOpen(false);
        setSelectedFile(null);
        setPreviewSrc(null);
      },
      onError: () => toast.error('Upload failed'),
      onFinish: () => setUploading(false),
    });
  };

  const handleDeleteStatement = (statementId: number) => {
    router.delete(`/bank-statements/${statementId}`, {
      onSuccess: () => toast.success('Statement deleted'),
      onError: () => toast.error('Delete failed'),
    });
  };

  const handleAddTransferRow = () => {
    setTransferRows([...transferRows, { head_id: '', amount: '' }]);
  };

  const handleRemoveTransferRow = (index: number) => {
    if (transferRows.length > 1) {
      const rows = [...transferRows];
      rows.splice(index, 1);
      setTransferRows(rows);
    }
  };

  const handleTransferRowChange = (index: number, field: string, value: string | number) => {
    const rows = [...transferRows];
    rows[index] = { ...rows[index], [field]: value };
    setTransferRows(rows);
  };

  const getFromHeadBalance = () => {
    if (fromHeadId) {
      const held = (ownBalances || []).find(b => b.fund_head_id === Number(fromHeadId));
      return held ? Number(held.balance) : 0;
    }
    return 0;
  };

  const getTotalTransferAmount = () => {
    return transferRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  };

  const submitTransfer = () => {
    if (!fromHeadId) return toast.error(transferType === 'Region' ? 'Please select a To Head' : 'Please select a From Head');
    if (getTotalTransferAmount() <= 0) return toast.error('Enter a valid amount');

    if (transferType === 'Own Heads' && getTotalTransferAmount() > getFromHeadBalance()) {
      return toast.error('Amount exceeds available balance');
    }

    if (transferType === 'Region') {
      if (!regionalOffice) return toast.error('No regional office associated with your institute');

      // Validate each row for available balance
      for (const row of transferRows) {
        const held = (ownBalances || []).find(b => b.fund_head_id === row.head_id);
        const bal = held ? Number(held.balance) : 0;
        if (Number(row.amount) > bal) {
          return toast.error(`A transfer amount exceeds available balance for one of the From Heads.`);
        }
      }
    }

    // Validate rows
    const validRows = transferRows.every(r => r.head_id && r.amount && Number(r.amount) > 0);
    if (!validRows) return toast.error('Please fill all rows correctly');

    setTransferSubmit(true);

    // Inertia requires wrapping data in FormData if transferring a file? Actually router.post can handle it if we pass forms directly or just map elements.
    router.post('/funds/transfer', {
      transfer_type: transferType,
      from_head_id: fromHeadId,
      rows: transferRows,
      transfer_image: transferImage
    }, {
      onSuccess: () => {
        toast.success('Funds transferred');
        setTransferOpen(false);
        setTransferRows([{ head_id: '', amount: '' }]);
        setFromHeadId('');
        setTransferImage(null);
      },
      onError: (errors) => {
        toast.error('Transfer failed. Check inputs.');
        console.error(errors);
      },
      onFinish: () => setTransferSubmit(false)
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Fund Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Funds</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional funds</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Bank Statement buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1"
                title="Upload Bank Statement"
              >
                <Upload className="h-4 w-4" />
                Upload Statement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGalleryOpen(!galleryOpen)}
                className="flex items-center gap-1"
                title="View Bank Statements"
              >
                <Images className="h-4 w-4" />
                Statements
                {galleryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              {permissions.can_add &&
                <>
                  <Button className="w-full md:w-auto" onClick={() => setTransferOpen(true)}>
                    Fund Transfer
                  </Button>
                  <Link href="/funds/create" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto">
                      Fund Transaction
                    </Button>
                  </Link>
                </>
              }
            </div>
          </CardHeader>

          {/* Last statement info bar */}
          {lastStatement && (
            <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last bank statement uploaded on <strong>{formatDate(lastStatement.uploaded_at)}</strong></span>
              {/\.(jpeg|jpg|gif|png|webp|bmp|svg|jfif)$/i.test(lastStatement.image) ? (
                <img
                  src={`/${lastStatement.image}`}
                  alt="Last Statement"
                  className="h-6 w-9 object-cover rounded border cursor-pointer ml-1"
                  onClick={() => setLightboxSrc(`/${lastStatement.image}`)}
                />
              ) : (
                <a
                  href={`/${lastStatement.image}`}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center h-6 w-9 bg-muted rounded border hover:bg-muted/80 transition-colors ml-1"
                  title="Download Document"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              )}
            </div>
          )}

          {/* Collapsed gallery */}
          {galleryOpen && (
            <div className="mx-4 mb-4 border rounded-lg p-3 bg-muted/20">
              <p className="text-sm font-medium mb-2">Bank Statements ({statements.length})</p>
              {statements.length === 0 ? (
                <p className="text-xs text-muted-foreground">No statements uploaded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {statements.map((stmt) => (
                    <div key={stmt.id} className="relative group">
                      {/\.(jpeg|jpg|gif|png|webp|bmp|svg|jfif)$/i.test(stmt.image) ? (
                        <img
                          src={`/${stmt.image}`}
                          alt="Bank Statement"
                          className="h-20 w-28 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxSrc(`/${stmt.image}`)}
                          title={formatDate(stmt.uploaded_at)}
                        />
                      ) : (
                        <a
                          href={`/${stmt.image}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center justify-center h-20 w-28 bg-muted rounded border hover:bg-muted/80 transition-colors"
                          title={formatDate(stmt.uploaded_at)}
                        >
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </a>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-black/50 text-white rounded-b px-1 py-0.5 truncate">
                        {formatDate(stmt.uploaded_at)}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this statement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDeleteStatement(stmt.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search funds... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="w-full"
              />
            </div>

            <div className="space-y-3 overflow-x-auto">
              <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm min-w-[600px]">
                <thead>
                  <tr className="bg-primary dark:bg-gray-800 text-center text-sm md:text-md lg:text-lg ">
                    <th className="border p-2  font-medium text-white dark:text-gray-200">Fund Head</th>
                    <th className="border p-2  font-medium text-white dark:text-gray-200">Balance (RS)</th>
                    <th className="border p-2  font-medium text-white dark:text-gray-200">Balance (Mn)</th>
                    <th className="border p-2  font-medium text-white dark:text-gray-200">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {funds.data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border p-4 text-center">
                        <p className="text-muted-foreground">No funds found.</p>
                      </td>
                    </tr>
                  ) : (
                    funds.data.map((fund) => (
                      <tr key={fund.id} className="hover:bg-primary/10 text-sm md:text-md lg:text-lg  dark:hover:bg-gray-700 text-center">
                        <td className="border p-3 font-bold  text-gray-900 dark:text-gray-100">
                          {fund.fund_head.name}
                        </td>
                        <td className="border p-3  text-gray-900 dark:text-gray-100">
                          {fund.balance}
                        </td>
                        <td className="border p-3  text-gray-900 dark:text-gray-100">
                          {formatAmount(fund.balance)}
                        </td>
                        <td className="border p-3  text-gray-900 dark:text-gray-100">
                          <div className="flex justify-center items-center gap-1">
                            <Link href={`/fund-trans/${fund.fund_head.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Fund Transactions"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {permissions.can_edit &&
                              <Link href={`/funds/${fund.id}/edit`}>
                                <Button variant="ghost" size="icon" title="Edit Fund">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            }

                            {permissions.can_delete &&
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600" title="Delete Fund">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this fund?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Fund <strong>{fund.fund_head.name}</strong> will be permanently deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90"
                                      onClick={() => handleDelete(fund.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            }
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-primary dark:bg-gray-800 text-center text-sm md:text-md lg:text-lg ">
                    <th className="border p-2  font-medium text-white dark:text-gray-200">Total</th>
                    <th className="border p-2  font-medium text-white dark:text-gray-200">{funds.data.reduce((total, fund) => Number(total) + Number(fund.balance), 0)}</th>
                    <th className="border p-2  font-medium text-white dark:text-gray-200">{formatAmount(funds.data.reduce((total, fund) => Number(total) + Number(fund.balance), 0))}</th>
                    <th className="border p-2  font-medium text-white dark:text-gray-200"></th>
                  </tr>
                </tfoot>
              </table>
            </div>

            {funds.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {funds.links.map((link, i) => (
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

      {/* ── Upload Modal ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload Bank Statement</DialogTitle>
            <DialogDescription>Select an image of the bank statement to upload.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {previewSrc ? (
              <div className="relative">
                <img src={previewSrc} alt="Preview" className="w-full rounded-md border max-h-52 object-contain" />
                <button
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                  onClick={() => { setSelectedFile(null); setPreviewSrc(null); if (fileRef.current) fileRef.current.value = ''; }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select an image</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-3xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
              onClick={() => setLightboxSrc(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <img src={lightboxSrc} alt="Bank Statement" className="w-full rounded-lg max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {/* ── Transfer Modal ── */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fund Transfer</DialogTitle>
            <DialogDescription>Transfer funds between your own heads or remit to Regional Office.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transfer Type</label>
              <Combobox
                entity="Transfer Type"
                placeholder="Select Transfer Type"
                value={transferType}
                onChange={(val) => {
                  setTransferType(val as 'Own Heads' | 'Region');
                  setTransferRows([{ head_id: '', amount: '' }]);
                  setFromHeadId('');
                  setTransferImage(null);
                }}
                options={[
                  { id: 'Own Heads', name: 'Own Heads' },
                  { id: 'Region', name: 'Region' }
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {transferType === 'Region' ? 'To Head' : 'From Head'}
              </label>
              <Combobox
                entity="Head"
                placeholder={transferType === 'Region' ? 'Select Head to transfer to' : 'Select Head to transfer from'}
                value={fromHeadId ? String(fromHeadId) : ''}
                onChange={(val) => setFromHeadId(val ? Number(val) : '')}
                options={transferType === 'Region' ? (
                  (fundHeads || []).filter(h => h.type === 'regional').map(h => ({ id: String(h.id), name: h.name }))
                ) : (
                  (fundHeads || []).filter(h => h.type === 'institutional' || h.type === 'institute' || !h.type).map(h => {
                    const held = (ownBalances || []).find(b => b.fund_head_id === h.id);
                    const bal = held ? Number(held.balance) : 0;
                    return { id: String(h.id), name: `${h.name} (Balance: ${formatAmount(bal)})` };
                  })
                )}
              />
              {transferType === 'Own Heads' && fromHeadId && (
                <p className="text-xs text-muted-foreground">
                  Available Balance: <strong className="text-primary">{formatAmount(getFromHeadBalance())}</strong>
                </p>
              )}
            </div>

            {transferType === 'Region' && (
              <div className="p-3 bg-muted/40 rounded-md border">
                <p className="text-sm text-muted-foreground">Regional Office</p>
                <p className="font-semibold text-lg">{regionalOffice ? regionalOffice.name : 'Unknown Regional Office'}</p>
              </div>
            )}

            <Separator />

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Transfer Details</label>
                <Button size="sm" variant="outline" onClick={handleAddTransferRow} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                </Button>
              </div>
              <div className="space-y-2">
                {transferRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Combobox
                        entity="Head"
                        placeholder={transferType === 'Region' ? 'Select From Head' : 'Select To Head'}
                        value={row.head_id ? String(row.head_id) : ''}
                        onChange={(val) => handleTransferRowChange(index, 'head_id', val ? Number(val) : '')}
                        options={transferType === 'Region' ? (
                          (fundHeads || []).filter(h => h.type === 'regional').map(h => {
                            const held = (ownBalances || []).find(b => b.fund_head_id === h.id);
                            const bal = held ? Number(held.balance) : 0;
                            return { id: String(h.id), name: `${h.name} (Balance: ${formatAmount(bal)})` };
                          })
                        ) : (
                          (fundHeads || []).map(h => ({ id: String(h.id), name: h.name }))
                        )}
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Amount"
                      min="0"
                      className="w-32"
                      value={row.amount}
                      onChange={(e) => handleTransferRowChange(index, 'amount', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTransferRow(index)}
                      disabled={transferRows.length <= 1}
                      className="text-destructive h-10 w-10 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {transferType === 'Own Heads' && fromHeadId && (
                <div className="mt-3 flex justify-between items-center text-sm">
                  <span className="font-medium">Total Transfer Amount:</span>
                  <span className={`font-bold ${getTotalTransferAmount() > getFromHeadBalance() ? 'text-destructive' : 'text-primary'}`}>
                    {formatAmount(getTotalTransferAmount())}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Attachment (Optional)</label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setTransferImage(e.target.files[0]);
                  } else {
                    setTransferImage(null);
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
              <Button onClick={submitTransfer} disabled={transferSubmit}>
                {transferSubmit ? 'Processing...' : 'Save Transfer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}