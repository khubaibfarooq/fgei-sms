import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
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

interface Fund {
  id: number;
  balance: number;
 
  fund_head_id: number;
  institute_id: number;
  institute: {
    name: string;
  };
   fund_head: {
    name: string;
  };
 
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
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Funds', href: '/funds' },
];

export default function FundIndex({ funds, filters,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');

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
            {permissions.can_add &&
            <Link href="/funds/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Fund
              </Button>
            </Link>
            }
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search funds... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
                 <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800 text-center" >
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Fund Head</th>
     
            <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Balance</th>


      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Action</th>
     
      
    </tr>
  </thead>
  <tbody>
              {funds.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No funds found.</p>
              ) : (
                funds.data.map((fund) => (

                   <tr  key={fund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center
                    ">
                     
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          {fund.fund_head.name}
                         </td>
                        
                           <td className="border  text-sm text-gray-900 dark:text-gray-100">
                   {fund.balance}
                         </td>
                          <td className="border  text-sm text-gray-900 dark:text-gray-100">
                  {permissions.can_edit &&
                      <Link href={`/funds/${fund.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      }
                      {permissions.can_delete &&
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
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
                         </td>
                         </tr>
                 
                ))
              )}
              </tbody></table>
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
    </AppLayout>
  );
}