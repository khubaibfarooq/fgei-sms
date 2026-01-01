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

interface TransportFormProps {
  transport?: {
    id: number;
    vehicle_no: string;
    vehicle_type_id: number;
    institute_id: number;
  };
  vehicleTypes: Array<{ id: number; name: string }>;
}

export default function TransportForm({ transport, vehicleTypes }: TransportFormProps) {
  const isEdit = !!transport;

  const { data, setData, processing, errors, reset } = useForm<{
    vehicle_no: string;
    vehicle_type_id: number;
    institute_id: number;
  }>({
    vehicle_no: transport?.vehicle_no || '',
    vehicle_type_id: transport?.vehicle_type_id || 0,
    institute_id: transport?.institute_id || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      router.put(`/transports/${transport.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/transports', data, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transports', href: '/transports' },
    { title: isEdit ? 'Edit Transport' : 'Add Transport', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Transport' : 'Add Transport'} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Transport' : 'Add Transport'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit transport details' : 'Create a new transport vehicle'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vehicle_no">Vehicle Number</Label>
                <Input
                  id="vehicle_no"
                  value={data.vehicle_no}
                  onChange={(e) => setData('vehicle_no', e.target.value)}
                  placeholder="Enter vehicle number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type_id">Vehicle Type</Label>
                  <Select
                    value={data.vehicle_type_id.toString()}
                    onValueChange={(value) => setData('vehicle_type_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <Link href="/transports" className="w-full sm:w-auto">
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
                      : 'Add Transport'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}