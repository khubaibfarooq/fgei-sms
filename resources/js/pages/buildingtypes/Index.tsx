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

interface Institute {
  id: number;
  name: string;
  establishment_date: string;
  area: number;
  convered_area: number;
  layout_img: string | null;
  img_3d: string | null;
  video: string | null;
  gender: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface Props {
  buildingTypes: {
    data: Institute[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'buildingTypes', href: '/buildingTypes' },
];

export default function BuildingTypesIndex({ buildingTypes, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleDelete = (id: number) => {
    router.delete(`/building-types/${id}`, {
      onSuccess: () => toast.success('Building Type deleted successfully'),
      onError: () => toast.error('Failed to delete Building Type'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/building-types', { ...filters, search }, { preserveScroll: true });
    }
  };
  

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Building Type" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Building Types</CardTitle>
              <p className="text-muted-foreground text-sm">Manage  Building Types</p>
            </div>
            <Link href="/building-types/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add 
              </Button>
            </Link>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            {/* Search */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search buildingTypes... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            {/* List */}
            <div className="space-y-3">
              {buildingTypes.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No buildingTypes found.</p>
              ) : (
                buildingTypes.data.map((institute) => (
                  <div
                    key={institute.id}
                    className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-foreground">
                        {institute.name}
                      </div>
                      
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/building-types/${institute.id}/edit`}>
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
                            <AlertDialogTitle>Delete this institute?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Institute <strong>{institute.name}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(institute.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {buildingTypes.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {buildingTypes.links.map((link, i) => (
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
