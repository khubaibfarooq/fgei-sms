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
import { DollarSign, FileText } from 'lucide-react';


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
  institutes: Item[];
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
  institutes: initialInstitutes = [],
  balances: initialBalances = [],
  filters,
}: Props) {
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [fundHead, setFundHead] = useState(filters.fund_head_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [funds, setFunds] = useState<FundItem[]>(initialFunds);
  const [balances, setBalances] = useState<BalanceItem[]>(initialBalances);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(initialInstitutes);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
      return `Rs ${num.toLocaleString()}`;
    }
    // Otherwise show in millions
    const millions = num / 1000000;
    return `${millions.toFixed(2)}M`;
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
      const rowData: any = { institute: row.institute_name ?? (row.region_name.split(' ').pop() || row.region_name) };
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
      row.institute_name ?? (row.region_name.split(' ').pop() || row.region_name),
      ...fundheads.map(fh => toNumber(row.fund_heads[fh.name]).toFixed(2)),
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
      return (num / 1000000).toFixed(2) + 'M';
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
      const { fundHeads, table1, table2, table3, reportDate } = data;

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

      // ========== TABLE 2: Balance Held With Institutions (Anx-B) ==========
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Anx-B', pageWidth - 20, yPos, { align: 'right' });
      doc.text('Balance Held With Institutions (Still Not deposit to RO)', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;

      const t2Headers = ['Detail', ...fundHeads.map((fh: Item) => fh.name)];
      const t2Rows = table2.map((row: any) => [
        row.region_name,
        ...fundHeads.map((fh: Item) => formatPDFNumber(row.fund_heads[fh.name] || 0)),
      ]);

      // Calculate totals for Table 2
      const t2Totals = ['G.Total'];
      fundHeads.forEach((fh: Item) => {
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

          return `${fh.name}: Rs.${total} - Rs.${paid}, Rs.${remaining}`;
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
                includeAllOption={true}
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

          {/* Region Selection for PDF Report - Only show when regions are available */}
          {regions.length > 0 && (
            <>
              <CardContent className="pt-6 pb-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generate Regional Fund Report
                      {region && region !== '0' && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({regions.find(r => r.id.toString() === region)?.name.split(' ').pop() || 'Selected Region'})
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4">
                      {/* Show Select All only when no specific region is selected */}
                      {(!region || region === '0') && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedRegions.length === regions.length && regions.length > 0}
                            onCheckedChange={toggleAllRegions}
                          />
                          <span className="text-sm font-medium">Select All</span>
                        </label>
                      )}
                      <Button
                        onClick={() => {
                          // If a region is selected, generate report for that region only
                          if (region && region !== '0') {
                            generatePDFReport([parseInt(region)]);
                          } else {
                            generatePDFReport();
                          }
                        }}
                        disabled={((!region || region === '0') && selectedRegions.length === 0) || isGeneratingPDF}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {isGeneratingPDF ? 'Generating...' : 'Create Report'}
                      </Button>
                    </div>
                  </div>
                  {/* Show checkboxes only when no specific region is selected */}
                  {(!region || region === '0') && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {regions.map(r => {
                          const shortName = r.name.split(' ').pop() || r.name;
                          return (
                            <label
                              key={r.id}
                              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${selectedRegions.includes(r.id)
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50 border-border'
                                }`}
                            >
                              <Checkbox
                                checked={selectedRegions.includes(r.id)}
                                onCheckedChange={() => toggleRegionSelection(r.id)}
                              />
                              <span className="text-sm font-medium">{shortName}</span>
                            </label>
                          );
                        })}
                      </div>
                      {selectedRegions.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedRegions.length} region(s) selected for report
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              <Separator />
            </>
          )}


          {/* Total Balance Summary */}
          <CardContent className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" onClick={() => {
              setFundHead('');
              const params = new URLSearchParams({
                institute_id: institute || '',
                region_id: region || '',
                fund_head_id: '',
              });
              applyFilters(`/reports/funds/getfunds?${params.toString()}`);
            }}>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Fund Head Balances</h3>
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
                  >
                    Show All
                  </Button>
                </div>
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
                      <p className="text-xs font-medium text-muted-foreground lg:text-base text-sm truncate">
                        {b.fund_head?.name && b.fund_head.name !== 'N/A' ? b.fund_head.name : fundheads.find(fh => fh.id.toString() === fundHead)?.name}
                      </p>
                      <p className="text-lg font-bold lg:text-xl text-green-600 dark:text-green-400 mt-2">
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
                  <div className="text-center py-16 text-muted-foreground">
                    No institute data found. Try adjusting filters.
                  </div>
                ) : (
                  <table className="w-full  border-collapse text-sm">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="sticky left-0 z-20 bg-primary px-6 py-4 text-left font-semibold">
                          {funds[0].institute_name ? 'Institute' : 'Region'}
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
                        {fundHead == '0' || fundHead == '' ? (
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
                                  region_id: regionId,
                                  fund_head_id: fundHead || '',
                                });

                                applyFilters(`/reports/funds/getfunds?${params.toString()}`);

                                // Optional: show toast feedback
                              }
                            }}
                          >
                            <td className="sticky left-0 z-10 bg-background text-wrap px-6 py-4 font-medium lg:text-base   text-sm border-r  min-w-[200px]">
                              <div className="flex items-center gap-2">
                                {row.institute_name || (
                                  <>
                                    {/* Optional visual indicator that this is a clickable region */}
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold lg:text-base text-sm   ">
                                      {row.region_name.split(' ').pop() || row.region_name}
                                    </span>

                                  </>
                                )}
                              </div>
                            </td>

                            {/* Show only selected fund head or all if none selected */}
                            {fundHead && fundHead !== '0' ? (
                              // Show only the selected fund head value
                              <td className="px-4 py-4 text-right font-medium lg:text-base text-sm tabular-nums  whitespace-nowrap">
                                {(() => {
                                  const selectedFundHead = fundheads.find(fh => fh.id.toString() === fundHead);
                                  const amount = row.fund_heads[selectedFundHead?.name || ''] || 0;

                                  if (!isRegionRow) {
                                    return (
                                      <a
                                        href={`/reports/fundstrans?institute_id=${row.institute_id}&fund_head_id=${selectedFundHead?.id}&region_id=${region}`}
                                        className="text-blue-600 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {formatCurrency(amount)}
                                      </a>
                                    );
                                  }
                                  return formatCurrency(amount);
                                })()}
                              </td>
                            ) : (
                              // Show all fund heads
                              <>
                                {fundheads.map(fh => (
                                  <td key={fh.id} className="px-2 py-2 text-right font-medium lg:text-base text-sm tabular-nums whitespace-nowrap">
                                    {!isRegionRow ? (
                                      <a
                                        href={`/reports/fundstrans?institute_id=${row.institute_id}&fund_head_id=${fh.id}&region_id=${region}`}
                                        className="text-blue-600 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {formatCurrency(row.fund_heads[fh.name])}
                                      </a>
                                    ) : (
                                      formatCurrency(row.fund_heads[fh.name])
                                    )}
                                  </td>
                                ))}
                              </>
                            )}

                            {/* Total Balance - Outside the conditional */}
                            {fundHead == '0' || fundHead == '' ? (
                              <td className="sticky right-0 z-10 bg-green-50 dark:bg-green-900/30 px-3 py-2 lg:text-base text-sm text-right font-bold text-green-700 dark:text-green-400 tabular-nums border-l whitespace-nowrap">
                                {formatCurrency(row.total_balance)}
                              </td>
                            ) : (
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
                          <td className="px-4 py-4 text-right font-mono lg:text-base text-sm tabular-nums">
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
                              <td key={fh.id} className="px-4 py-4 text-right font-mono lg:text-base text-sm tabular-nums">
                                {formatCurrency(sum)}
                              </td>
                            );
                          })
                        )}
                        {fundHead == '0' || fundHead == '' ? (
                          <td className="sticky right-0 z-10 bg-emerald-100 dark:bg-emerald-900/50 px-6 py-4 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums border-l lg:text-base text-sm">
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