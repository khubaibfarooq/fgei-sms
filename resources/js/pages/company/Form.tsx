
import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

interface CompanyFormProps {
  company?: {
    id: number;
    name: string;
    contact?: string;
    email?: string;
    address?: string;
  };
}

export default function CompanyForm({ company }: CompanyFormProps) {
  const isEdit = !!company;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: company?.name || '',
    contact: company?.contact || '',
    email: company?.email || '',
    address: company?.address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      put(`/company/${company.id}`, {
        preserveScroll: true,
        onSuccess: () => reset(),
      });
    } else {
      post('/company', {
        onSuccess: () => reset(),
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies', href: '/company' },
    { title: isEdit ? 'Edit Company' : 'Add Company', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Company' : 'Add Company'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Company' : 'Add Company'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit company details' : 'Create a new company'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter company name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={data.contact}
                  onChange={(e) => setData('contact', e.target.value)}
                  placeholder="Enter contact number"
                />
                {errors.contact && <p className="text-sm text-red-500">{errors.contact}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  placeholder="Enter address"
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/company">
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
                      : 'Add Company'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
