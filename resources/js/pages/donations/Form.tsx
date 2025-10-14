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

interface DonationFormProps {
  donation?: {
    id: number;
    details: string;
    amount: number;
    institute_id: number;
    donation_type_id?: number;
    added_date?:Date;
  };
  donationTypes: Record<string, string>; // Changed from Array to Record (object)
}

export default function DonationForm({ donation, donationTypes }: DonationFormProps) {
  const isEdit = !!donation;
  
  console.log('donationTypes:', donationTypes);

  // Convert donationTypes object to array format for the Select component
  const donationTypesArray = React.useMemo(() => {
    if (!donationTypes) return [];
    
    // If donationTypes is already an array, use it directly
    if (Array.isArray(donationTypes)) {
      return donationTypes;
    }
    
    // Convert object { "1": "Administration", "2": "Academic" } to array format
    return Object.entries(donationTypes).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [donationTypes]);

  const { data, setData, processing, errors, reset } = useForm<{
    details: string;
    amount: number;
    institute_id: number;
    donation_type_id: number;
    added_date: Date | null; 
  }>({
    details: donation?.details || '',
    amount: donation?.amount || 0,
    institute_id: donation?.institute_id || 0,
    donation_type_id: donation?.donation_type_id || 0,
      added_date: donation?.added_date ? new Date(donation.added_date) : new Date(), // Convert string to Date or use current date


  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedData = {
    ...data,
    added_date: data.added_date ? data.added_date.toISOString().split('T')[0] : null,
  };
    if (isEdit) {
      router.put(`/donations/${donation.id}`, formattedData, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/donations', formattedData);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Donations', href: '/donations' },
    { title: isEdit ? 'Edit Donation' : 'Add Donation', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Donation' : 'Add Donation'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Donation' : 'Add Donation'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit donation details' : 'Create a new donation'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Donation Name</Label>
                  <Input
                    id="name"
                    value={data.details}
                    onChange={(e) => setData('details', e.target.value)}
                    placeholder="Enter donation details"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={data.amount}
                    onChange={(e) => setData('amount', Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donation_type_id">Donation Type</Label>
                  <Select
                    value={data.donation_type_id.toString()}
                    onValueChange={(value) => setData('donation_type_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select donation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {donationTypesArray.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                                <div className="space-y-2">
                                  
                                                    <Label htmlFor="added_date">Date</Label>
                <Input
                  id="added_date"
                  type="date"
                  value={data.added_date ? data.added_date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setData('added_date', e.target.value ? new Date(e.target.value) : null)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
                  {errors.added_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.added_date}</p>
                  )}
                                </div>
              </div>

             

              <div className="flex items-center justify-between pt-6">
                <Link href="/donations">
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
                    : 'Add Donation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}