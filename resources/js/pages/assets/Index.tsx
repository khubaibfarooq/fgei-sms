import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface Asset {
  id: number;
  name: string;
  asset_category_id: number;
  details: string;
  type: 'consumable' | 'fixed';

  category: {
    name: string;
  };
}

interface Props {
  assets: {
    data: Asset[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Assets', href: '/asset' },
];

export default function AssetIndex({ assets, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: number) => {
    router.delete(`/asset/${id}`, {
      onSuccess: () => toast.success('Asset deleted successfully'),
      onError: () => toast.error('Failed to delete asset'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/asset', { ...filters, search }, { preserveScroll: true });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsImporting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/asset/import', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        if (data.error_count > 0) {
          toast.warning(`${data.error_count} row(s) had errors and were skipped.`, {
            description: data.errors?.join('\n'),
          });
        }
        // Refresh the page to show new assets
        router.visit(window.location.pathname, { preserveScroll: true });
      } else {
        toast.error(data.message || 'Import failed');
      }
    } catch (error) {
      toast.error('Failed to import assets. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Asset Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Assets</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional assets</p>
            </div>
            <div className="flex gap-2">
              {/* Hidden file input for import */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
              <Link href="/asset/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </Link>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search assets... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary dark:bg-gray-800">
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Asset</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Type</th>

                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Category</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Details</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.data.length === 0 ? (
                    <p className="text-muted-foreground text-center">No assets found.</p>
                  ) : (
                    assets.data.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100"> {asset.name}</td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100"> {asset.type}</td>

                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100"> {asset.category?.name}</td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.details}</td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100"> <Link href={`/asset/${asset.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Asset <strong>{asset.name}</strong> will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(asset.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog></td>
                      </tr>



                    ))
                  )}
                </tbody>
              </table>
            </div>

            {assets.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {assets.links.map((link, i) => (
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
    </AppLayout>
  );
}