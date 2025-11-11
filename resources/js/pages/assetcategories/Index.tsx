import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

interface AssetCategory {
  id: number;
  name: string;
  type: 'consumable' | 'fixed';
  assets_count?: number;
}

interface Props {
  assetCategories: {
    data: AssetCategory[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Asset Categories', href: '/asset-categories' },
];

export default function AssetCategoryIndex({ assetCategories, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
console.log(assetCategories);
  const handleDelete = (id: number) => {
    router.delete(`/asset-categories/${id}`, {
      onSuccess: () => toast.success('Category deleted successfully'),
      onError: () => toast.error('Failed to delete category'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/asset-categories', { ...filters, search }, { preserveScroll: true });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Asset Category Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Asset Categories</CardTitle>
              <p className="text-muted-foreground text-sm">Manage asset categories</p>
            </div>
            <Link href="/asset-categories/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </Link>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search categories... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
               <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800">
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">ID</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Category</th>
           <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Type</th>

     
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Actions</th>
    </tr>
  </thead>
  <tbody>
              {!assetCategories || assetCategories.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No categories found.</p>
              ) : (
                assetCategories.data.map((category) => (
<tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          {category.id}
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
         {category.name}
        </td>
         <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
         {category.type}
        </td>
       
       
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
           <Link href={`/asset-categories/${category.id}/edit`}>
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
                            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Category <strong>{category.name}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(category.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
          
        </td>
      </tr>


               
                ))
              )}
              </tbody>
              </table>
            </div>

            {!assetCategories || assetCategories.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {assetCategories.links.map((link, i) => (
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