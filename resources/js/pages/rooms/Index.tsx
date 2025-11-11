import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, DoorOpen } from 'lucide-react';
import { ImagePreview } from '@/components/ui/image-preview';
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

interface Room {
  id: number;
  name: string;
  area: number;
  room_type_id: number;
  block_id: number;
  img:string | null;
  type: {
    name: string;
  };
  block: {
    name: string;
    institute: {
      name: string;
    };
  };
  permissions?: {
     can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };

}

interface Props {
  rooms: {
    data: Room[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    block: string;
  };
  blocks: {
    [key: string]: string; // Object with id as key and name as value
  };
  permissions: {
  can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Rooms', href: '/rooms' },
];

export default function RoomIndex({ rooms, filters, blocks,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBlock, setSelectedBlock] = useState(filters.block || '');

  const handleDelete = (id: number) => {
    router.delete(`/rooms/${id}`, {
      onSuccess: () => toast.success('Room deleted successfully'),
      onError: () => toast.error('Failed to delete room'),
    });
  };

  const handleSearch = () => {
    router.get('/rooms', { search, block: selectedBlock }, { preserveScroll: true });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const blockValue = e.target.value;
    setSelectedBlock(blockValue);
    router.get('/rooms', { search, block: blockValue }, { preserveScroll: true });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBlock('');
    router.get('/rooms', {}, { preserveScroll: true });
  };

  // Convert blocks object to array for mapping
  const blockOptions = Object.entries(blocks).map(([id, name]) => ({
    id: id,
    name: name,

  }));

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Room Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Rooms</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional rooms</p>
            </div>
            {permissions.can_add &&(
            <Link href="/rooms/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </Link>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search rooms... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="flex-1"
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

              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
              
              {(search || selectedBlock) && (
                <Button onClick={clearFilters} variant="ghost">
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-3">
                <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800 text-center" >
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Name</th>
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Area(Sq Ft)</th>
       <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Block</th>
              <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Room Type</th>

      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Action</th>
     
      
    </tr>
  </thead>
  <tbody>
              {rooms.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No rooms found.</p>
              ) : (
                rooms.data.map((room) => (

                    <tr  key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center
                    ">
                      <td className="border  text-sm text-gray-900 dark:text-gray-100">
                   <div className='flex flex-column gap-2 align-middle'> <ImagePreview dataImg={room.img} size="h-20" />  <span className='font-bold'>{room.name}</span></div> 
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
                         {room.area}
                         </td>
                           <td className="border  text-sm text-gray-900 dark:text-gray-100">
                        {room.block.name} 
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">{room.type.name}</td>
                          <td className="border  text-sm text-gray-900 dark:text-gray-100">
  {permissions.can_edit &&(
                      <Link href={`/rooms/${room.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {permissions.can_delete &&(
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Room <strong>{room.name}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(room.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                          </td>
                          </tr>
                
                ))
              )}
              </tbody></table>
            </div>

            {rooms.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {rooms.links.map((link, i) => (
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