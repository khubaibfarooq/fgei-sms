import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import Combobox from '@/components/ui/combobox';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DollarSign } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Funds', href: '/reports/funds' },
];

interface Item { id: number; name: string; }
interface FundItem {
  institute_id: number;
    region_id: number;
  region_name: string;

  institute_name: string;
  fund_heads: { [key: string]: string | number };
  total_balance: number | string;
}
interface BalanceItem {
  fund_head?: { id: number; name: string };
  balance?: number | string;
}

interface Props {
  funds: FundItem[];
  fundheads: Item[];
  regions: Item[];
  balances: BalanceItem[];
  filters: {
    institute_id?: string;
    region_id?: string;
    fund_head_id?: string;
    search?: string;
  };
}

export default function Funds({
  funds: initialFunds = [],
  fundheads = [],
  regions = [],
  balances: initialBalances = [],
  filters,
}: Props) {
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [fundHead, setFundHead] = useState(filters.fund_head_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [funds, setFunds] = useState<FundItem[]>(initialFunds);
  const [balances, setBalances] = useState<BalanceItem[]>(initialBalances);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>([]);

  // Convert any string/number → number safely
  const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    return parseFloat(String(value).replace(/,/g, '')) || 0;
  };

  const formatCurrency = (amount: any): string => {
    const num = toNumber(amount);
    return new Intl.NumberFormat('ur-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const totalBalance = useMemo(() => {
    return balances.reduce((sum, b) => sum + toNumber(b.balance), 0);
  }, [balances]);

  const fetchInstitutes = async (regionId: string) => {
    if (!regionId || regionId === '0') {
      setFilteredInstitutes([]);
      return;
    }
    try {
      const res = await fetch(`/reports/getInstitutes?region_id=${regionId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFilteredInstitutes(data);
    } catch {
      toast.error('Failed to load institutes');
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
    fetchInstitutes(value);
    setInstitute('');
  };

  const applyFilters = async (pageUrl?: string) => {
    try {
      const params = new URLSearchParams({
        institute_id: institute || '',
        region_id: region || '',
        fund_head_id: fundHead || '',
      });
      const url = pageUrl || `/reports/funds/getfunds?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFunds(data.funds || data || []);
      setBalances(data.balances || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Funds');
    ws.columns = [
      { header: 'Institute', key: 'institute', width: 50 },
      ...fundheads.map(fh => ({ header: fh.name, key: fh.name, width: 18 })),
      { header: 'Total', key: 'total', width: 20 },
    ];

    funds.forEach(row => {
      const rowData: any = { institute:  row.institute_name ??( row.region_name.split(' ').pop() || row.region_name)};
      fundheads.forEach(fh => rowData[fh.name] = toNumber(row.fund_heads[fh.name]));
      rowData.total = toNumber(row.total_balance);
      ws.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(new Blob([buffer]), 'Funds_Report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text('Institute Wise Fund Balances', 14, 15);
    const headers = ['Institute', ...fundheads.map(fh => fh.name), 'Total'];
    const rows = funds.map(row => [
      row.institute_name ??( row.region_name.split(' ').pop() || row.region_name),
      ...fundheads.map(fh => toNumber(row.fund_heads[fh.name]).toFixed(2)),
      toNumber(row.total_balance).toFixed(2),
    ]);
    autoTable(doc, { head: [headers], body: rows, startY: 25 });
    doc.save('Funds_Report.pdf');
  };

  return (
  <AppLayout breadcrumbs={breadcrumbs}>
  <Head title="Funds Report" />

  <div className="p-4 lg:p-6 max-w-full">
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Funds Report</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View fund balances by institute / fund head
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button onClick={exportToPDF} variant="outline" size="sm">
              PDF
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Filters */}
      <CardContent className="pt-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.length > 0 && (
            <Combobox
              entity="region"
              value={region}
              onChange={handleRegionChange}
              options={regions.map(r => ({ id: r.id.toString(), name: r.name.split(' ').pop() || r.name }))}
              includeAllOption={true}
              placeholder="Select Region"
            />
          )}
          <Combobox
            entity="institute"
            value={institute}
            onChange={setInstitute}
            options={filteredInstitutes.map(i => ({ id: i.id.toString(), name: i.name }))}
            includeAllOption={false}
            placeholder="Select Institute"
          />
          <Select value={fundHead} onValueChange={setFundHead}>
            <SelectTrigger><SelectValue placeholder="Fund Head" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Fund Heads</SelectItem>
              {fundheads.map(f => (
                <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={() => applyFilters()} className="flex-1">Apply</Button>
            <Button
              variant="outline"
              onClick={() => {
                setRegion(''); setInstitute(''); setFundHead('');
                applyFilters('/reports/funds');
              }}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>

      <Separator />

      {/* Total Balance Summary */}
      <CardContent className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
            <p className="text-4xl font-bold text-primary mt-2">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Fund Heads</p>
            <p className="text-3xl font-bold text-muted-foreground mt-1">
              {balances.length}
            </p>
          </div>
        </div>
      </CardContent>

      <Separator />

      {/* Fund Head Mini Cards */}
      {balances.length > 0 && (
        <>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Fund Head Balances</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {balances.map((b, i) => (
                <div
                  key={i}
         onClick={() => {
              // Get the fund head ID from the balance object
              const fundHeadId = b.fund_head?.id?.toString() || '';
              
              // Set fund head filter
              setFundHead(fundHeadId);
              
              // Re-apply filters with the selected fund head
              const params = new URLSearchParams({
                institute_id: institute || '',
                region_id: region || '',
                fund_head_id: fundHeadId,
              });
              
              applyFilters(`/reports/funds/getfunds?${params.toString()}`);
              
            }}
                  className="bg-muted/50 dark:bg-gray-800 p-4 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {b.fund_head?.name || 'Unknown'}
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(b.balance)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
          <Separator />
        </>
      )}

      {/* Institute Wise Table - Responsive & Scrollable */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="max-w-[800px] lg:min-w-0">
            {funds.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No institute data found. Try adjusting filters.
              </div>
            ) : (
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="sticky left-0 z-20 bg-primary px-6 py-4 text-left font-semibold">
                      Institute / Region
                    </th>
                    {/* Show only selected fund head or all if none selected */}
                    {fundHead && fundHead !== '0' ? (
                      // Show only the selected fund head
                      <th className="px-4 py-4 text-center font-medium whitespace-nowrap">
                        {fundheads.find(fh => fh.id.toString() === fundHead)?.name}
                      </th>
                    ) : (
                      // Show all fund heads
                      fundheads.map(fh => (
                        <th key={fh.id} className="px-4 py-4 text-center font-medium whitespace-nowrap">
                          {fh.name}
                        </th>
                      ))
                    )}
                     {fundHead == '0' ? (
                    <th className="sticky right-0 z-20 bg-primary px-6 py-4 text-right font-bold">
                      Total
                    </th>
                    ) : (''
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {funds.map(row => {
  const isRegionRow = !row.institute_name && row.region_name;
  
  return (
    <tr
      key={row.institute_id ?? row.region_id}
      className={`hover:bg-muted/50 ${isRegionRow ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
      onClick={() => {
        if (isRegionRow && row.region_id) {
          const regionId = row.region_id.toString();
          
          // Set region and load institutes
          setRegion(regionId);
          fetchInstitutes(regionId);
          
          // Clear institute selection and re-apply filters
          setInstitute('');
      // Re-apply filters with the selected fund head
              const params = new URLSearchParams({
                institute_id: institute || '',
                region_id: regionId ,
                fund_head_id: fundHead || '',
              });
              
              applyFilters(`/reports/funds/getfunds?${params.toString()}`);
          
          // Optional: show toast feedback
        }
      }}
    >
      <td className="sticky left-0 z-10 bg-background text-wrap px-6 py-4 font-medium border-r  ">
        <div className="flex items-center gap-2">
          {row.institute_name || (
            <>
              {/* Optional visual indicator that this is a clickable region */}
              <span className="text-blue-600 dark:text-blue-400 font-semibold   ">
                {row.region_name.split(' ').pop() || row.region_name}
              </span>
              
            </>
          )}
        </div>
      </td>

                  {/* Show only selected fund head or all if none selected */}
                  {fundHead && fundHead !== '0' ? (
                    // Show only the selected fund head value
                    <td className="px-4 py-4 text-right font-medium tabular-nums">
                      {(() => {
                        const selectedFundHead = fundheads.find(fh => fh.id.toString() === fundHead);
                        return formatCurrency(row.fund_heads[selectedFundHead?.name || ''] || 0);
                      })()}
                    </td>
                  ) : (
  // Show all fund heads
  <>
    {fundheads.map(fh => (
      <td key={fh.id} className="px-4 py-4 text-right font-medium tabular-nums">
        {formatCurrency(row.fund_heads[fh.name])}
      </td>
    ))}
  </>
)}

{/* Total Balance - Outside the conditional */}
  {fundHead == '0' ? (
<td className="sticky right-0 z-10 bg-green-50 dark:bg-green-900/30 px-6 py-4 text-right font-bold text-green-700 dark:text-green-400  tabular-nums border-l">
  {formatCurrency(row.total_balance)}
</td>
  ):(
''
  )}       
    </tr>
  );
})}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                    <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 px-6 py-4">
                      Grand Total
                    </td>
                    {fundHead && fundHead !== '0' ? (
                      // Show only the selected fund head total
                      <td className="px-4 py-4 text-right font-mono tabular-nums">
                        {(() => {
                          const selectedFundHead = fundheads.find(fh => fh.id.toString() === fundHead);
                          const sum = funds.reduce((acc, row) => acc + toNumber(row.fund_heads[selectedFundHead?.name || ''] || 0), 0);
                          return formatCurrency(sum);
                        })()}
                      </td>
                    ) : (
                      // Show all fund head totals
                      fundheads.map(fh => {
                        const sum = funds.reduce((acc, row) => acc + toNumber(row.fund_heads[fh.name]), 0);
                        return (
                          <td key={fh.id} className="px-4 py-4 text-right font-mono tabular-nums">
                            {formatCurrency(sum)}
                          </td>
                        );
                      })
                    )}
                      { fundHead == '0' ? (
                    <td className="sticky right-0 z-10 bg-emerald-100 dark:bg-emerald-900/50 px-6 py-4 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums border-l">
                      {formatCurrency(totalBalance)}
                    </td>
                    ) : (''
                    )}
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</AppLayout>
  );
}