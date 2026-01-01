import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';
import Combobox from '@/components/ui/combobox';

interface RoomFormProps {
  room?: {
    id: number;
    name: string;
    area: number | null;
    room_type_id: number | null;
    block_id: number | null;
    img: string | null;

  };
  roomTypes: Array<{ id: number; name: string }>;
  blocks: Array<{ id: number; name: string; institute: { name: string } }>;
}

export default function RoomForm({ room, roomTypes, blocks }: RoomFormProps) {
  const isEdit = !!room;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    area: number;
    room_type_id: number;
    block_id: number;
    img: string | File | null;
  }>({
    name: room?.name || '',
    area: room?.area || 0,
    room_type_id: room?.room_type_id || 0,
    block_id: room?.block_id || 0,
    img: room?.img || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    (Object.keys(data) as Array<keyof typeof data>).forEach(key => {
      // Skip null or empty values

      if (data[key] === null || data[key] === '') {
        return;
      }
      // Handle file uploads separately
      if (key === 'img') {
        if (data[key] instanceof File) {
          formData.append(key, data[key] as File);
        }
        return;
      }



      // Handle all other values
      formData.append(key, data[key] as string);
    });
    if (isEdit) {
      formData.append('_method', 'PUT');
      router.post(`/rooms/${room.id}`, formData, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          router.get('/rooms');
        },
      });
    } else {
      router.post('/rooms', formData, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Rooms', href: '/rooms' },
    { title: isEdit ? 'Edit Room' : 'Add Room', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Room' : 'Add Room'} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Room' : 'Add Room'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit room details' : 'Create a new room'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6" encType='multipart/form-data'>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={data.area}
                    onChange={(e) => setData('area', Number(e.target.value))}
                    placeholder="Enter area"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="room_type_id">Room Type</Label>
                  <Combobox
                    entity="room_type_id"
                    value={data.room_type_id?.toString()}
                    onChange={(value) => {
                      setData('room_type_id', parseInt(value));
                    }}
                    options={roomTypes.map(i => ({ id: i.id.toString(), name: i.name }))}
                    includeAllOption={false}
                    placeholder="Select Room Type"
                  />
                  {/*

                  <Select
                    value={data.room_type_id.toString()}
                    onValueChange={(value) => setData('room_type_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  */}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="block_id">Block</Label>
                  <Combobox
                    entity="block_id"
                    value={data.block_id?.toString()}
                    onChange={(value) => {
                      setData('block_id', parseInt(value));
                    }}
                    options={blocks.map(i => ({ id: i.id.toString(), name: i.name }))}
                    includeAllOption={false}
                    placeholder="Select Block"
                  />

                </div>
                <div className="space-y-2">

                  <Label htmlFor="img">Image</Label>
                  <Input
                    id="img"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('img', e.target.files?.[0] || null)}
                  />

                  <Label>Image</Label>
                  <ImagePreview dataImg={data.img} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <Link href="/rooms" className="w-full sm:w-auto">
                  <Button type="button" variant="secondary" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  {processing
                    ? isEdit
                      ? 'Saving...'
                      : 'Adding...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Add Room'}
                </Button>
              </div>
            </form>
          </CardContent>
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
    return <p className="text-sm text-muted-foreground">No image uploaded.</p>;
  }

  return (
    <img
      src={previewUrl}
      alt="Layout"
      className="w-full h-48 object-cover rounded"
    />
  );
}