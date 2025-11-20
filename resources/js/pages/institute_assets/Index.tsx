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

interface InstituteAsset {
  id: number;
  current_qty: number;
  details: string;
  added_date: string;
  asset: {
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  };
  room?: {
    id: number;
    name: string;
    block?: {
      id: number;
      name: string;
    };
  };
}

interface Room {
  id: number;
  name: string;
  block?: {
    id: number;
    name: string;
  };
}

interface Props {
  instituteAssets: {
    data: InstituteAsset[];
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    block: string;
    room: string;
    category: string;
  };
  permissions?: {
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
  blocks: Record<string, string>;      // from pluck('name', 'id') → object
  rooms: Room[];
  categories: Record<string, string>;  // from pluck('name', 'id') → object
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Institute Assets', href: '/institute-assets' },
];

export default function InstituteAssetIndex({
  instituteAssets,
  filters,
  blocks,
  rooms,
  categories,
  permissions,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBlock, setSelectedBlock] = useState(filters.block || '');
  const [selectedRoom, setSelectedRoom] = useState(filters.room || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');

  // Convert Laravel pluck objects → array of { id, name }
  const blockOptions = blocks
    ? Object.entries(blocks).map(([id, name]) => ({ id, name }))
    : [];

  const catOptions = categories
    ? Object.entries(categories).map(([id, name]) => ({ id, name }))
    : [];

  // Single unified filter handler
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    router.get(
      '/institute-assets',
      { ...filters, ...newFilters },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        only: ['instituteAssets', 'filters'],
      }
    );
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateFilters({ search,category:selectedCategory  });
    }
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBlock(value);
    setSelectedRoom(''); // reset room when block changes
    updateFilters({ block: value, room: '',category:selectedCategory });
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRoom(value);
    updateFilters({ room: value,category:selectedCategory  });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    updateFilters({block: selectedBlock, room: selectedRoom, category: value });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBlock('');
    setSelectedRoom('');
    setSelectedCategory('');
    router.get('/institute-assets', {}, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      only: ['instituteAssets', 'filters'],
    });
  };

  const handleDelete = (id: number) => {
    router.delete(`/institute-assets/${id}`, {
      onSuccess: () => toast.success('Institute asset deleted successfully'),
      onError: () => toast.error('Failed to delete institute asset'),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Institute Asset Management" />

      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Institute Assets</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institute asset inventory</p>
            </div>
            {permissions?.can_add && (
              <Link href="/institute-assets/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </Link>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 flex-wrap items-center">
              <Input
                placeholder="Search assets... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="md:w-64"
              />

              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {catOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedBlock}
                onChange={handleBlockChange}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Blocks</option>
                {blockOptions.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>

              <select
  value={selectedRoom}
  onChange={handleRoomChange}
  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">
    {selectedBlock ? 'All Rooms in This Block' : 'All Rooms'}
  </option>
  {rooms
    .filter((room) => !selectedBlock || room.block?.id === Number(selectedBlock))
    .map((room) => (
      <option key={room.id} value={room.id}>
        {room.name}
        {room.block && ` (${room.block.name})`}
      </option>
    ))}
</select>

              {(search || selectedBlock || selectedRoom || selectedCategory) && (
                <Button onClick={clearFilters} variant="ghost">
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {instituteAssets.data.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No institute assets found.</p>
              ) : (
                <table className="w-full min-w-max border-collapse rounded-lg overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="border p-3 text-left">Asset</th>
                      <th className="border p-3 text-left">Category</th>
                      <th className="border p-3 text-left">Details</th>
                      <th className="border p-3 text-center">Quantity</th>
                      <th className="border p-3 text-left">Added Date</th>
                      <th className="border p-3 text-left">Room</th>
                      <th className="border p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instituteAssets.data.map((asset) => (
                      <tr key={asset.id} className="hover:bg-muted/50">
                        <td className="border p-3 font-semibold">{asset.asset.name}</td>
                        <td className="border p-3">{asset.asset.category?.name || '—'}</td>
                        <td className="border p-3 text-sm">{asset.details || '—'}</td>
                        <td className="border p-3 text-center font-bold text-lg">{asset.current_qty}</td>
                        <td className="border p-3 text-sm">{new Date(asset.added_date).toLocaleDateString()}</td>
                        <td className="border p-3 text-sm">
                          {asset.room
                            ? `${asset.room.name}${asset.room.block ? ` (${asset.room.block.name})` : ''}`
                            : '—'}
                        </td>
                        <td className="border p-3">
                          <div className="flex gap-1">
                            {permissions?.can_edit && (
                              <Link href={`/institute-assets/${asset.id}/edit`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {permissions?.can_delete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <strong>{asset.asset.name}</strong> (Qty: {asset.current_qty}) will be permanently deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive"
                                      onClick={() => handleDelete(asset.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {instituteAssets.links.length > 3 && (
              <div className="flex justify-center gap-2 flex-wrap pt-6">
                {instituteAssets.links.map((link, i) => (
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