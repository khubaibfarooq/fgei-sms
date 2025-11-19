import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { formatDate } from '@/utils/dateFormatter';
import Combobox from '@/components/ui/combobox';
import ExcelJS from 'exceljs'; // { changed code }
import FileSaver from 'file-saver'; // { changed code }
import jsPDF from 'jspdf'; // { changed code }
import autoTable from 'jspdf-autotable'; // { changed code }

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Funds', href: '/reports/funds' },
];

interface Item { id: number; name: string; }
interface FundItem {
  id: number;
  institute?: { id: number; name?: string };
  fund_head?: { id: number; name?: string };
  balance?: number;
  region?: { id:number; name?:string };
}

interface Props {
  funds: {
    data: FundItem[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  institutes: Item[] | [];
  fundheads: Item[] | [];
  regions: Item[] | [];
  filters: {
    institute_id?: string;
    region_id?: string;
    fund_head_id?: string;
    search?: string;
  };
}

export default function Funds({ funds: initialFunds, institutes: initialInstitutes, fundheads, regions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [fundHead, setFundHead] = useState(filters.fund_head_id || '');
  const [funds, setFunds] = useState(initialFunds);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(initialInstitutes || []);
  const [region, setRegion] = useState(filters.region_id || '');  // Memoized dropdown options

  // Validate items coming from server
  const isValidItem = (item: any): item is Item => {
    return item != null && typeof item.id === 'number' && item.id > 0 && typeof item.name === 'string' && item.name.trim() !== '';
  };

  // memoized lists
  const memoizedInstitutes = useMemo(() => {
    return Array.isArray(filteredInstitutes) ? filteredInstitutes.filter(isValidItem) : [];
  }, [filteredInstitutes]);

  const memoizedRegions = useMemo(() => {
    return Array.isArray(regions) ? regions.filter(isValidItem) : [];
  }, [regions]);

  // sync when server provided different initial props
  useEffect(() => {
    setFunds(initialFunds);
    setFilteredInstitutes(initialInstitutes || []);
  }, [initialFunds, initialInstitutes]);

  // Fetch institutes by region (same pattern as Projects.tsx)
  const fetchInstitutes = async (regionId: string) => {
    if (!regionId || regionId === '0' || regionId === '') {
      setFilteredInstitutes(initialInstitutes || []);
      if (institute) setInstitute('');
      return;
    }

    try {
      const params = new URLSearchParams({ region_id: regionId }).toString();
      const response = await fetch(`/reports/getInstitutes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch institutes');
      const data = await response.json();
      setFilteredInstitutes(data);
      if (institute && !data.some((i: Item) => i.id.toString() === institute)) {
        setInstitute('');
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to load institutes');
      setFilteredInstitutes([]);
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
    fetchInstitutes(value);
  };

  const applyFilters = async (pageUrl?: string) => {
    try {
      const params = new URLSearchParams({
        search: search || '',
        institute_id: institute || '',
        region_id: region || '',
        fund_head_id: fundHead || '',
      });
      const url = pageUrl || `/reports/funds/getfunds?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch funds');
      const data = await res.json();
      setFunds(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch funds');
    }
  };

  const debouncedApply = useMemo(() => debounce(applyFilters, 300), [search, institute, region, fundHead]);

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Funds');

    worksheet.columns = [
      { header: 'Fund Head', key: 'fund_head', width: 30 },
      { header: 'Balance', key: 'balance', width: 15 },
    ];

    funds.data.forEach((f) => {
      worksheet.addRow({
        fund_head: f.fund_head?.name || 'N/A',
        balance: typeof f.balance === 'number' ? f.balance.toFixed(2) : (f.balance ?? '0'),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, 'Funds_Report.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Funds Report', 14, 15);

    const headers = ['Fund Head', 'Balance'];
    const rows = funds.data.map((f) => [
      f.fund_head?.name || 'N/A',
      typeof f.balance === 'number' ? f.balance.toFixed(2) : (f.balance ?? '0'),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });

    doc.save('Funds_Report.pdf');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Funds Report" />
             <div className="flex-1 p-2 md:p-2">
          <div className="flex flex-col md:flex-row gap-3">
                    <div className="w-full md:w-1/3">

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Funds Report</CardTitle>
            <p className="text-sm text-muted-foreground">View fund balances by institute / fund head</p>
          </CardHeader>

          <Separator />

  <CardContent className="space-y-4">
              
              <Combobox
                entity="region"
                value={region}
                onChange={handleRegionChange}
                options={memoizedRegions.map((r) => ({ id: r.id.toString(), name:  r.name.split(' ').pop() || r.name }))}
                includeAllOption={true}
                placeholder="Select Region"
              />
              <Combobox
                entity="institute"
                value={institute}
                onChange={setInstitute}
                options={memoizedInstitutes.map((i) => ({ id: i.id.toString(), name: i.name }))}
                includeAllOption={false}
                placeholder="Select Institute"
              />
              <Select value={fundHead} onValueChange={(v) =>setFundHead(v)

              }>
                <SelectTrigger><SelectValue placeholder="Select Fund Head" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Fund Heads</SelectItem>
                  {fundheads.map((f) => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>


            <div className="flex gap-2">
              <Button onClick={() => applyFilters()}>Apply Filters</Button>
              <Button onClick={() => { setSearch(''); setRegion(''); setInstitute(''); setFundHead(''); }}>Reset</Button>
              
            </div>

          
          </CardContent>
        </Card>
        </div>
           <div className="w-full md:w-2/3">
              <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Funds Report</CardTitle>
            <p className="text-sm text-muted-foreground">View fund balances by institute / fund head</p>
             <div className="flex float-end gap-2">
             
              <Button onClick={exportToPDF} className="w-full md:w-auto">Export PDF</Button> {/* { changed code } */}
              <Button onClick={exportToExcel} className="w-full md:w-auto">Export Excel</Button> {/* { changed code } */}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
         

            <div>
              <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-primary text-white ">
                    <th className="p-2">Fund Head</th>
                    <th className="p-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {funds.data.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-muted-foreground">No funds found.</td></tr>
                  ) : (
                    funds.data.map((f: FundItem) => (
                      <tr key={f.id}  className='border-1 hover:bg-primary/10  dark:hover:bg-gray-700'>
                        <td className="p-2 text-left border-r-1 font-bold">{f.fund_head?.name || 'N/A'}</td>
                        <td className="p-2 text-right">{typeof f.balance === 'number' ? f.balance.toFixed(2) : (f.balance ?? '0')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           

            {funds.links && funds.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {funds.links.map((link: any, i: number) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => link.url ? applyFilters(link.url) : undefined}
                    className={link.active ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
             </div>
          </CardContent>
        </Card>
           </div>
      </div>
      </div>
    </AppLayout>
  );
}