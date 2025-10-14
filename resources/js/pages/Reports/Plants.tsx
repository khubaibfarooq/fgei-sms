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
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Plants', href: '/reports/Plants' },
];

interface PlantProp {
  id: number;
  name: string;
  qty:number;
  added_date: string;
  institute?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
}

interface Props {
  
  plants: {
    data: PlantProp[];
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

export default function Plants({  plants: plantProp, institutes,  filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');


  const [plants, setplant] = useState(plantProp  || []);

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
  const worksheet = workbook.addWorksheet('Plants');

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
        { header: 'Quantity', key: 'qty', width: 30 },

    { header: 'Institute', key: 'institute', width: 20 },

  ];

  plants.data.forEach((item) => {
    worksheet.addRow({
      name: item.name,
      qty: item.qty,
      institute: item.institute?.name || 'N/A',
      
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  FileSaver.saveAs(blob, 'Plants_Report.xlsx');
};
const exportToPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Plants Report', 14, 15);

  const tableColumn = [
    'Name',
    'Quantity',
    'Institute',
    
  ];

  const tableRows = plants.data.map((item) => [
    item.name,
    item.qty,
    item.institute?.name || 'N/A',
   
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    styles: { fontSize: 10 },
  });

  doc.save('plant_Report.pdf');
};
 


  const debouncedApplyFilters = useMemo(
  () =>
    debounce(() => {
      const params = new URLSearchParams({
        search: search || '',
        institute_id: institute || '',
      });

      fetch(`/reports/plants/getPlants?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched filtered Plants:', data);
          setplant(data); 
        })
        .catch((error) => {
          console.error('Error fetching filtered Plants:', error);
          toast.error('Failed to fetch filtered Plants');
        });
    }, 300),
  [search, institute]
);


  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => institutes.filter(isValidItem), [institutes]);


  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Plants Report" />
        <div className="flex-1 p-2 md:p-2">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left Side: Search Controls */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                  <p className="text-muted-foreground text-sm">Refine your plant search</p>
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

            {/* Right Side: Plants List */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">plant Report</CardTitle>
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
                    {  plants.data.length === 0 ? (
                      <p className="text-muted-foreground text-center">No Plants found.</p>
                    ) : (
                      plants.data.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-blue-600" />
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-foreground">
                                {p.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                               Qty: {p.qty}   Institute: {p.institute?.name || 'N/A'}  
                    
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {plants.links.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
                      {plants.links.map((link, i) => (
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