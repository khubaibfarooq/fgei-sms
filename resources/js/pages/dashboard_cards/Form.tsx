import React, { useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';

interface FormProps {
  dashboardCard?: {
    id: number;
    title: string;
    link: string;
    role_id: number;
  };
  roles: Array<{ id: number; name: string }>;
}

export default function DashboardCardForm({ dashboardCard, roles }: FormProps) {
  const isEdit = !!dashboardCard;
console.log(dashboardCard);
  const { data, setData, processing, errors } = useForm<{
    title: string;
    link: string;
    role_id: number | '';
  }>({
    title: dashboardCard?.title || '',
    link: dashboardCard?.link || '',
    role_id: dashboardCard?.role_id || '',
  });

  useEffect(() => {
    if (dashboardCard) {
      setData((prev) => ({
        ...prev,
        title: dashboardCard.title ?? '',
        link: dashboardCard.link ?? '',
        role_id: dashboardCard.role_id ?? '',
      }));
    } else {
      setData((prev) => ({
        ...prev,
        title: '',
        link: '',
        role_id: '',
      }));
    }
  }, [dashboardCard, setData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      router.put(`/dashboardcards/${dashboardCard?.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/dashboardcards', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Cards', href: '/dashboardcards' },
    { title: isEdit ? 'Edit Dashboard Card' : 'Add Dashboard Card', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Dashboard Card' : 'Add Dashboard Card'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Dashboard Card' : 'Add Dashboard Card'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Update card details' : 'Create a new dashboard card'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Enter card title"
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    value={data.link}
                    onChange={(e) => setData('link', e.target.value)}
                    placeholder="Enter card link"
                  />
                  {errors.link && <p className="text-red-500 text-sm">{errors.link}</p>}
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role_id">Role</Label>
                <Select
                  value={data.role_id ? data.role_id.toString() : ''}
                  onValueChange={(value) => setData('role_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role_id && <p className="text-red-500 text-sm">{errors.role_id}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6">
                <Link href="/dashboardcards">
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
                    : 'Add Card'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
