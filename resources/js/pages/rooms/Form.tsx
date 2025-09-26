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

interface RoomFormProps {
  room?: {
    id: number;
    name: string;
    area: number;
    room_type_id: number;
    block_id: number;
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
  }>({
    name: room?.name || '',
    area: room?.area || 0,
    room_type_id: room?.room_type_id || 0,
    block_id: room?.block_id || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/rooms/${room.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/rooms', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Rooms', href: '/rooms' },
    { title: isEdit ? 'Edit Room' : 'Add Room', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Room' : 'Add Room'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="block_id">Block</Label>
                  <Select
                    value={data.block_id.toString()}
                    onValueChange={(value) => setData('block_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((block) => (
                        <SelectItem key={block.id} value={block.id.toString()}>
                          {block.name} ({block.institute.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/rooms">
                  <Button type="button" variant="secondary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <Button type="submit" disabled={processing}>
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