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
  from: string;
  to: string;
  levelfrom: string;
  levelto: number;
  status: string;
  added_date: string;
  institute?: { id: number; name?: string };
  region?: { id: number; name?: string };
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

export default function Upgradations({ upgradations: upgradationProp, institutes, regions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [upgradations, setUpgradation] = useState(upgradationProp);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);

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
    debouncedApplyFilters(); // Trigger upgradation filter update
  };

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
      { header: 'Region', key: 'region', width: 30 },
    ];

    upgradations.data.forEach((item) => {
      worksheet.addRow({
        details: item.details,
        from: item.from,
        to: item.to,
        levelfrom: item.levelfrom,
        levelto: item.levelto,
        status: item.status,
        institute: item.institute?.name || 'N/A',
        region: item.region?.name || 'N/A',
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
      'Region',
    ];

    const tableRows = upgradations.data.map((item) => [
      item.details,
      item.from,
      item.to,
      item.levelfrom,
      item.levelto,
      item.status,
      item.institute?.name || 'N/A',
      item.region?.name || 'N/A',
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
          region_id: region || '',
        });

        fetch(`/reports/upgradations/getUpgradations?${params.toString()}`)
          .then((response) => response.json())
          .then((data) => {
            console.log('Fetched filtered upgradations:', data);
            setUpgradation(data);
          })
          .catch((error) => {
            console.error('Error fetching filtered upgradations:', error);
            toast.error('Failed to fetch filtered upgradations');
          });
      }, 300),
    [search, institute, region]
  );

  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Upgradations Report" />
        <div className="flex-1 p-1 md:p-1">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left Side: Search Controls */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                  <p className="text-muted-foreground text-sm">Refine your Upgradation search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Region Filter */}
                  <Select value={region} onValueChange={handleRegionChange}>
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
                        <div className="text-muted-foreground text-sm p-1">No regions available</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={institute} onValueChange={(value) => { setInstitute(value); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Institute" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Institutes</SelectItem>
                      {memoizedInstitutes.length > 0 ? (
                        memoizedInstitutes.map((inst) => {
                          return (
                            <SelectItem key={inst.id} value={inst.id.toString()}>
                              {inst.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm p-1">No institutes available</div>
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
                    <CardTitle className="text-2xl font-bold">Upgradation Report</CardTitle>
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
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Details</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">From</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">To</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Level From</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Level To</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Status</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Institute</th>
                          <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upgradations.data.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-muted-foreground text-center p-4">
                              No upgradations found.
                            </td>
                          </tr>
                        ) : (
                          upgradations.data.map((upgradation) => (
                            <tr key={upgradation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {upgradation.details}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(upgradation.from)}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(upgradation.to)}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {upgradation.levelfrom}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {upgradation.levelto}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {upgradation.status}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {upgradation.institute?.name || 'N/A'}
                              </td>
                              <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                                {upgradation.region?.name || 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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