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
import { formatDate } from '@/utils/dateFormatter';

interface upgradations {
  id: number;
  details: string;
  from:string;
   to: string;
    levelfrom: string;
     levelto: string;
    status: string;

  count?: number;
}

interface Props {
  upgradations: {
    data: upgradations[];
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
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Upgradations', href: '/upgradations' },
];

export default function UpgradationsIndex({ upgradations, filters,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleDelete = (id: number) => {
    router.delete(`/upgradations/${id}`, {
      onSuccess: () => toast.success('Upgradation deleted successfully'),
      onError: () => toast.error('Failed to delete Upgradation'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/upgradations', { ...filters, search }, { preserveScroll: true });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Upgradations Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Upgradations</CardTitle>
              <p className="text-muted-foreground text-sm">View Upgradations</p>
            </div>
            {permissions.can_add &&(
            <Link href="/upgradations/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Upgradation
              </Button>
            </Link>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search Upgradation From Details... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
               <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800 text-center" >
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Details</th>
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">From</th>
            <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">To</th>
            <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Level From</th>
            <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Level To</th>
            <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Status</th>


      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200"></th>
     
      
    </tr>
  </thead>
  <tbody>
              {upgradations.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No upgradations found.</p>
              ) : (
                upgradations.data.map((upgradation) => (

                   <tr  key={upgradation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center
                    ">
                      <td className="border  text-sm text-gray-900 dark:text-gray-100">
                        {upgradation.details}
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(upgradation.from)}
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                       {formatDate(upgradation.to)}
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                       {upgradation.levelfrom}
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                        {upgradation.levelto} 
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                       Status: {upgradation.status} 
                         </td>
                          <td className="border  text-sm text-gray-900 dark:text-gray-100">{permissions.can_edit &&(
                      <Link href={`/upgradations/${upgradation.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>)}
                       {permissions.can_delete &&(
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this upgradation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              upgradation <strong>{upgradation.details}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(upgradation.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      )}</td>
                          </tr>
                
                ))
              )}
              </tbody></table>
            </div>

            {upgradations.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {upgradations.links.map((link, i) => (
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