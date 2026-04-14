import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';

interface BlockFormProps {
  block?: {
    id: number;
    name: string;
    area: number;
    img: string | null;
    institute_id: number;
    block_type_id?: number;
    establish_date?: string;
  };
  blockTypes: Record<string, string>;
  roomTypes?: Record<string, string>;
}

export default function BlockForm({ block, blockTypes, roomTypes }: BlockFormProps) {
  const isEdit = !!block;

  // Convert blockTypes object to array format for the Select component
  const blockTypesArray = React.useMemo(() => {
    if (!blockTypes) return [];
    if (Array.isArray(blockTypes)) return blockTypes;
    return Object.entries(blockTypes).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [blockTypes]);

  // Convert roomTypes object to array format for the Select component
  const roomTypesArray = React.useMemo(() => {
    if (!roomTypes) return [];
    if (Array.isArray(roomTypes)) return roomTypes;
    return Object.entries(roomTypes).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [roomTypes]);

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    area: number;
    institute_id: number;
    block_type_id: number;
    img: string | File | null;
    establish_date?: string;
    rooms: Array<{
      name: string;
      area: number;
      room_type_id: number;
      img: File | null;
    }>;
  }>({
    name: block?.name || '',
    area: block?.area || 0,
    institute_id: block?.institute_id || 0,
    block_type_id: block?.block_type_id || 0,
    img: block?.img || null,
    establish_date: block?.establish_date || '',
    rooms: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    
    (Object.keys(data) as Array<keyof typeof data>).forEach(key => {
      // Skip null or empty values except area which could be 0, but 0 is fine
      if (data[key] === null || data[key] === '') return;

      // Handle file uploads separately
      if (key === 'img') {
        if (data[key] instanceof File) {
          formData.append(key, data[key] as File);
        }
        return;
      }

      // Handle array of rooms
      if (key === 'rooms' && Array.isArray(data[key])) {
        data.rooms.forEach((room, index) => {
          if (room.name) formData.append(`rooms[${index}][name]`, room.name);
          if (room.area !== undefined && room.area !== null) formData.append(`rooms[${index}][area]`, room.area.toString());
          if (room.room_type_id) formData.append(`rooms[${index}][room_type_id]`, room.room_type_id.toString());
          if (room.img instanceof File) {
            formData.append(`rooms[${index}][img]`, room.img);
          }
        });
        return;
      }

      // Handle all other values
      if (key !== 'rooms') {
        formData.append(key, data[key] as string);
      }
    });

    if (isEdit) {
      formData.append('_method', 'PUT');
      router.post(`/blocks/${block.id}`, formData, {
        forceFormData: true,
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => router.get('/blocks'),
      });
    } else {
      router.post('/blocks', formData, {
        onSuccess: () => reset(),
      });
    }
  };

  const addRoom = () => {
    setData('rooms', [
      ...data.rooms,
      { name: '', area: 0, room_type_id: 0, img: null }
    ]);
  };

  const removeRoom = (index: number) => {
    const newRooms = [...data.rooms];
    newRooms.splice(index, 1);
    setData('rooms', newRooms);
  };

  const updateRoom = (index: number, field: string, value: any) => {
    const newRooms = [...data.rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setData('rooms', newRooms);
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blocks', href: '/blocks' },
    { title: isEdit ? 'Edit Block' : 'Add Block', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Block' : 'Add Block'} />

      <div className="flex-1 p-2 md:p-4 w-full max-w-5xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <CardHeader className="py-4">
              <CardTitle className="text-xl font-bold">
                {isEdit ? 'Edit Block' : 'Add Block'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isEdit ? 'Update details for the selected block.' : 'Create a new block and add rooms if necessary.'}
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 pb-4 space-y-6">
              {/* Block Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="name">Block Name</Label>
                  <Input
                    className="h-8 text-sm"
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter block name"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="area">Area (sq ft)</Label>
                  <Input
                    className="h-8 text-sm"
                    id="area"
                    type="number"
                    value={data.area}
                    onChange={(e) => setData('area', Number(e.target.value))}
                    placeholder="Enter area"
                  />
                  {errors.area && <p className="text-xs text-red-500">{errors.area}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="block_type_id">Block Type</Label>
                  <Select
                    value={data.block_type_id ? data.block_type_id.toString() : ''}
                    onValueChange={(value) => setData('block_type_id', parseInt(value))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select block type" />
                    </SelectTrigger>
                    <SelectContent>
                      {blockTypesArray.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.block_type_id && <p className="text-xs text-red-500">{errors.block_type_id}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="establish_date">Establish Date</Label>
                  <Input
                    className="h-8 text-sm"
                    id="establish_date"
                    type="date"
                    value={data.establish_date || ''}
                    onChange={(e) => setData('establish_date', e.target.value)}
                    placeholder="Select establish date"
                  />
                  {errors.establish_date && <p className="text-xs text-red-500">{errors.establish_date}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="img">Block Image</Label>
                  <Input
                    className="h-8 text-sm file:text-xs file:h-full file:-ml-3 file:-my-3 file:mr-2 file:px-3"
                    id="img"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('img', e.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Image Preview</Label>
                  <ImagePreview dataImg={data.img} />
                </div>
              </div>

              {/* Rooms Section - Only show when creating a new block */}
              {!isEdit && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <div className="flex flex-row items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">Rooms</h3>
                        <p className="text-xs text-muted-foreground">Add rooms inside this new block.</p>
                      </div>
                      <Button type="button" onClick={addRoom} size="sm" variant="default" className="flex items-center h-8 text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Add Room
                      </Button>
                    </div>
                    
                    {data.rooms.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                        No rooms added yet. Click &quot;Add Room&quot; to begin.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.rooms.map((room, index) => (
                          <div key={index} className="relative grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-3 items-end bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                            <div className="space-y-1">
                              <Label className="text-xs">Room Name</Label>
                              <Input
                                className="h-8 text-sm"
                                placeholder="e.g. Room 101"
                                value={room.name}
                                onChange={(e) => updateRoom(index, 'name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Area (sq ft)</Label>
                              <Input
                                className="h-8 text-sm"
                                type="number"
                                placeholder="Area"
                                value={room.area || ''}
                                onChange={(e) => updateRoom(index, 'area', Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={room.room_type_id ? room.room_type_id.toString() : ''}
                                onValueChange={(val) => updateRoom(index, 'room_type_id', parseInt(val))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypesArray.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Room Image</Label>
                              <Input
                                className="h-8 text-sm file:text-xs file:h-full file:-ml-3 file:-my-3 file:mr-2 file:px-3"
                                type="file"
                                accept="image/*"
                                onChange={(e) => updateRoom(index, 'img', e.target.files?.[0] || null)}
                              />
                            </div>
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon"
                              onClick={() => removeRoom(index)}
                              className="h-8 w-8 shrink-0 mb-0.5"
                              title="Remove Room"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            
            <Separator />
            
            {/* Form Actions */}
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg">
              <Link href="/blocks" className="w-full sm:w-auto">
                <Button type="button" variant="secondary" size="sm" className="w-full h-9">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Button type="submit" size="sm" disabled={processing} className="w-full sm:w-auto h-9">
                <Save className="mr-2 h-4 w-4" />
                {processing
                  ? 'Saving...'
                  : (isEdit ? 'Save Changes' : 'Save Block & Rooms')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

function ImagePreview({ dataImg }: { dataImg: string | File | null }) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(() => {
    if (!dataImg) return null;
    return typeof dataImg === 'string' ? `/assets/${dataImg}` : null;
  });

  React.useEffect(() => {
    if (dataImg instanceof File) {
      const url = URL.createObjectURL(dataImg);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof dataImg === 'string' && dataImg) {
      setPreviewUrl(`/assets/${dataImg}`);
    } else {
      setPreviewUrl(null);
    }
  }, [dataImg]);

  if (!previewUrl) {
    return <p className="text-sm text-muted-foreground p-4 text-center rounded border-2 border-dashed">No image uploaded.</p>;
  }

  return (
    <img
      src={previewUrl}
      alt="Layout"
      className="w-full h-48 object-cover rounded border"
    />
  );
}