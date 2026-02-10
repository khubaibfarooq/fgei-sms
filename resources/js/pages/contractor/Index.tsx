
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

interface Company {
  id: number;
  name: string;
}

interface Contractor {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  company_id: number;
  company?: Company;
}

interface Props {
  contractors: {
    data: Contractor[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Contractors', href: '/contractor' },
];

export default function ContractorIndex({ contractors, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleDelete = (id: number) => {
    router.delete(`/contractor/${id}`, {
      onSuccess: () => toast.success('Contractor deleted successfully'),
      onError: () => toast.error('Failed to delete contractor'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/contractor', { ...filters, search }, { preserveScroll: true });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Contractor Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Contractors</CardTitle>
              <p className="text-muted-foreground text-sm">Manage contractors</p>
            </div>
            <Link href="/contractor/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contractor
              </Button>
            </Link>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search contractors... (press Enter)"
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
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Company</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Contact</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Email</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Address</th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!contractors || contractors.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">No contractors found.</td>
                    </tr>
                  ) : (
                    contractors.data.map((contractor) => (
                      <tr key={contractor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          {contractor.id}
                        </td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          {contractor.name}
                        </td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          {contractor.company?.name || '-'}
                        </td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          {contractor.contact}
                        </td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          {contractor.email}
                        </td>
                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          {contractor.address}
                        </td>

                        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                          <Link href={`/contractor/${contractor.id}/edit`}>
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
                                <AlertDialogTitle>Delete this contractor?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Contractor <strong>{contractor.name}</strong> will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(contractor.id)}
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

            {!contractors || contractors.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {contractors.links.map((link, i) => (
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
