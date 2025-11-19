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
import autoTable from 'jspdf-autotable';

import Combobox from '@/components/ui/combobox';
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
  qty: number;
  added_date: string;
  institute?: { id: number; name?: string };
  region?: { id: number; name?: string };
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
    region_id?: string;
  };
  institutes: Item[];
  regions: Item[];
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

export default function Plants({ plants: plantProp, institutes, regions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [plants, setPlant] = useState(plantProp);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);
console.log(regions);
  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => {
    if (!Array.isArray(filteredInstitutes)) {
      console.warn('filteredInstitutes is not an array or is null:', filteredInstitutes);
      return [];
    }
    return filteredInstitutes.filter(isValidItem);
  }, [filteredInstitutes]);

  const memoizedRegions = useMemo(() => {
    if (!Array.isArray(regions)) {
      console.warn('regions is not an array or is null:', regions);
      return [];
    }
    return regions.filter(isValidItem);
  }, [regions]);

  // Log invalid items for debugging
  useEffect(() => {
    const invalidItems = {
      institutes: Array.isArray(filteredInstitutes) ? filteredInstitutes.filter(item => !isValidItem(item)) : [],
      regions: Array.isArray(regions) ? regions.filter(item => !isValidItem(item)) : [],
    };
    Object.entries(invalidItems).forEach(([key, items]) => {
      if (items.length > 0) console.warn(`Invalid ${key}:`, items);
    });
  }, [filteredInstitutes, regions]);

  const fetchInstitutes = async (regionId: string) => {
    try {
      const params = new URLSearchParams({ region_id: regionId || '' }).toString();
      const response = await fetch(`/reports/getInstitutes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch institutes');
      }
      const data = await response.json();
      console.log('Fetched institutes:', data);
      setFilteredInstitutes(data);
      // Reset institute if the selected institute is not in the new list
      if (institute && regionId !== '0' && !data.some((inst: Item) => inst.id.toString() === institute)) {
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
    //debouncedApplyFilters(); // Trigger plant filter update
  };

  const debouncedApplyFilters = useMemo(
    () =>
      debounce(() => {
        const params = new URLSearchParams({
          search: search || '',
          institute_id: institute || '',
          region_id: region || '',
        });

        fetch(`/reports/plants/getPlants?${params.toString()}`)
          .then((response) => response.json())
          .then((data) => {
            console.log('Fetched filtered Plants:', data);
            setPlant(data);
          })
          .catch((error) => {
            console.error('Error fetching filtered Plants:', error);
            toast.error('Failed to fetch filtered Plants');
          });
      }, 300),
    [search, institute, region]
  );

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plants');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Quantity', key: 'qty', width: 30 },
      { header: 'Institute', key: 'institute', width: 20 },
      { header: 'Region', key: 'region', width: 20 },
    ];

    plants.data.forEach((item) => {
      worksheet.addRow({
        name: item.name,
        qty: item.qty,
        institute: item.institute?.name || 'N/A',
        region: item.region?.name || 'N/A',
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
      'Region',
    ];

    const tableRows = plants.data.map((item) => [
      item.name,
      item.qty,
      item.institute?.name || 'N/A',
      item.region?.name || 'N/A',
    ]);

  autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10 },
    });

    doc.save('plant_Report.pdf');
  };

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
                  {/* Region Filter */}
                  {memoizedRegions.length > 0 && ( 
                         <Combobox
                                    entity="region"
                                    value={region}
                                    onChange={(value) => handleRegionChange(value)}
                                    options={memoizedRegions.map((reg) => ({
                                      id: reg.id.toString(), // Convert ID to string to match prop type
                                      name: reg.name.split(' ').pop() || reg.name,
                                    }))}
                                    includeAllOption={false}
                                    
                                  />
                    
                  //   <Select value={region} onValueChange={handleRegionChange}>
                  //   <SelectTrigger>
                  //     <SelectValue placeholder="Select Region" />
                  //   </SelectTrigger>
                  //   <SelectContent>
                  //     <SelectItem value="0">All Regions</SelectItem>
                  //     {memoizedRegions.length > 0 ? (
                  //       memoizedRegions.map((reg) => (
                  //         <SelectItem key={reg.id} value={reg.id.toString()}>
                  //           {reg.name}
                  //         </SelectItem>
                  //       ))
                  //     ) : (
                  //       <div className="text-muted-foreground text-sm p-2">No regions available</div>
                  //     )}
                  //   </SelectContent>
                  // </Select>
                  )}
                       <Combobox
                                                    entity="institute"
                                                    value={institute}
                                                    onChange={(value) => setInstitute(value)}
                                                    options={memoizedInstitutes.map((inst) => ({
                                                      id: inst.id.toString(), // Convert ID to string to match prop type
                                                      name: inst.name,
                                                    }))}
                                                    includeAllOption={true}
                                                    
                                                  />
            

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
                    <CardTitle className="text-2xl font-bold">Plant Report</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportToPDF} className="w-full md:w-auto">
                      Export PDF
                    </Button>
                    <Button onClick={exportToExcel} className="w-full md:w-auto">
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800 text-center">
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Name</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Quantity</th>
                        
                        </tr>
                      </thead>
                      <tbody>
                        {plants.data.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-muted-foreground text-center p-4">
                              No Plants found.
                            </td>
                          </tr>
                        ) : (
                          plants.data.map((p) => (
                            <tr key={p.id} className="hover:bg-primary/10 dark:hover:bg-gray-700 ">
                              <td className="border p-2 text-sm md:text-md lg:text-lg border-r-1 font-bold text-gray-900 dark:text-gray-100">
                                {p.name}
                              </td>
                              <td className="border p-2 text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                                {p.qty}
                              </td>
                             
                           
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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