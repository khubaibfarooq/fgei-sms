import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';

interface FundFormProps {
  fund?: {
    id: number;

    balance: number;
    institute_id: number;
    fund_head_id?: number;
    description?: string;
    transaction_type?: string;


  };
  fundHeads: Array<{ id: number, name: string, balance: number }>; // Changed from Array to Record (object)
}

export default function FundForm({ fund, fundHeads }: FundFormProps) {
  const isEdit = !!fund;



  // Convert fundTypes object to array format for the Select component
  const fundHeadsArray = React.useMemo(() => {
    if (!fundHeads) return [];

    // If fundTypes is already an array, use it directly
    if (Array.isArray(fundHeads)) {
      return fundHeads;
    }

    // Convert object { "1": "Administration", "2": "Academic" } to array format
    return fundHeads;
  }, [fundHeads]);

  const { data, setData, processing, errors, reset } = useForm<{
    balance: number;
    institute_id: number;
    fund_head_id: number;
    description?: string;
    transaction_type?: string;
    // Allow null if the field is optional
  }>({
    balance: fund?.balance || 0,
    institute_id: fund?.institute_id || 0,
    fund_head_id: fund?.fund_head_id || 0,
    description: fund?.description || '',
    transaction_type: fund?.transaction_type || '',
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();


    if (isEdit) {

      router.put(`/funds/${fund.id}`, data, {
        preserveScroll: true,
        preserveState: true,

      });
    } else {
      const fundHead = fundHeadsArray.find((head) => head.id === data.fund_head_id);
      if (fundHead) {
        if (data.transaction_type === 'out' && data.balance > fundHead.balance) {
          alert('Insufficient balance');
          return;
        }
      }
      router.post('/funds', data, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                <div className="space-y-2">
                  <Label htmlFor="balance">balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={data.balance}
                    onChange={(e) => setData('balance', Number(e.target.value))}
                    placeholder="Enter balance"
                  />

                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund_head_id">Fund Type</Label>
                  <Select
                    value={data.fund_head_id.toString()}
                    onValueChange={(value) => setData('fund_head_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fundHeadsArray.map((head) => (
                        <SelectItem key={head.id} value={head.id.toString()}>
                          {head.name}({head.balance})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>






                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Enter description"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund_head_id">Transaction Type</Label>
                  <Select
                    required
                    value={data.transaction_type || ''}
                    onValueChange={(value) => setData('transaction_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>

                      <SelectItem value="in">Income</SelectItem>
                      <SelectItem value="out">Expense</SelectItem>
                    </SelectContent>
                  </Select>
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