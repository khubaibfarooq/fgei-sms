import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Package, Calendar } from 'lucide-react';
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
  institute?: {
    id: number;
    name?: string;
  };
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
  user?: {
    id: number;
    name: string;
  };
 
}

interface Props {
  instituteAssets: {
    data: InstituteAsset[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    block: string;
    room: string;
  };
   permissions?: {
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
  blocks: {
    [key: string]: string; // Object with id as key and name as value
  };
 
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Institute Assets', href: '/institute-assets' },
];

export default function InstituteAssetIndex({ instituteAssets, filters,blocks,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBlock, setSelectedBlock] = useState(filters.block || '');
  const [selectedRoom, setSelectedRoom] = useState(filters.room || '');

  const handleDelete = (id: number) => {
    router.delete(`/institute-assets/${id}`, {
      onSuccess: () => toast.success('Institute asset deleted successfully'),
      onError: () => toast.error('Failed to delete institute asset'),
    });
  };
 const handleSearch = () => {
    router.get('/rooms', { search, block: selectedBlock },  {
    preserveScroll: true,
    preserveState: true,
    replace: true,
    only: ['instituteAssets', 'filters'], // only reload these props
  });
  };
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/institute-assets', { ...filters, search },  {
    preserveScroll: true,
    preserveState: true,
    replace: true,
    only: ['instituteAssets', 'filters'], // only reload these props
  });
    }
  };
    const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const blockValue = e.target.value;
        setSelectedBlock(blockValue);
        router.get('/institute-assets', { search, block: blockValue },  {
    preserveScroll: true,
    preserveState: true,
    replace: true,
    only: ['instituteAssets', 'filters'], // only reload these props
  });
  console.log(instituteAssets.data);
      };
      const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const roomValue = e.target.value;
        setSelectedRoom(roomValue);
        router.get('/institute-assets', { ...filters, room: roomValue },  {
    preserveScroll: true,
    preserveState: true,
    replace: true,
    only: ['instituteAssets', 'filters'], // only reload these props
  });
      }
    
    const clearFilters = () => {
      setSearch('');
      setSelectedBlock('');
            setSelectedRoom('');

      router.get('/institute-assets', {},  {
    preserveScroll: true,
    preserveState: true,
    replace: true,
    only: ['instituteAssets', 'filters'], // only reload these props
  });
    };
  // Convert blocks object to array for mapping
  const blockOptions = Object.entries(blocks).map(([id, name]) => ({
    id: id,
    name: name,
  }));
    
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
            {permissions?.can_add &&
            <Link href="/institute-assets/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </Link>
            }
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
              <select
                             value={selectedBlock}
                             onChange={handleBlockChange}
                             className="flex-1 md:flex-none w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                             className="flex-1 md:flex-none w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           >
                             <option value="">All Rooms</option>
                              {instituteAssets.data.map((asset) => asset.room).filter((room, index, self) => room && index === self.findIndex((r) => r?.id === room.id)).map((room) => ( 
                                <option key={room?.id} value={room?.id}>
                                  {room?.name} {room?.block && `(${room.block.name})`}
                                </option>
                              ))} 
                           </select>
                           
                           
                           {(search || selectedBlock || selectedRoom) && (
                             <Button onClick={clearFilters} variant="ghost">
                               Clear
                             </Button>
                           )}  
            </div>

            <div className="space-y-3">
              {instituteAssets.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No institute assets found.</p>
              ) :
              <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800">
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Asset</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Category</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Quantity</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Added Date</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Room</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Details</th>
      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Actions</th>
    </tr>
  </thead>
  <tbody>
    {instituteAssets.data.map((instituteAsset) => (
      <tr key={instituteAsset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          {instituteAsset.asset.name}
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          {instituteAsset.asset.category?.name || '—'}
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>{instituteAsset.current_qty}</span>
          </div>
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(instituteAsset.added_date).toDateString()}</span>
          </div>
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          {instituteAsset.room 
            ? `${instituteAsset.room.name}${instituteAsset.room.block ? ` (${instituteAsset.room.block.name})` : ''}` 
            : '—'
          }
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          {instituteAsset.details || '—'}
        </td>
        <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-2">
            {permissions?.can_edit && (
              <Link href={`/institute-assets/${instituteAsset.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {permissions?.can_delete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this institute asset?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Asset <strong>{instituteAsset.asset.name}</strong> (Qty: {instituteAsset.current_qty}) will be permanently deleted from institute inventory.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => handleDelete(instituteAsset.id)}
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
</table>}
            </div>

            {instituteAssets.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {instituteAssets.links.map((link, i) => (
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