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
import { DateInput } from '@/components/ui/date-input';

interface Props {
  upgradation?: {
    id: number;
    institution_id: number;
    details: string;
    from: string;
    to: string;
    levelfrom: string;
    levelto: string;
    status: string;
  };
}

export default function AssetupgradationForm({ upgradation }: Props) {
  const isEdit = !!upgradation;

  const { data, setData, processing, errors, reset } = useForm<{
    details: string;
    institution_id: number;
    from: string;
    to: string;
    levelfrom: string;
    levelto: string;
    status: string;
  }>({
    details: upgradation?.details || '',
    institution_id: upgradation?.institution_id || 0,
    from: upgradation?.from || '',
    to: upgradation?.to || '',
    levelfrom: upgradation?.levelfrom || '',
    levelto: upgradation?.levelto || '',
    status: upgradation?.status || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      router.put(`/upgradations/${upgradation.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/upgradations', data, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Upgradations', href: '/upgradations' },
    { title: isEdit ? 'Edit Upgradation' : 'Add Upgradation', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Upgradation' : 'Add Upgradation'} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Upgradation' : 'Add Upgradation'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Upgradation details' : 'Create a new Upgradation'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Upgradation Details</Label>
                <Input
                  id="name"
                  value={data.details}
                  onChange={(e) => setData('details', e.target.value)}
                  placeholder="Enter upgradation Details"
                />
              </div>
              <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:items-end ">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="from">From</Label>
                  <DateInput
                    id="from"
                    value={data.from}
                    onChange={(value: string) => setData('from', value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="to">To</Label>
                  <DateInput
                    id="to"
                    value={data.to}
                    onChange={(value: string) => setData('to', value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelfrom">Level From</Label>
                <Input

                  id="levelfrom"
                  value={data.levelfrom}
                  onChange={(e) => setData('levelfrom', e.target.value)}
                  placeholder="Enter Level from"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelto">Level To</Label>
                <Input

                  id="levelto"
                  value={data.levelto}
                  onChange={(e) => setData('levelto', e.target.value)}
                  placeholder="Enter Level to"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <Link href="/upgradations" className="w-full sm:w-auto">
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
                      : 'Add upgradation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}