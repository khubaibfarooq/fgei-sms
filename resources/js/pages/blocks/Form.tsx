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

interface BlockFormProps {
  block?: {
    id: number;
    name: string;
    area: number;
    institute_id: number;
  };
  institutes: Array<{ id: number; name: string }>;
}

export default function BlockForm({ block, institutes }: BlockFormProps) {
  const isEdit = !!block;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    area: number;
    institute_id: number;
  }>({
    name: block?.name || '',
    area: block?.area || 0,
    institute_id: block?.institute_id || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/blocks/${block.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/blocks', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blocks', href: '/blocks' },
    { title: isEdit ? 'Edit Block' : 'Add Block', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Block' : 'Add Block'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Block' : 'Add Block'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit block details' : 'Create a new block'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Block Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter block name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={data.area}
                    onChange={(e) => setData('area', Number(e.target.value))}
                    placeholder="Enter area"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institute_id">Institute</Label>
                <Select
                  value={data.institute_id.toString()}
                  onValueChange={(value) => setData('institute_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select institute" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutes.map((institute) => (
                      <SelectItem key={institute.id} value={institute.id.toString()}>
                        {institute.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/blocks">
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
                    : 'Add Block'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}