
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
import toast, { Toaster } from 'react-hot-toast';
import { set } from 'lodash';

interface FundFormProps {
  fund?: {
    id: number;
    amount: number;
    institute_id: number;
    fund_head_id?: number;
    added_date: Date;
    status?: string;
    description?: string;
    type?: string;
  };
  fundHeads: Record<string, string>;
}

export default function FundForm({ fund, fundHeads }: FundFormProps) {
  const isEdit = !!fund;
  
  const fundHeadsArray = React.useMemo(() => {
    if (!fundHeads) return [];
    
    if (Array.isArray(fundHeads)) {
      return fundHeads;
    }
    
    return Object.entries(fundHeads).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [fundHeads]);

  const { data, setData, processing, errors, reset } = useForm<{
    amount: number;
    institute_id: number;
    fund_head_id: number | null;
    added_date: Date | null;
    status: string;
    description: string;
    type: string;
  }>({
    amount: fund?.amount || 0,
    institute_id: fund?.institute_id || 0,
    fund_head_id: fund?.fund_head_id || null,
    added_date: fund?.added_date ? new Date(fund.added_date) : new Date(),
    status: fund?.status || 'Pending',
    description: fund?.description || '',
    type: fund?.type || 'in',
  });

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  const formattedData = {
    ...data,
    added_date: data.added_date ? data.added_date.toISOString().split('T')[0] : null,
  };

  if (isEdit) {
    router.put(`/funds/${fund.id}`, formattedData, {
      preserveScroll: true,
      onError: (errors) => {
        // Inertia automatically sets errors to the errors object
        toast.error('Please check the form for errors.');
      },
      onSuccess: () => {
        toast.success('Fund updated successfully!');
      },
    });
  } else {
    router.post('/funds', formattedData, {
      preserveScroll: true,
      onError: (errors) => {
        console.log(errors);
        // Inertia automatically sets errors to the errors object
        toast.error('Please check the form for errors.');
      },
      onSuccess: () => {
        reset();
      },
    });
  }
};

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Funds', href: '/funds' },
    { title: isEdit ? 'Edit Fund' : 'Add Fund', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Fund' : 'Add Fund'} />
      <Toaster position="top-right" />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Fund' : 'Add Fund'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit fund details' : 'Create a new fund'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
                <p className="font-bold">Please fix the following errors:</p>
                <ul className="list-disc pl-5 mt-2">
                  {Object.entries(errors).map(([key, message]) => (
                    <li key={key} className="text-sm">{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={data.amount}
                    onChange={(e) => setData('amount', Number(e.target.value))}
                    placeholder="Enter Amount"
                    aria-invalid={!!errors.amount}
                    aria-describedby={errors.amount ? 'amount-error' : undefined}
                  />
                  {errors.amount && (
                    <p id="amount-error" className="mt-1 text-sm text-red-600 font-medium">
                      {errors.amount}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="added_date">Date</Label>
                  <Input
                    id="added_date"
                    type="date"
                    value={data.added_date ? data.added_date.toISOString().split('T')[0] : ''}
                    onChange={(e) => setData('added_date', e.target.value ? new Date(e.target.value) : null)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    aria-invalid={!!errors.added_date}
                    aria-describedby={errors.added_date ? 'added_date-error' : undefined}
                  />
                  {errors.added_date && (
                    <p id="added_date-error" className="mt-1 text-sm text-red-600 font-medium">
                      {errors.added_date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund_head_id">Fund Type</Label>
                  <Select
                    value={data.fund_head_id ? data.fund_head_id.toString() : ''}
                    onValueChange={(value) => setData('fund_head_id', parseInt(value))}
                  >
                    <SelectTrigger
                      aria-invalid={!!errors.fund_head_id}
                      aria-describedby={errors.fund_head_id ? 'fund_head_id-error' : undefined}
                    >
                      <SelectValue placeholder="Select fund type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fundHeadsArray.map((head) => (
                        <SelectItem key={head.id} value={head.id.toString()}>
                          {head.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.fund_head_id && (
                    <p id="fund_head_id-error" className="mt-1 text-sm text-red-600 font-medium">
                      {errors.fund_head_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value)}
                  >
                    <SelectTrigger
                      aria-invalid={!!errors.status}
                      aria-describedby={errors.status ? 'status-error' : undefined}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p id="status-error" className="mt-1 text-sm text-red-600 font-medium">
                      {errors.status}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={data.type}
                    onValueChange={(value) => setData('type', value)}
                  >
                    <SelectTrigger
                      aria-invalid={!!errors.type}
                      aria-describedby={errors.type ? 'type-error' : undefined}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">In</SelectItem>
                      <SelectItem value="out">Out</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p id="type-error" className="mt-1 text-sm text-red-600 font-medium">
                      {errors.type}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Enter description"
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? 'description-error' : undefined}
                  />
                  {errors.description && (
                    <p id="description-error" className="mt-1 text-sm text-red-600 font-medium">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/funds">
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
                    : 'Add Fund'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
