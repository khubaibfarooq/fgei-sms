import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

interface FormProps {
  shift?: {
    id: number;
    name: string;
   
    building_type_id?: number;
    building_name?: string;
    institute?: { id: number; name?: string };
    buildingType?: { id: number; name: string };
  };
  buildingTypes: Array<{ id: number; name: string }>;

}

export default function ShiftForm({ shift, buildingTypes }: FormProps) {
  const isEdit = !!shift;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
   
    building_type_id: number | '';
    building_name: string;
  }>({
    name: shift?.name || '',
   
    building_type_id: shift?.building_type_id || '',
    building_name: shift?.building_name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/shifts/${shift.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/shifts', data, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Shift', href: '/shifts' },
    { title: isEdit ? 'Edit Shift' : 'Add Shift', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Shift' : 'Add Shift'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Shift' : 'Add Shift'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Shift details' : 'Create a new Shift '}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="name">Shift Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter Shift name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>


                <div className="space-y-2">
                  <Label htmlFor="building_type_id">Building Type</Label>
                  <Select
                    value={data.building_type_id ? data.building_type_id.toString() : ''}
                    onValueChange={(value) => setData('building_type_id', value ? parseInt(value) : '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Building Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildingTypes.map((buildingType) => (
                        <SelectItem key={buildingType.id} value={buildingType.id.toString()}>
                          {buildingType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.building_type_id && (
                    <p className="text-sm text-destructive">{errors.building_type_id}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="building_name">Building Name</Label>
                <Input
                  id="building_name"
                  value={data.building_name}
                  onChange={(e) => setData('building_name', e.target.value)}
                  placeholder="Enter building name (optional)"
                />
                {errors.building_name && (
                  <p className="text-sm text-destructive">{errors.building_name}</p>
                )}
              </div>

             
              <div className="flex items-center justify-between pt-6">
                <Link href="/shifts">
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
                    : 'Add Shift'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}