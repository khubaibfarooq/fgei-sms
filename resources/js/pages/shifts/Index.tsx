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

interface shifts {
  id: number;
  name: string;
  building_name:string;
  building_type?: { id: number; name?: string };
 shifts_count?: number;
}

interface Props {
  shifts: {
    data: shifts[];
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
  { title: 'Shifts', href: '/shifts' },
];

export default function ShiftsIndex({ shifts, filters,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');
console.log(shifts);

  const handleDelete = (id: number) => {
  if (!permissions.can_delete) {
    toast.error("You don’t have permission to delete shifts");
    return;
  }

  router.delete(`/shifts/${id}`, {
    onSuccess: () => toast.success("Shift deleted successfully"),
    onError: () => toast.error("Failed to delete Shift"),
  });
};

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/shifts', { ...filters, search }, { preserveScroll: true });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Shift Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Shifts</CardTitle>
              <p className="text-muted-foreground text-sm">Manage  Shifts</p>
            </div>
            {permissions.can_add &&  (
            <Link href="/shifts/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </Link>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search Shift... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">  
               <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800 text-center" >
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Shift</th>
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Building</th>
       <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Building Type</th>
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Action</th>
     
      
    </tr>
  </thead>
  <tbody>
              {shifts.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No shift found.</p>
              ) : (
                shifts.data.map((shift) => (

                   <tr  key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center
                    ">
                      <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          {shift.name}
                         </td>
                           <td className="border  text-sm text-gray-900 dark:text-gray-100">
                        {shift.building_name}
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">{shift.building_type?.name || 'N/A'}</td>
                          <td className="border  text-sm text-gray-900 dark:text-gray-100">   {permissions.can_edit &&  (
                      <Link href={`/shifts/${shift.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      )}
                      {permissions.can_delete &&  (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this shift?</AlertDialogTitle>
                            <AlertDialogDescription>
                              shift <strong>{shift.name}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(shift.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>)} </td>
                     
                       
                         </tr>


                  
                ))
              )}
              </tbody></table>
            </div>

            {shifts.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {shifts.links.map((link, i) => (
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