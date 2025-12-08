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

interface InstituteFormProps {
  institute?: {
    id: number;
    name: string;
    established_date: string;
    total_area: number;
    convered_area: number;
    img_layout: string | null;
    img_3d: string | null;
    video: string | null;
    gender: string;
    address: string | null;
    phone: string | null;
    email: string | null;

  };

}

export default function InstituteForm({ institute }: InstituteFormProps) {
  const isEdit = !!institute;

  const { data, setData, processing, errors, reset, setError } = useForm<{
    name: string;
    established_date: string;
    total_area: number;
    convered_area: number;
    img_layout: string | File | null;
    img_3d: string | File | null;
    video: string | File | null;
    gender: string;
    address: string;
    phone: string;
    email: string;
  }>({
    name: institute?.name || '',
    established_date: institute?.established_date || '',
    total_area: institute?.total_area || 0,
    convered_area: institute?.convered_area || 0,
    img_layout: institute?.img_layout || '',
    img_3d: institute?.img_3d || '',
    video: institute?.video || '',
    gender: institute?.gender || '',
    address: institute?.address || '',
    phone: institute?.phone || '',
    email: institute?.email || ''
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
      if (key === 'img_layout' || key === 'img_3d' || key === 'video') {
        if (data[key] instanceof File) {
          formData.append(key, data[key] as File);
        }
        return;
      }

      // Handle numeric values
      if (key === 'total_area' || key === 'convered_area') {
        formData.append(key, data[key].toString());
        return;
      }

      // Handle all other values
      formData.append(key, data[key] as string);
    });

    if (isEdit) {
      // Add _method field for Laravel to handle PUT request
      formData.append('_method', 'PUT');
      router.post(`/institutes/${institute.id}`, formData, {
        forceFormData: true,
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => {
          setError(errors as any);
        },
      });
    } else {
      router.post('institutes', formData, {
        forceFormData: true,
        onError: (errors) => {
          setError(errors as any);
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institute', href: '/institute' },
    { title: isEdit ? 'Edit Institute' : 'Add Institute', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Update Institute' : 'Add Institute'} />

      <div className="flex-1 p-4 md:p-6 w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {data.name}
            </CardTitle>

          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6" encType='multipart/form-data'>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


                {/* Establishment Date */}
                <div className="space-y-2">
                  <Label htmlFor="established_date">Established Date</Label>
                  <Input
                    id="established_date"
                    type="date"
                    value={data.established_date}
                    onChange={(e) => setData('established_date', e.target.value)}

                  />
                  {errors.established_date && (
                    <p className="text-red-500 text-sm">{errors.established_date}</p>
                  )}
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label htmlFor="total_area">Total Area (sq ft)</Label>
                  <Input
                    id="total_area"
                    type="number"
                    value={data.total_area}
                    onChange={(e) => setData('total_area', Number(e.target.value))}
                  />
                  {errors.total_area && (
                    <p className="text-red-500 text-sm">{errors.total_area}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="convered_area">Covered Area (sq ft)</Label>
                  <Input
                    id="convered_area"
                    type="number"
                    value={data.convered_area}
                    onChange={(e) => setData('convered_area', Number(e.target.value))}
                  />
                  {errors.convered_area && (
                    <p className="text-red-500 text-sm">{errors.convered_area}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Layout image view */}
                <div className="space-y-2">
                  <Label>Current Layout Image</Label>
                  {institute?.img_layout ? (
                    <img
                      src={`/assets/${institute.img_layout}`}
                      alt="Layout"
                      className="w-full h-48 object-cover rounded"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No layout image uploaded.</p>
                  )}
                  <Input
                    id="img_layout"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('img_layout', e.target.files?.[0] || null)}
                  />
                  {errors.img_layout && (
                    <p className="text-red-500 text-sm">{errors.img_layout}</p>
                  )}
                </div>

                {/* 3D image view */}
                <div className="space-y-2">
                  <Label>Current Front View Image</Label>
                  {institute?.img_3d ? (
                    <img
                      src={`/assets/${institute.img_3d}`}
                      alt="3D View"
                      className="w-full h-48 object-cover rounded"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No 3D image uploaded.</p>
                  )}
                  <Input
                    id="img_3d"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('img_3d', e.target.files?.[0] || null)}
                  />
                  {errors.img_3d && (
                    <p className="text-red-500 text-sm">{errors.img_3d}</p>
                  )}
                </div>

                {/* Video view */}
                <div className="space-y-2">
                  <Label>Current Video</Label>
                  {institute?.video ? (
                    <video controls className="w-full h-48 rounded">
                      <source src={`/assets/${institute.video}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <p className="text-sm text-muted-foreground">No video uploaded.</p>
                  )}
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setData('video', e.target.files?.[0] || null)}
                  />
                  {errors.video && (
                    <p className="text-red-500 text-sm">{errors.video}</p>
                  )}
                </div>
              </div>


              <div className="flex items-center justify-between pt-2">

                <Button type="submit" disabled={processing}>
                  <Save className="mr-2 h-4 w-4" />
                  {processing
                    ? isEdit
                      ? 'Saving...'
                      : 'Adding...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Save Institute'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
