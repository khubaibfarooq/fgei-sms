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

interface Donation {
  id: number;
  details: string;
  amount: number;
  institute_id: number;
  added_date:Date;
  institute: {
    name: string;
  };

}

interface Props {
  donations: {
    data: Donation[];
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
  { title: 'Donations', href: '/donations' },
];

export default function DonationIndex({ donations, filters,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleDelete = (id: number) => {
    router.delete(`/donations/${id}`, {
      onSuccess: () => toast.success('Donation deleted successfully'),
      onError: () => toast.error('Failed to delete donation'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/donations', { ...filters, search }, { preserveScroll: true });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Donation Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Donations</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional donations</p>
            </div>
            {permissions.can_add &&
            <Link href="/donations/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Donation
              </Button>
            </Link>
            }
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search donations... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
              {donations.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No donations found.</p>
              ) : (
                donations.data.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-foreground">
                          {donation.details}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Date:{new Date(donation.added_date).toDateString()}  • Amount: {donation.amount} 
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions.can_edit &&
                      <Link href={`/donations/${donation.id}/edit`}>
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
                            <AlertDialogTitle>Delete this donation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Donation <strong>{donation.details}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(donation.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      }
                    </div>
                  </div>
                ))
              )}
            </div>

            {donations.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {donations.links.map((link, i) => (
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