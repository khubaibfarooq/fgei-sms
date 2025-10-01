import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

interface InstituteAssetFormProps {
  instituteAsset?: {
    id: number;
    current_qty: number;
    details: string;
    added_date: string;
    room_id: number;
    asset_id: number;
    institute_id: number;
    asset?: {
      id: number;
      name: string;
      category?: {
        id: number;
        name: string;
      };
    };
  };
  assets: Array<{
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  }>;
  rooms: Array<{
    id: number;
    name: string;
    block?: {
      id: number;
      name: string;
    };
    type?: {
      id: number;
      name: string;
    };
  }>;
 
}

export default function InstituteAssetForm({ instituteAsset, assets, rooms }: InstituteAssetFormProps) {
  const isEdit = !!instituteAsset;

  const { data, setData, processing, errors, reset } = useForm<{
    current_qty: number | '';
    details: string;
    added_date: string;
    room_id: number | '';
    asset_id: number | '';
  }>({
    current_qty: instituteAsset?.current_qty || '',
    details: instituteAsset?.details || '',
    added_date: instituteAsset?.added_date || new Date().toISOString().split('T')[0],
    room_id: instituteAsset?.room_id || '',
    asset_id: instituteAsset?.asset_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/institute-assets/${instituteAsset.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/institute-assets', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institute Assets', href: '/institute-assets' },
    { title: isEdit ? 'Edit Asset' : 'Add Asset', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Institute Asset' : 'Add Institute Asset'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Institute Asset' : 'Add Institute Asset'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit institute asset details' : 'Add a new asset to institute inventory'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="asset_id">Asset</Label>
                  <Select
                    value={data.asset_id ? data.asset_id.toString() : ''}
                    onValueChange={(value) => setData('asset_id', value ? parseInt(value) : '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name} {asset.category && `(${asset.category.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.asset_id && (
                    <p className="text-sm text-destructive">{errors.asset_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_qty">Quantity</Label>
                  <Input
                    id="current_qty"
                    type="number"
                    min="1"
                    value={data.current_qty}
                    onChange={(e) => setData('current_qty', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Enter quantity"
                  />
                  {errors.current_qty && (
                    <p className="text-sm text-destructive">{errors.current_qty}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="added_date">Added Date</Label>
                  <Input
                    id="added_date"
                    type="date"
                    value={data.added_date}
                    onChange={(e) => setData('added_date', e.target.value)}
                  />
                  {errors.added_date && (
                    <p className="text-sm text-destructive">{errors.added_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room_id">Room</Label>
                  <Select
                    value={data.room_id ? data.room_id.toString() : ''}
                    onValueChange={(value) => setData('room_id', value ? parseInt(value) : '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name} {room.block && `(${room.block.name})`} {room.type && `- ${room.type.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.room_id && (
                    <p className="text-sm text-destructive">{errors.room_id}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  value={data.details}
                  onChange={(e) => setData('details', e.target.value)}
                  placeholder="Enter asset details or description"
                  rows={4}
                />
                {errors.details && (
                  <p className="text-sm text-destructive">{errors.details}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/institute-assets">
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
                    : 'Add Asset'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}