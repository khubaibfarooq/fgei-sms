import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

interface plantsFormProps {
  plant?: {
    id: number;
    name: string;
    qty: number;  

  };
}

export default function plantsForm({ plant }: plantsFormProps) {
  const isEdit = !!plant;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    qty: number | '';
  }>({
    name: plant?.name || '',
    qty: plant?.qty || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/plants/${plant.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/plants', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Plants', href: '/plants' },
    { title: isEdit ? 'Edit Plant' : 'Add Plant', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Plant' : 'Add Plant'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Plant' : 'Add Plant'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Plant details' : 'Create a new Plant'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Plant Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter plant name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min="0"
                  value={data.qty}
                  onChange={(e) => setData('qty', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Enter plant quantity"
                />
                {errors.qty && (
                  <p className="text-sm text-destructive">{errors.qty}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/plants">
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
                    : 'Add Plant'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}