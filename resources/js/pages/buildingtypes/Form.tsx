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

interface buildingTypesProps {
  buildingType?: {
    id: number;
    name: string;
  };
}

export default function AssetbuildingTypesForm({ buildingType }: buildingTypesProps) {
  const isEdit = !!buildingType;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
  }>({
    name: buildingType?.name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/building-types/${buildingType.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/building-types', data, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Building Types', href: '/building-types' },
    { title: isEdit ? 'Edit Building Type' : 'Add Building Type', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit buildingType' : 'Add Building Type'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Building Type' : 'Add Building Type'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Building Type' : 'Create a new asset Building Type'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Building Type Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter Building Type name"
                />
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/building-types">
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
                    : 'Add Building Type'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}