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
import { Textarea } from '@/components/ui/textarea';
import { BreadcrumbItem } from '@/types';

interface AssetFormProps {
  asset?: {
    id: number;
    name: string;
    asset_category_id: number;
    details: string;
  };
  assetCategories: Array<{ id: number; name: string }>;
}

export default function AssetForm({ asset, assetCategories }: AssetFormProps) {
  const isEdit = !!asset;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    asset_category_id: number;
    details: string;
  }>({
    name: asset?.name || '',
    asset_category_id: asset?.asset_category_id || 0,
    details: asset?.details || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/assets/${asset.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/assets', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assets', href: '/assets' },
    { title: isEdit ? 'Edit Asset' : 'Add Asset', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Asset' : 'Add Asset'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Asset' : 'Add Asset'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit asset details' : 'Create a new asset'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter asset name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_category_id">Category</Label>
                  <Select
                    value={data.asset_category_id.toString()}
                    onValueChange={(value) => setData('asset_category_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  value={data.details}
                  onChange={(e) => setData('details', e.target.value)}
                  placeholder="Enter asset details"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/assets">
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
                    : 'Add Asset'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}