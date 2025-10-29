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
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Transports', href: '/reports/transports' },
];

interface transportProp {
  id: number;
  vehicle_no: string;
  added_date: string;
  institute?: { id: number; name?: string };
  vehicle_type?: { id: number; name?: string };
  region?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
}

interface Props {
  transports: {
    data: transportProp[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    institute_id?: string;
    vehicle_type_id?: string;
    region_id?: string;
  };
  institutes: Item[] | null;
  vehicleTypes: Item[] | null;
  regions: Item[] | null;
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

export default function Transports({ transports: transportProp, institutes, vehicleTypes, regions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [vehicleType, setVehicleType] = useState(filters.vehicle_type_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [transports, setTransport] = useState(transportProp);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);

  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => {
    if (!Array.isArray(filteredInstitutes)) {
      console.warn('filteredInstitutes is not an array or is null:', filteredInstitutes);
      return [];
    }
    return filteredInstitutes.filter(isValidItem);
  }, [filteredInstitutes]);

  const memoizedVehicleType = useMemo(() => {
    if (!Array.isArray(vehicleTypes)) {
      console.warn('vehicleTypes is not an array or is null:', vehicleTypes);
      return [];
    }
    return vehicleTypes.filter(isValidItem);
  }, [vehicleTypes]);

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
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes.filter(item => !isValidItem(item)) : [],
      regions: Array.isArray(regions) ? regions.filter(item => !isValidItem(item)) : [],
    };
    Object.entries(invalidItems).forEach(([key, items]) => {
      if (items.length > 0) console.warn(`Invalid ${key}:`, items);
    });
  }, [filteredInstitutes, vehicleTypes, regions]);

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
    debouncedApplyFilters(); // Trigger transport filter update
  };

  const debouncedApplyFilters = useMemo(
    () =>
      debounce(() => {
        const params = new URLSearchParams({
          search: search || '',
          institute_id: institute || '',
          vehicle_type_id: vehicleType || '',
          region_id: region || '',
        });

        fetch(`/reports/transports/getTransports?${params.toString()}`)
          .then((response) => response.json())
          .then((data) => {
            console.log('Fetched filtered Transports:', data);
            setTransport(data);
          })
          .catch((error) => {
            console.error('Error fetching filtered Transports:', error);
            toast.error('Failed to fetch filtered Transports');
          });
      }, 300),
    [search, institute, vehicleType, region]
  );

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transports');

    worksheet.columns = [
      { header: 'VehicleNo', key: 'vehicle_no', width: 30 },
      { header: 'Type', key: 'vehicleType', width: 10 },
      { header: 'Institute', key: 'institute', width: 20 },
      { header: 'Region', key: 'region', width: 20 },
    ];

    transports.data.forEach((item) => {
      worksheet.addRow({
        vehicle_no: item.vehicle_no,
        vehicleType: item.vehicle_type?.name || 'N/A',
        institute: item.institute?.name || 'N/A',
        region: item.region?.name || 'N/A',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, 'Transports_Report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Transports Report', 14, 15);

    const tableColumn = ['VehicleNo', 'VehicleType', 'Institute', 'Region'];

    const tableRows = transports.data.map((item) => [
      item.vehicle_no,
      item.vehicle_type?.name || 'N/A',
      item.institute?.name || 'N/A',
      item.region?.name || 'N/A',
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10 },
    });

    doc.save('Transport_Report.pdf');
  };

  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Transports Report" />
        <div className="flex-1 p-2 md:p-2">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left Side: Search Controls */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                  <p className="text-muted-foreground text-sm">Refine your Transport search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                   {memoizedRegions.length > 0 && (<Select value={region} onValueChange={handleRegionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Regions</SelectItem>
                      {memoizedRegions.length > 0 ? (
                        memoizedRegions.map((reg) => (
                          <SelectItem key={reg.id} value={reg.id.toString()}>
                            {reg.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No regions available</div>
                      )}
                    </SelectContent>
                  </Select>
                   )}
                  <Select value={institute} onValueChange={(value) => setInstitute(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Institute" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Institutes</SelectItem>
                      {memoizedInstitutes.length > 0 ? (
                        memoizedInstitutes.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id.toString()}>
                            {inst.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No institutes available</div>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={vehicleType} onValueChange={(value) => setVehicleType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Vehicle Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Vehicle Types</SelectItem>
                      {memoizedVehicleType.length > 0 ? (
                        memoizedVehicleType.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No vehicle types available</div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={debouncedApplyFilters} className="w-full">
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Transports List */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">Transport Report</CardTitle>
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
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800 text-center">
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Vehicle No</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Type</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transports.data.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-muted-foreground text-center p-4">
                              No Transports found.
                            </td>
                          </tr>
                        ) : (
                          transports.data.map((trans) => (
                            <tr key={trans.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {trans.vehicle_no}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {trans.vehicle_type?.name || 'N/A'}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {trans.region?.name || 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {transports.links.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
                      {transports.links.map((link, i) => (
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