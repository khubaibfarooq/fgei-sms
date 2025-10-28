import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Calendar, DollarSign, FileText, Building, User, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FundTransaction {
  id: number;
  amount: number;
  type: 'in' | 'out';
  description: string;
  date: string;
  status: string;
  added_date: string;
  created_at: string;
  updated_at: string;
  added_by: number;
   user: {
    id: number;
    name: string;
 
  };
}

interface FundHeld {
  id: number;
  balance: number;
  fund_head_id: number;
  institute_id: number;
  institute: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  fund_head: {
    id: number;
    name: string;
    code?: string;
    description?: string;
  };
 
  added_by: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  fundheld: FundHeld;
  fundtrans: {
    data: FundTransaction[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Funds', href: '/funds' },
  { title: 'Fund Transactions', href: '#' },
];

export default function FundsTran({ fundheld, fundtrans, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get(window.location.pathname, { ...filters, search }, { preserveScroll: true });
    }
  };

  const calculateTotalIn = () => {
  return fundtrans.data
    .filter(transaction => transaction.type === 'in')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
};

const calculateTotalOut = () => {
  return fundtrans.data
    .filter(transaction => transaction.type === 'out')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
};

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Approved': { variant: 'default' as const, icon: CheckCircle },
      'Pending': { variant: 'secondary' as const, icon: FileText },
      'Rejected': { variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: 'in' | 'out') => {
    return type === 'in' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
      
        IN
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
      
        OUT
      </Badge>
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Fund Transactions - ${fundheld.fund_head.name}`} />
      <div className="flex-1 p-2 md:p-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/funds">
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {fundheld.fund_head.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {fundheld.institute.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{fundheld.balance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-3 space-y-3">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total In</p>
                      <p className="text-2xl font-bold text-green-600">{calculateTotalIn().toLocaleString()}</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      IN
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Out</p>
                      <p className="text-2xl font-bold text-red-600">{calculateTotalOut().toLocaleString()}</p>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      OUT
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold text-blue-600">{fundtrans.total}</p>
                    </div>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Institute Information */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Institute Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Institute ID</label>
                    <p className="text-sm">{fundheld.institute.id}</p>
                  </div>
                  <div>
                        
                    <label className="text-sm font-medium text-muted-foreground">Institute Name</label>
                    <p className="text-sm font-medium">{fundheld.institute.name}</p>
                  </div>
                    <div>
                    <label className="text-sm font-medium text-muted-foreground">Fund Head ID</label>
                    <p className="text-sm">{fundheld.fund_head.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fund Head</label>
                    <p className="text-sm font-medium">{fundheld.fund_head.name}</p>
                  </div>
                
             
                </div>
              </CardContent>
            </Card> */}

            {/* Search */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
            
              <div className="text-sm text-muted-foreground">
                Showing {fundtrans.from} to {fundtrans.to} of {fundtrans.total} transactions
              </div>
            </div>

            {/* Transactions Table */}
            <div className="space-y-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary dark:bg-gray-800">
                    <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Date</th>
                    <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Description</th>
                    <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Type</th>
                    <th className="border p-3 text-right text-sm font-medium text-white dark:text-gray-200">Amount</th>
                    <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Status</th>
                    <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {fundtrans.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">No transactions found.</p>
                      </td>
                    </tr>
                  ) : (
                    fundtrans.data.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(transaction.added_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="border p-3 text-sm">{transaction.description}</td>
                        <td className="border p-3 text-center">
                          {getTypeBadge(transaction.type)}
                        </td>
                        <td className="border p-3 text-right text-sm font-medium">
                          <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'in' ? '+' : '-'}
                            {transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="border p-3 text-center">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="border p-3 text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {transaction.user.name}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {fundtrans.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {fundtrans.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}