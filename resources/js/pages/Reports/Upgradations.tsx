import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { Building } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from '@/utils/dateFormatter';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'upgradations', href: '/reports/upgradations' },
];

interface upgradationProp {
  id: number;
  details: string;
  from:string;
  to:string;
  levelfrom: string;
  levelto:number;
  status:string;
  added_date: string;
  institute?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
}

interface Props {
  
  upgradations: {
    data: upgradationProp[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    institute_id?: string;
  };
  institutes: Item[];
  
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    toast.error('An error occurred while rendering the component. Please try again or contact support.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <p className="text-red-600">Error: {this.state.error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Validation function for items
const isValidItem = (item: any): item is Item => {
  const isValid = (
    item != null &&
    typeof item.id === 'number' &&
    item.id > 0 &&
    typeof item.name === 'string' &&
    item.name.trim() !== ''
  );
  if (!isValid) {
    console.warn('Invalid item detected:', item);
  }
  return isValid;
};

export default function upgradations({  upgradations: upgradationProp, institutes,  filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');


  const [upgradations, setupgradation] = useState(upgradationProp  || []);

  // Log initial props for debugging
  useEffect(() => {
   
    const invalidItems = {
      institutes: institutes.filter(item => !isValidItem(item)),
      

    };
    Object.entries(invalidItems).forEach(([key, items]) => {
      if (items.length > 0) console.warn(`Invalid ${key}:`, items);
    });
  }, [institutes]);



 
  const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('upgradations');

  worksheet.columns = [
    { header: 'Details', key: 'details', width: 30 },
        { header: 'Date From', key: 'from', width: 30 },

    { header: 'Date To', key: 'to', width: 20 },
        { header: 'Level From', key: 'levelfrom', width: 30 },

    { header: 'Level To', key: 'levelto', width: 20 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Institute', key: 'institute', width: 30 },
  ];

  upgradations.data.forEach((item) => {
    worksheet.addRow({
      details: item.details,
      from: item.from,
      to: item.to,
      levelfrom: item.levelfrom,
      levelto: item.levelto,
      status: item.status,
      // Add more fields as necessary
      //
      institute: item.institute?.name || 'N/A',
      
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  FileSaver.saveAs(blob, 'upgradations_Report.xlsx');
};
const exportToPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('upgradations Report', 14, 15);

  const tableColumn = [
    'Details',
    'Date From',
    'Date To',
    'Level From',
    'Level To',
    'Status',
    'Institute',
    
  ];

  const tableRows = upgradations.data.map((item) => [
    item.details,
    item.from,
    item.to,
    item.levelfrom,
    item.levelto,
    item.status,
    item.institute?.name || 'N/A',
   
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    styles: { fontSize: 10 },
  });

  doc.save('upgradation_Report.pdf');
};
 


  const debouncedApplyFilters = useMemo(
  () =>
    debounce(() => {
      const params = new URLSearchParams({
        search: search || '',
        institute_id: institute || '',
      });

      fetch(`/reports/upgradations/getUpgradations?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched filtered upgradations:', data);
          setupgradation(data); 
        })
        .catch((error) => {
          console.error('Error fetching filtered upgradations:', error);
          toast.error('Failed to fetch filtered upgradations');
        });
    }, 300),
  [search, institute]
);


  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => institutes.filter(isValidItem), [institutes]);


  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Upgradations Report" />
        <div className="flex-1 p-2 md:p-2">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left Side: Search Controls */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                  <p className="text-muted-foreground text-sm">Refine your Upgradation search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                
                  <Select value={institute} onValueChange={(value) => { setInstitute(value); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Institute" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Institutes</SelectItem>
                      {memoizedInstitutes.length > 0 ? (
                        memoizedInstitutes.map((inst) => {
                          //console.log('Rendering institute SelectItem:', { id: inst.id, value: inst.id.toString(), name: inst.name });
                          return (
                            <SelectItem key={inst.id} value={inst.id.toString()}>
                              {inst.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No institutes available</div>
                      )}
                    </SelectContent>
                  </Select>
                  
               
                  <Button onClick={debouncedApplyFilters} className="w-full">
                    Apply Filters
                  </Button>

                </CardContent>
              </Card>
            </div>

            {/* Right Side: upgradations List */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">upgradation Report</CardTitle>
                  </div>
                  <Button onClick={exportToPDF} className="w-full">
  Export PDF
</Button>
                  <Button onClick={exportToExcel} className="w-full">
  Export Excel
</Button>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    {  upgradations.data.length === 0 ? (
                      <p className="text-muted-foreground text-center">No upgradations found.</p>
                    ) : (
                      upgradations.data.map((upgradation) => (
                        <div
                          key={upgradation.id}
                          className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-blue-600" />
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-foreground">
                                {upgradation.details}
                              </div>
                              <div className="text-xs text-muted-foreground">
                              From: {formatDate(upgradation.from)} • To: {formatDate(upgradation.to)} • Status: {upgradation.status} • Level From: {upgradation.levelfrom} • Level To: {upgradation.levelto}  Institute: {upgradation.institute?.name || 'N/A'}  
                    
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {upgradations.links.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
                      {upgradations.links.map((link, i) => (
                        <Button
                          key={i}
                          disabled={!link.url}
                          variant={link.active ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                          className={link.active ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}