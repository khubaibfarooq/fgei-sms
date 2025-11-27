import React, { useState,useEffect ,useMemo} from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Combobox from '@/components/ui/combobox';

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
import { Badge } from '@/components/ui/badge'; // <-- Add this if not already

// Updated interface: role_id is now string, roles is array of role objects
interface DashboardCard {
  id: number;
  title: string;
  link: string;
  redirectlink: string;
  role_id: string; // e.g., "admin,teacher,principal" or "1,3,7"
  roles: Array<{ id: number; name: string }>;
    order: number | null; // Pre-loaded roles (from backend)
}

interface PageProps {
  dashboardCards: {
    data: DashboardCard[];
    links: any[];
  };
  filters: {
    search: string;
    role: string;
  };
    roles: Array<{ id: number; name: string }>;

}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard Cards', href: '/dashboardcards' },
];

export default function DashboardCards({ dashboardCards,roles, filters }: PageProps) {
  const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
  useEffect(() => {
  const timer = setTimeout(() => {
    router.get('/dashboardcards', { search, role }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }, 300);

  return () => clearTimeout(timer);
}, [search, role]);

// 2. Replace your options memo
const roleOptions = useMemo(() => {
  const opts = roles.map(r => ({
    id: r.id.toString(),     // <-- id (string or number)
    name: r.name,            // <-- name (string)
  }));

  // Add "All Roles" option at the top
  return [
    { id: '', name: 'All Roles' },
    ...opts
  ];
}, [roles]);
 
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/dashboardcards', { search }, { preserveState: true, preserveScroll: true });
    }
  };

  const handleDelete = (id: number) => {
    router.delete(`/dashboardcards/${id}`, {
      onSuccess: () => toast.success('Dashboard Card deleted successfully'),
      onError: () => toast.error('Failed to delete Dashboard Card'),
    });
  };
  

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard Cards" />

      <div className="flex-1 p-2 md:p-3">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Dashboard Cards</CardTitle>
              <p className="text-muted-foreground text-sm">Manage Dashboard Cards & Role Access</p>
            </div>
            <Link href="/dashboardcards/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Card
              </Button>
            </Link>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            {/* Search */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4">

            <Input
              type="text"
              placeholder="Search cards by title... (press Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
            
            />
               
  <Combobox
      entity="roles"
    placeholder="Filter by role..."
    value={role}
    onChange={(value) => setRole(value)} // '' means "All"
    options={roleOptions}
  />
  </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="border p-3 text-left font-medium">Title</th>
                    <th className="border p-3 text-left font-medium">Visible to Roles</th>
                    <th className="border p-3 text-left font-medium">Link</th>
                    <th className="border p-3 text-left font-medium">Redirect Link</th>
                                        <th className="border p-3 text-left font-medium">order</th>

                    <th className="border p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardCards.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No dashboard cards found.
                      </td>
                    </tr>
                  ) : (
                    dashboardCards.data.map((card) => (
                      <tr key={card.id} className="hover:bg-muted/50 transition-colors">
                        <td className="border p-3 font-medium">{card.title}</td>

                        {/* Multiple Roles Display */}
                        <td className="border p-3">
                          <div className="flex flex-wrap gap-1">
                            {card.roles && card.roles.length > 0 ? (
                              card.roles.map((role) => (
                                <Badge key={role.id} variant="secondary">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">No roles assigned</span>
                            )}
                          </div>
                        </td>

                        <td className="border p-3">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{card.link}</code>
                        </td>
                        <td className="border p-3">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{card.redirectlink}</code>
                        </td>
   <td className="border p-3">
                         {card.order}
                        </td>
                        <td className="border p-3">
                          <div className="flex gap-1">
                            <Link href={`/dashboardcards/${card.id}/edit`}>
                              <Button variant="ghost" size="icon" title="Edit">
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
                                  <AlertDialogTitle>Delete Dashboard Card?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete <strong>{card.title}</strong>.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => handleDelete(card.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {dashboardCards.links.length > 3 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {dashboardCards.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
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