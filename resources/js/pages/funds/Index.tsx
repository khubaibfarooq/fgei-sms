import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
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

export default function FundIndex({ funds, filters, permissions, bankStatements, instituteId }: Props) {
  const [search, setSearch] = useState(filters.search || '');

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
                <Link href="/funds/create" className="w-full md:w-auto">
                  <Button className="w-full">
                    Fund Transaction
                  </Button>
                </Link>
              }
            </div>
          </CardHeader>

          {/* Last statement info bar */}
          {lastStatement && (
            <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last bank statement uploaded on <strong>{formatDate(lastStatement.uploaded_at)}</strong></span>
              <img
                src={`/${lastStatement.image}`}
                alt="Last Statement"
                className="h-6 w-9 object-cover rounded border cursor-pointer ml-1"
                onClick={() => setLightboxSrc(`/${lastStatement.image}`)}
              />
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
                      <img
                        src={`/${stmt.image}`}
                        alt="Bank Statement"
                        className="h-20 w-28 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxSrc(`/${stmt.image}`)}
                        title={formatDate(stmt.uploaded_at)}
                      />
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
                    <th className="border p-2  font-medium text-white dark:text-gray-200">Balance</th>
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
    </AppLayout>
  );
}