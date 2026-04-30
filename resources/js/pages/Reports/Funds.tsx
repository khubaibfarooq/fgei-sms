import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import Combobox from '@/components/ui/combobox';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DollarSign, FileText, Images, X } from 'lucide-react';
import { ImagePreview } from '@/components/ui/image-preview2';


const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Funds', href: '/reports/funds' },
];

interface Item { id: number; name: string; parent_id?: number | null; }
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

interface BankStatementMeta {
  total: number;
  last_image: string | null;
  last_date: string | null;
}

interface Props {
  funds: FundItem[];
  fundheads: Item[];
  regions: Item[];
  institutes: Item[];
  balances: BalanceItem[];
  bankStatements: Record<string, BankStatementMeta>;
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
  institutes: initialInstitutes = [],
  balances: initialBalances = [],
  bankStatements: initialBankStatements = {},
  filters,
}: Props) {
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [fundHead, setFundHead] = useState(filters.fund_head_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [funds, setFunds] = useState<FundItem[]>(initialFunds);
  const [balances, setBalances] = useState<BalanceItem[]>(initialBalances);
  const [bankStatements, setBankStatements] = useState<Record<string, BankStatementMeta>>(initialBankStatements);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(initialInstitutes);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Convert any string/number → number safely
  const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    return parseFloat(String(value).replace(/,/g, '')) || 0;
  };

  const formatCurrency = (amount: any): string => {
    const num = toNumber(amount);
    // If less than 1 million, show in Rs format
    if (num < 1000000) {
      return `${num.toLocaleString()}`;
    }
    // Otherwise show in millions
    const millions = num / 1000000;
    return `${millions.toFixed(2)} Mn`;
  };

  const totalBalance = useMemo(() => {
    return balances.reduce((sum, b) => sum + toNumber(b.balance), 0);
  }, [balances]);

  const isRegionView = funds.length > 0 && !funds[0].institute_name;

  const columnsToShow = useMemo(() => {
    if (fundHead && fundHead !== '0') {
      if (!isRegionView) {
        // Institute view + fund head selected: show the selected head AND all its children
        const selectedId = parseInt(fundHead);
        const children = fundheads.filter(fh => fh.parent_id === selectedId);
        const parent = fundheads.find(fh => fh.id === selectedId);
        return parent ? [parent, ...children] : children;
      } else {
        // Region view + fund head selected: show only the selected head (already aggregated)
        return fundheads.filter(fh => fh.id.toString() === fundHead);
      }
    } else if (isRegionView) {
      // Region view (no filter): Only show parent heads
      return fundheads.filter(fh => !fh.parent_id);
    }
    // Institute view (no filter): Show all fund heads
    return fundheads;
  }, [isRegionView, fundheads, fundHead]);

  const getFundHeadBalance = (row: FundItem, fh: Item) => {
    let balance = toNumber(row.fund_heads[fh.name] || 0);
    // In region view, we aggregate the parent head balance with its sub-heads
    if (isRegionView) {
      const subHeads = fundheads.filter(sub => sub.parent_id === fh.id);
      subHeads.forEach(sub => {
        balance += toNumber(row.fund_heads[sub.name] || 0);
      });
    }
    return balance;
  };

  const balancesToShow = useMemo(() => {
    return columnsToShow.map(fh => {
      const balanceItem = balances.find(b => Number(b.fund_head?.id) === Number(fh.id));
      return {
        fund_head: { id: fh.id, name: fh.name },
        balance: toNumber(balanceItem?.balance || 0),
      };
    });
  }, [columnsToShow, balances]);

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
      if (data.bankStatements) setBankStatements(data.bankStatements);
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
      ...columnsToShow.map(fh => ({ header: fh.name, key: fh.name, width: 18 })),
      { header: 'Total', key: 'total', width: 20 },
    ];

    funds.forEach(row => {
      const rowData: any = { institute: row.institute_name ?? (row.region_name.split(' ').pop() || row.region_name) };
      columnsToShow.forEach(fh => {
        rowData[fh.name] = getFundHeadBalance(row, fh);
      });
      rowData.total = toNumber(row.total_balance);
      ws.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(new Blob([buffer]), 'Funds_Report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text('Institute Wise Fund Balances', 14, 15);
    const headers = ['Institute', ...columnsToShow.map(fh => fh.name), 'Total'];
    const rows = funds.map(row => [
      row.institute_name ?? (row.region_name.split(' ').pop() || row.region_name),
      ...columnsToShow.map(fh => getFundHeadBalance(row, fh).toFixed(2)),
      toNumber(row.total_balance).toFixed(2),
    ]);
    autoTable(doc, { head: [headers], body: rows, startY: 25 });
    doc.save('Funds_Report.pdf');
  };

  // Toggle region selection for PDF report
  const toggleRegionSelection = (regionId: number) => {
    setSelectedRegions(prev =>
      prev.includes(regionId)
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  };

  // Select/Deselect all regions
  const toggleAllRegions = () => {
    if (selectedRegions.length === regions.length) {
      setSelectedRegions([]);
    } else {
      setSelectedRegions(regions.map(r => r.id));
    }
  };

  // Format number for PDF (compact)
  const formatPDFNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + ' Mn';
    }
    return num.toLocaleString();
  };

  // Generate PDF Report with 3 tables
  const generatePDFReport = async (regionIds?: number[]) => {
    const regionsToUse = regionIds || selectedRegions;
    if (regionsToUse.length === 0) {
      toast.error('Please select at least one region');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const params = new URLSearchParams();
      regionsToUse.forEach(id => params.append('region_ids[]', id.toString()));

      const res = await fetch(`/reports/funds/regional-pdf-data?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch data');

      const data = await res.json();
      console.log(data);
      const { fundHeads, table2FundHeads, table1, table2, table3, reportDate } = data;

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 15;

      // ========== TABLE 1: Present Balance Held With Regional Office (Anx-A) ==========
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Anx-A', pageWidth - 20, yPos, { align: 'right' });
      doc.text(`Present Balance Held With Regional Office as on ${reportDate}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;

      const t1Headers = ['Detail', ...fundHeads.map((fh: Item) => fh.name), 'Remarks'];
      const t1Rows = table1.map((row: any) => [
        row.region_name,
        ...fundHeads.map((fh: Item) => formatPDFNumber(row.fund_heads[fh.name] || 0)),
        ''
      ]);

      // Calculate totals for Table 1
      const t1Totals = ['G. Total'];
      fundHeads.forEach((fh: Item) => {
        const sum = table1.reduce((acc: number, row: any) => acc + (row.fund_heads[fh.name] || 0), 0);
        t1Totals.push(formatPDFNumber(sum));
      });
      t1Totals.push('');
      t1Rows.push(t1Totals);

      autoTable(doc, {
        head: [t1Headers],
        body: t1Rows,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // ========== TABLE 2: Balance Held With Institutions (Anx-B) - Uses table2FundHeads (includes IDF) ==========
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Anx-B', pageWidth - 20, yPos, { align: 'right' });
      doc.text('Balance Held With Institutions (Still Not deposit to RO)', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;

      // Use table2FundHeads which includes IDF
      const t2FundHeadsToUse = table2FundHeads || fundHeads;
      const t2Headers = ['Detail', ...t2FundHeadsToUse.map((fh: Item) => fh.name)];
      const t2Rows = table2.map((row: any) => [
        row.region_name,
        ...t2FundHeadsToUse.map((fh: Item) => formatPDFNumber(row.fund_heads[fh.name] || 0)),
      ]);

      // Calculate totals for Table 2
      const t2Totals = ['G.Total'];
      t2FundHeadsToUse.forEach((fh: Item) => {
        const sum = table2.reduce((acc: number, row: any) => acc + (row.fund_heads[fh.name] || 0), 0);
        t2Totals.push(formatPDFNumber(sum));
      });
      t2Rows.push(t2Totals);

      autoTable(doc, {
        head: [t2Headers],
        body: t2Rows,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yPos = 15;
      }

      // ========== TABLE 3: Combined Summary with Exp Approved (Anx-C) ==========
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Anx-C', pageWidth - 20, yPos, { align: 'right' });
      yPos += 5;

      const t3Headers = ['Detail', ...fundHeads.map((fh: Item) => fh.name), 'Exp Approved'];
      const t3Rows = table3.map((row: any) => {
        const expApprovedItems = fundHeads.map((fh: Item) => {
          const expData = row.exp_approved[fh.name];
          if (!expData || expData.total === 0) return '';

          // Format: "Fund Head: Total - Paid, Remaining"
          const total = formatPDFNumber(expData.total);
          const paid = formatPDFNumber(expData.paid);
          const remaining = formatPDFNumber(expData.remaining);

          return `${fh.name}: Rs.${total} - Rs.${paid}= Rs.${remaining}`;
        }).filter(Boolean);

        return [
          row.region_name,
          ...fundHeads.map((fh: Item) => formatPDFNumber(row.fund_heads[fh.name] || 0)),
          expApprovedItems.join('\n') || '-'
        ];
      });

      // Calculate totals for Table 3
      const t3Totals = ['G.Total'];
      fundHeads.forEach((fh: Item) => {
        const sum = table3.reduce((acc: number, row: any) => acc + (row.fund_heads[fh.name] || 0), 0);
        t3Totals.push(formatPDFNumber(sum));
      });
      t3Totals.push('');
      t3Rows.push(t3Totals);

      autoTable(doc, {
        head: [t3Headers],
        body: t3Rows,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });

      doc.save(`Regional_Fund_Report_${reportDate.replace(/ /g, '_')}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // show bank statements column only when displaying individual institutes
  const showBankStmtCol = funds.length > 0 && !!funds[0].institute_name;

  return (
    <>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Funds Report" />

        <div className="p-2 sm:p-3 w-full overflow-x-hidden space-y-3">
          <Card className="shadow-md">
            <CardHeader className="py-1.5 px-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Title */}
                <div className="shrink-0 mr-2">
                  <CardTitle className="text-sm font-bold leading-none">Funds Report</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Fund balances by institute / fund head</p>
                </div>

                {/* Filters inline */}
                {regions.length > 0 && (
                  <div className="w-32">
                    <Combobox
                      entity="region"
                      value={region}
                      onChange={handleRegionChange}
                      options={regions.map(r => ({ id: r.id.toString(), name: r.name.split(' ').pop() || r.name }))}
                      includeAllOption={true}
                      placeholder="Region"
                    />
                  </div>
                )}
                <div className="w-36">
                  <Combobox
                    entity="institute"
                    value={institute}
                    onChange={setInstitute}
                    options={filteredInstitutes.map(i => ({ id: i.id.toString(), name: i.name }))}
                    includeAllOption={true}
                    placeholder="Institute"
                  />
                </div>
                <Select value={fundHead} onValueChange={setFundHead}>
                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Fund Head" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Fund Heads</SelectItem>
                    {fundheads.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => applyFilters()} className="h-7 text-xs px-3">Apply</Button>
                <Button
                  variant="outline"
                  onClick={() => { setRegion(''); setInstitute(''); setFundHead(''); applyFilters('/reports/funds'); }}
                  className="h-7 text-xs px-3"
                >Reset</Button>

                {/* Export — pushed to right */}
                <div className="flex gap-1 ml-auto">
                  <Button onClick={exportToPDF} variant="outline" size="sm" className="h-7 text-xs px-2">PDF</Button>
                  <Button onClick={exportToExcel} variant="outline" size="sm" className="h-7 text-xs px-2">Excel</Button>
                </div>
              </div>
            </CardHeader>

            <Separator />

            {/* Region Selection for PDF Report */}
            {regions.length > 0 && (
              <>
                <CardContent className="pt-2 pb-2 px-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        Regional Fund Report
                        {region && region !== '0' && (
                          <span className="font-normal">
                            — {regions.find(r => r.id.toString() === region)?.name.split(' ').pop()}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {(!region || region === '0') && (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <Checkbox
                              checked={selectedRegions.length === regions.length && regions.length > 0}
                              onCheckedChange={toggleAllRegions}
                            />
                            <span className="text-xs">All</span>
                          </label>
                        )}
                        <Button
                          onClick={() => {
                            if (region && region !== '0') generatePDFReport([parseInt(region)]);
                            else generatePDFReport();
                          }}
                          disabled={((!region || region === '0') && selectedRegions.length === 0) || isGeneratingPDF}
                          size="sm"
                          className="h-7 text-xs gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          {isGeneratingPDF ? 'Generating...' : 'Create Report'}
                        </Button>
                      </div>
                    </div>
                    {(!region || region === '0') && (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {regions.map(r => {
                            const shortName = r.name.split(' ').pop() || r.name;
                            return (
                              <label
                                key={r.id}
                                className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs transition-all ${selectedRegions.includes(r.id)
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'hover:bg-muted/50 border-border'
                                  }`}
                              >
                                <Checkbox
                                  checked={selectedRegions.includes(r.id)}
                                  onCheckedChange={() => toggleRegionSelection(r.id)}
                                />
                                {shortName}
                              </label>
                            );
                          })}
                        </div>
                        {selectedRegions.length > 0 && (
                          <p className="text-xs text-muted-foreground">{selectedRegions.length} region(s) selected</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
                <Separator />
              </>
            )}


            {/* Total Balance Summary */}
            <CardContent className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-2 px-4">
              <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => {
                setFundHead('');
                const params = new URLSearchParams({
                  institute_id: institute || '',
                  region_id: region || '',
                  fund_head_id: '',
                });
                applyFilters(`/reports/funds/getfunds?${params.toString()}`);
              }}>
                <div>
                  <p className="text-xs text-muted-foreground">Total Balance</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Fund Heads</p>
                  <p className="text-xl font-bold text-muted-foreground">{balancesToShow.length}</p>
                </div>
              </div>
            </CardContent>

            <Separator />

            {/* Fund Head Mini Cards */}
            {balancesToShow.length > 0 && (
              <>
                <CardContent className="pt-2 pb-2 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground">Fund Head Balances</h3>
                    <Button
                      onClick={() => {
                        setFundHead('');
                        const params = new URLSearchParams({
                          institute_id: institute || '',
                          region_id: region || '',
                          fund_head_id: '',
                        });
                        applyFilters(`/reports/funds/getfunds?${params.toString()}`);
                      }}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2"
                    >
                      Show All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {balancesToShow.map((b, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          const fundHeadId = b.fund_head?.id?.toString() || '';
                          setFundHead(fundHeadId);
                          const params = new URLSearchParams({
                            institute_id: institute || '',
                            region_id: region || '',
                            fund_head_id: fundHeadId,
                          });
                          applyFilters(`/reports/funds/getfunds?${params.toString()}`);
                        }}
                        className="bg-muted/50 dark:bg-gray-800 px-3 py-1.5 rounded border hover:shadow-sm transition-shadow cursor-pointer min-w-[100px]"
                      >
                        <p className="text-[10px] font-medium text-muted-foreground truncate">
                          {b.fund_head?.name && b.fund_head.name !== 'N/A' ? b.fund_head.name : fundheads.find(fh => fh.id.toString() === fundHead)?.name}
                        </p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
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

                <div className="max-w-full">
                  {funds[0].institute_name && regions.length > 0 ? (
                    <Button
                      onClick={() => {
                        setFundHead('');
                        setRegion('');
                        const params = new URLSearchParams({
                          institute_id: institute || '',
                          region_id: '',
                          fund_head_id: '',
                        });
                        applyFilters(`/reports/funds/getfunds?${params.toString()}`);
                      }}
                      variant="outline"
                      size="sm"

                    >
                      Show All
                    </Button>) : ('')}
                  {funds.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground ">
                      No institute data found. Try adjusting filters.
                    </div>
                  ) : (

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-primary text-white">
                            <th className="sticky left-0 z-20 bg-primary px-3 py-2 text-left font-semibold text-xs">
                              {funds[0].institute_name ? 'Institute' : 'Region'}
                            </th>
                            {columnsToShow.map(fh => (
                              <th key={fh.id} className="px-3 py-2 text-center font-medium whitespace-nowrap">
                                {fh.name}
                              </th>
                            ))}
                            {(!fundHead || fundHead === '0') && (
                              <th className="sticky right-0 z-20 bg-primary px-3 py-2 text-right font-bold">Total</th>
                            )}
                            {showBankStmtCol && (
                              <th className="px-3 py-2 text-center font-medium whitespace-nowrap">Bank Statements</th>
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
                                    setRegion(regionId);
                                    fetchInstitutes(regionId);
                                    setInstitute('');
                                    const params = new URLSearchParams({
                                      institute_id: institute || '',
                                      region_id: regionId,
                                      fund_head_id: fundHead || '',
                                    });
                                    applyFilters(`/reports/funds/getfunds?${params.toString()}`);
                                  }
                                }}
                              >
                                <td className="sticky left-0 z-10 bg-background text-wrap px-3 py-1.5 font-medium text-xs border-r">
                                  <div className="flex items-center gap-1">
                                    {row.institute_name || (
                                      <>
                                        {/* Optional visual indicator that this is a clickable region */}
                                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm">
                                          {row.region_name.split(' ').pop() || row.region_name}
                                        </span>

                                      </>
                                    )}
                                  </div>
                                </td>

                                <>
                                  {columnsToShow.map(fh => (
                                    <td key={fh.id} className="px-2 py-1.5 text-right font-medium text-xs tabular-nums whitespace-nowrap">
                                      {!isRegionRow ? (
                                        <a
                                          href={`/reports/fundstrans?institute_id=${row.institute_id}&fund_head_id=${fh.id}&region_id=${region}`}
                                          className="text-blue-600 hover:underline"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {formatCurrency(getFundHeadBalance(row, fh))}
                                        </a>
                                      ) : (
                                        formatCurrency(getFundHeadBalance(row, fh))
                                      )}
                                    </td>
                                  ))}
                                </>
                                {(!fundHead || fundHead === '0') && (
                                  <td className="sticky right-0 z-10 bg-green-50 dark:bg-green-900/30 px-2 py-1.5 text-xs text-right font-bold text-green-700 dark:text-green-400 tabular-nums border-l whitespace-nowrap">
                                    {formatCurrency(row.total_balance)}
                                  </td>
                                )}
                                {/* Bank Statements cell — only for institute rows */}
                                {showBankStmtCol && (() => {
                                  const instId = row.institute_id?.toString();
                                  const meta = instId ? bankStatements[instId] : undefined;
                                  return (
                                    <td className="px-2 py-1.5 text-center text-xs">
                                      {meta ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          {meta.last_image && (
                                            /\.(jpeg|jpg|gif|png|webp|bmp|svg|jfif)$/i.test(meta.last_image) ? (
                                              <ImagePreview
                                                dataImg={meta.last_image}
                                                className="h-8 w-12 object-cover rounded border cursor-pointer hover:opacity-90"
                                              />
                                            ) : (
                                              <a
                                                href={`/${meta.last_image}`}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-center h-8 w-12 bg-muted rounded border hover:bg-muted/80 transition-colors"
                                                title="Download Document"
                                              >
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                              </a>
                                            )
                                          )}
                                          <span className="text-[10px] text-muted-foreground">
                                            {meta.last_date ? new Date(meta.last_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                          </span>
                                          <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5">
                                            <Images className="h-2.5 w-2.5" />{meta.total}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  );
                                })()}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                            <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs">Grand Total</td>
                            {columnsToShow.map(fh => {
                              const sum = funds.reduce((acc, row) => acc + getFundHeadBalance(row, fh), 0);
                              return (
                                <td key={fh.id} className="px-2 py-2 text-right font-mono text-xs tabular-nums">
                                  {formatCurrency(sum)}
                                </td>
                              );
                            })}
                            {(!fundHead || fundHead === '0') && (
                              <td className="sticky right-0 z-10 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums border-l text-xs">
                                {formatCurrency(totalBalance)}
                              </td>
                            )}
                            {showBankStmtCol && (
                              <td className="px-2 py-2 text-center text-xs text-muted-foreground">
                                {Object.values(bankStatements).reduce((s, m) => s + m.total, 0)} total
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-3xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
              onClick={() => setLightboxSrc(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <img src={lightboxSrc} alt="Bank Statement" className="w-full rounded-lg max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </>
  );
}