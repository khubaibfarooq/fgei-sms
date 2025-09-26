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
    establishment_date: string ;
    area:number;
    convered_area:number;
    layout_img:string | null;
    img_3d:string | null;
    video:string | null;
    gender:string ;
     address:string | null;
 phone:string | null;
  email:string | null;

  };
  
}

export default function InstituteForm({ institute }: InstituteFormProps) {
  const isEdit = !!institute;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    establishment_date: string;
    area: number;
    convered_area: number;
    layout_img: string | File | null;
    img_3d: string | File | null;
    video: string | File | null;
    gender: string;
    address: string;
    phone: string;
    email: string;
  }>({
    name: institute?.name || '',
    establishment_date: institute?.establishment_date || new Date().toISOString().split('T')[0],
    area: institute?.area || 0,
    convered_area: institute?.convered_area || 0,
    layout_img: institute?.layout_img || '',
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
      if (key === 'layout_img' || key === 'img_3d' || key === 'video') {
        if (data[key] instanceof File) {
          formData.append(key, data[key] as File);
        }
        return;
      }

      // Handle numeric values
      if (key === 'area' || key === 'convered_area') {
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
      });
    } else {
      router.post('institutes.store', formData, {
        forceFormData: true,
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institute', href: '/institute' },
    { title: isEdit ? 'Edit Institute' : 'Add Institute', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Institute' : 'Add Institute'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Institute' : 'Add Institute'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit institute details' : 'Create a new institute'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Institute Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Institute Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Establishment Date */}
              <div className="space-y-2">
                <Label htmlFor="establishment_date">Establishment Date</Label>
                <Input
                  id="establishment_date"
                  type="date"
                  value={data.establishment_date}
                  onChange={(e) => setData('establishment_date', e.target.value)}
                />
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">Total Area (sq ft)</Label>
                <Input
                  id="area"
                  type="number"
                  value={data.area}
                  onChange={(e) => setData('area', Number(e.target.value))}
                />
              </div>

              {/* Covered Area */}
              <div className="space-y-2">
                <Label htmlFor="convered_area">Covered Area (sq ft)</Label>
                <Input
                  id="convered_area"
                  type="number"
                  value={data.convered_area}
                  onChange={(e) => setData('convered_area', Number(e.target.value))}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={data.gender} onValueChange={(val) => setData('gender', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Boys</SelectItem>
                    <SelectItem value="female">Girls</SelectItem>
                    <SelectItem value="mixed">Co-Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                />
              </div>

              {/* File Uploads */}
              <div className="space-y-2">
                <Label htmlFor="layout_img">Layout Image</Label>
                <Input
                  id="layout_img"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setData('layout_img', e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="img_3d">3D Image</Label>
                <Input
                  id="img_3d"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setData('img_3d', e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video">Video</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setData('video', e.target.files?.[0] || null)}
                />
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Link href="/institutes">
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
                    : 'Add Institute'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
