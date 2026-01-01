import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  img: string | null;
  type: { name: string };
  block: { name: string };
}

interface Props {
  rooms: {
    data: Room[];
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    block: string;
    roomtype: string;
  };
  blocks: Record<string, string>;     // pluck('name', 'id') → { "1": "Block A", ... }
  roomtypes: Record<string, string>;  // same format
  permissions: {
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Rooms', href: '/rooms' },
];

export default function RoomIndex({ rooms, filters, blocks, roomtypes, permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBlock, setSelectedBlock] = useState(filters.block || '');
  const [selectedRoomType, setSelectedRoomType] = useState(filters.roomtype || '');

  // Convert pluck objects to array of { id, name }
  const blockOptions = Object.entries(blocks).map(([id, name]) => ({ id, name }));
  const roomTypeOptions = Object.entries(roomtypes).map(([id, name]) => ({ id, name }));

  // Unified filter update
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    router.get(
      '/rooms',
      { search, block: selectedBlock, roomtype: selectedRoomType, ...newFilters },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
      }
    );
  };

  const handleSearch = () => updateFilters({ search });
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBlock(value);
    updateFilters({ block: value });
  };

  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRoomType(value);
    updateFilters({ roomtype: value });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBlock('');
    setSelectedRoomType('');
    router.get('/rooms', {}, { preserveScroll: true, preserveState: true, replace: true });
  };

  const handleDelete = (id: number) => {
    router.delete(`/rooms/${id}`, {
      onSuccess: () => toast.success('Room deleted successfully'),
      onError: () => toast.error('Failed to delete room'),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Room Management" />
      <div className="flex-1 p-2 md:p-4">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Rooms</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional rooms</p>
            </div>
            {permissions.can_add && (
              <Link href="/rooms/create" className="w-full md:w-auto">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </Link>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-2 flex-wrap items-center">
              <Input
                placeholder="Search rooms... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="w-full md:w-64"
              />

              <select
                value={selectedBlock}
                onChange={handleBlockChange}
                className="w-full md:w-auto px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Blocks</option>
                {blockOptions.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedRoomType}
                onChange={handleRoomTypeChange}
                className="w-full md:w-auto px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Room Types</option>
                {roomTypeOptions.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>

              <Button onClick={handleSearch} variant="outline" className="w-full md:w-auto">
                Search
              </Button>

              {(search || selectedBlock || selectedRoomType) && (
                <Button onClick={clearFilters} variant="ghost" className="w-full md:w-auto">
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Table - Desktop / Cards - Mobile */}
            <div className="space-y-3">
              {rooms.data.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No rooms found.</p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {rooms.data.map((room) => (
                      <div key={room.id} className="border rounded-lg p-4 bg-card shadow-sm">
                        <div className="flex items-start gap-3">
                          <ImagePreview dataImg={room.img} size="h-16 w-16 rounded" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{room.name}</h3>
                            <div className="text-sm text-muted-foreground space-y-1 mt-1">
                              <p><span className="font-medium">Area:</span> {room.area} Sq Ft</p>
                              <p><span className="font-medium">Block:</span> {room.block.name}</p>
                              <p><span className="font-medium">Type:</span> {room.type.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/institute-assets?room=${room.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Assets
                          </Button>
                          {permissions.can_edit && (
                            <Link href={`/rooms/${room.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                          )}
                          {permissions.can_delete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Room <strong>{room.name}</strong> will be permanently deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive"
                                    onClick={() => handleDelete(room.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-primary text-white text-center">
                          <th className="border p-3 text-sm lg:text-base">Room Name</th>
                          <th className="border p-3 text-sm lg:text-base">Area (Sq Ft)</th>
                          <th className="border p-3 text-sm lg:text-base">Block</th>
                          <th className="border p-3 text-sm lg:text-base">Room Type</th>
                          <th className="border p-3 text-sm lg:text-base">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.data.map((room) => (
                          <tr key={room.id} className="hover:bg-muted/50 text-center">
                            <td className="border p-3">
                              <div className="flex items-center justify-center gap-3">
                                <ImagePreview dataImg={room.img} size="h-12 w-12 rounded" />
                                <span className="font-semibold">{room.name}</span>
                              </div>
                            </td>
                            <td className="border p-3">{room.area}</td>
                            <td className="border p-3">{room.block.name}</td>
                            <td className="border p-3">{room.type.name}</td>
                            <td className="border p-3">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(`/institute-assets?room=${room.id}`, '_blank')}
                                  title="View Assets"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {permissions.can_edit && (
                                  <Link href={`/rooms/${room.id}/edit`}>
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {permissions.can_delete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Room <strong>{room.name}</strong> will be permanently deleted.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive"
                                          onClick={() => handleDelete(room.id)}
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
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {rooms.links.length > 3 && (
              <div className="flex justify-center gap-2 flex-wrap pt-6">
                {rooms.links.map((link, i) => (
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