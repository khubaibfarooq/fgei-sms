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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
interface FundHeadFormProps {
  fundHead?: {
    id: number;
    name: string;
    type: string;
    parent_id?:string;
  };
  fundHeads?:Record<string, string>;
}

export default function FundHeadForm({ fundHead,fundHeads }: FundHeadFormProps) {
  const isEdit = !!fundHead;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    type: string;
    parent_id:string;
  }>({
    name: fundHead?.name || '',
      parent_id: fundHead?.parent_id || '',
    type: fundHead?.type || 'public',
  });
 const fundHeadsArray = React.useMemo(() => {
    if (!fundHeads) return [];
    
    // If blockTypes is already an array, use it directly
    if (Array.isArray(fundHeads)) {
      return fundHeads;
    }
    
    // Convert object { "1": "Administration", "2": "Academic" } to array format
    return Object.entries(fundHeads).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [fundHeads]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/fund-heads/${fundHead.id}`, data, {
        preserveScroll: true,
        preserveState: true,
          onSuccess: () => {
        router.get('/fund-heads');
        },
      });
    } else {
      router.post('/fund-heads', data, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fund Heads', href: '/fund-heads' },
    { title: isEdit ? 'Edit Fund Head' : 'Add Fund Head', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Fund Head' : 'Add Fund Head'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Fund Head' : 'Add Fund Head'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Fund Head details' : 'Create a new Fund Head'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Fund Head Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter Fund head name"
                />
                 <Label htmlFor="parent_id">Parent Fund Head</Label>
                  <Select
                    value={data.parent_id.toString()}
                    onValueChange={(value) => setData('parent_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Parent Fund Head" />
                    </SelectTrigger>
                    <SelectContent>
                      {fundHeadsArray.map((head) => (
                        <SelectItem key={head.id} value={head.id.toString()}>
                          {head.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
          
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as 'public' | 'institutional' | 'regional')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="public">Public</option>
                  <option value="institutional">Institutional</option>
                                    <option value="regional">Regional</option>

                </select>
              </div>
              <div className="flex items-center justify-between pt-6">
                <Link href="/fund-heads">
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
                    : 'Add Fund Head'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}