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
import { ImagePreview } from '@/components/ui/image-preview';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Blocks', href: '/reports/blocks' },
];

interface BlockProp {
  id: number;
  name: string;
  establish_date: string;
  img: string;
  area: string;
  institute?: { id: number; name?: string };
  block_type?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
}

interface Props {
  blocks: {
    data: BlockProp[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    institute_id?: string;
    blocktype_id?: string;
    region_id?: string;
  };
  institutes: Item[];
  blocktypes: Item[];
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

export default function Blocks({ blocks: blocksProp, institutes, blocktypes, regions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [blocktype, setBlocktype] = useState(filters.blocktype_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [blocks, setBlocks] = useState(blocksProp);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);
  const [allBlocksForExport, setAllBlocksForExport] = useState<BlockProp[]>([]);

  // Fetch institutes based on region selection
  const fetchInstitutes = async (regionId: string) => {
    try {
      const params = new URLSearchParams({ region_id: regionId || '' }).toString();
      const response = await fetch(`/reports/getInstitutes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch institutes');
      }
      const data: Item[] = await response.json();
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
  };

  // Fetch all blocks for export (without pagination)
  const fetchAllBlocksForExport = async (): Promise<BlockProp[]> => {
    try {
      const params = new URLSearchParams({
        search: search || '',
        institute_id: institute || '',
        blocktype_id: blocktype || '',
        region_id: region || '',
        all: 'true' // Add parameter to indicate we want all data
      });

      const response = await fetch(`/reports/blocks/getBlocks?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch all blocks for export');
      }
      const data: BlockProp[] = await response.json();
      setAllBlocksForExport(data);
      return data;
    } catch (error) {
      console.error('Error fetching all blocks for export:', error);
      toast.error('Failed to fetch blocks for export');
      return [];
    }
  };

  // Log initial props for debugging
  useEffect(() => {
    const invalidItems = {
      institutes: Array.isArray(filteredInstitutes) ? filteredInstitutes.filter(item => !isValidItem(item)) : [],
      blocktypes: blocktypes.filter(item => !isValidItem(item)),
      regions: regions.filter(item => !isValidItem(item)),
    };
    Object.entries(invalidItems).forEach(([key, items]) => {
      if (items.length > 0) console.warn(`Invalid ${key}:`, items);
    });
  }, [institutes, blocktypes, regions, filteredInstitutes]);

  const exportToExcel = async () => {
    try {
      const allBlocks = await fetchAllBlocksForExport();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Blocks');

      const instituteName =
        allBlocks.length > 0 && allBlocks[0].institute?.name
          ? allBlocks[0].institute.name
          : 'All Institutes';

      // Header
      worksheet.mergeCells('A1:C1');
      const instituteCell = worksheet.getCell('A1');
      instituteCell.value = `Institute: ${instituteName}`;
      instituteCell.font = { size: 16, bold: true };
      instituteCell.alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:C2');
      const titleCell = worksheet.getCell('A2');
      titleCell.value = 'Blocks Report';
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      worksheet.addRow([]); // spacing

      // Headers
      const headers = ['Block Name', 'Block Type', 'Institute'];
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF428BCA' },
      };
      headerRow.alignment = { horizontal: 'center' };

      // Data
      allBlocks.forEach((block: any) => {
        worksheet.addRow([
          block.name || '—',
          block.block_type?.name || 'N/A',
          block.institute?.name || 'N/A',
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) maxLength = length;
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      FileSaver.saveAs(blob, 'Blocks_Report.xlsx');
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  const exportToPDF = async () => {
    try {
      const allBlocks = await fetchAllBlocksForExport();

      const doc = new jsPDF();

      // Get institute name from first block (if available) or use default
      const instituteName =
        allBlocks.length > 0 && allBlocks[0].institute?.name
          ? allBlocks[0].institute.name
          : 'All Institutes';

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Institute: ${instituteName}`, 14, 15);

      doc.setFontSize(14);
      doc.text('Blocks Report', 14, 25);

      // Table columns
      const tableColumn = ['Block Name', 'Block Type', 'Institute'];

      // Table rows
      const tableRows = allBlocks.map((block: any) => [
        block.name || '—',
        block.block_type?.name || 'N/A',
        block.institute?.name || 'N/A',
      ]);

      // Generate table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
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

      doc.save('Blocks_Report.pdf');
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const debouncedApplyFilters = useMemo(
    () =>
      debounce(() => {
        const params = new URLSearchParams({
          search: search || '',
          institute_id: institute || '',
          blocktype_id: blocktype || '',
          region_id: region || '',
        });

        fetch(`/reports/blocks/getBlocks?${params.toString()}`)
          .then((response) => response.json())
          .then((data) => {
            console.log('Fetched filtered blocks:', data);
            setBlocks(data);
          })
          .catch((error) => {
            console.error('Error fetching filtered blocks:', error);
            toast.error('Failed to fetch filtered blocks');
          });
      }, 300),
    [search, institute, blocktype, region]
  );

  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => {
    if (!Array.isArray(filteredInstitutes)) {
      console.warn('filteredInstitutes is not an array or is null:', filteredInstitutes);
      return [];
    }
    return filteredInstitutes.filter(isValidItem);
  }, [filteredInstitutes]);

  const memoizedBlocktypes = useMemo(() => blocktypes.filter(isValidItem), [blocktypes]);
  const memoizedRegions = useMemo(() => regions.filter(isValidItem), [regions]);

  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Blocks Report" />
        <div className="flex-1 p-2 md:p-2">
          <Card className="w-full">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl font-bold">Blocks Report</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-6 pt-6">
              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Region Filter */}
                {memoizedRegions.length > 0 && (
                  <Combobox
                    entity="region"
                    value={region}
                    onChange={(value) => handleRegionChange(value)}
                    options={memoizedRegions.map((reg) => ({
                      id: reg.id.toString(),
                      name: reg.name.split(' ').pop() || reg.name,
                    }))}
                    includeAllOption={true}
                  />
                )}

                {/* Institute Filter */}
                <Combobox
                  entity="institute"
                  value={institute}
                  onChange={(value) => setInstitute(value)}
                  options={memoizedInstitutes.map((inst) => ({
                    id: inst.id.toString(),
                    name: inst.name,
                  }))}
                  includeAllOption={true}
                />

                {/* Block Type Filter */}
                <Combobox
                  entity="blocktype"
                  value={blocktype}
                  onChange={(value) => setBlocktype(value)}
                  options={memoizedBlocktypes.map((type) => ({
                    id: type.id.toString(),
                    name: type.name,
                  }))}
                  includeAllOption={true}
                />


                {/* Search Input */}
                <Input
                  type="text"
                  placeholder="Search blocks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Buttons Row */}
              <div className="flex flex-col md:flex-row gap-2 justify-end">
                <Button onClick={debouncedApplyFilters} className="w-full md:w-auto">
                  Apply Filters
                </Button>
                <Button onClick={exportToPDF} className="w-full md:w-auto">
                  Export PDF
                </Button>
                <Button onClick={exportToExcel} className="w-full md:w-auto">
                  Export Excel
                </Button>
              </div>

              {/* Table Section */}
              <div className="space-y-3">
                <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-primary dark:bg-gray-800">
                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                        Block Name
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                        Block Type
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                        Area
                      </th>

                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                        Establish Date
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                        Institute
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.data?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border p-2 text-center text-sm text-gray-900 dark:text-gray-100">
                          No blocks found.
                        </td>
                      </tr>
                    ) : (
                      blocks.data?.map((block: BlockProp) => (
                        <tr key={block.id} className="hover:bg-primary/10 dark:hover:bg-gray-700">
                          <td className="border p-2 text-left font-bold dark:text-gray-100">
                            <div className='flex flex-row gap-2 align-middle'> <ImagePreview dataImg={block.img} size="h-20 w-20 object-contain" />  <span className='font-bold'>{block.name}</span></div>
                          </td>
                          <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                            {block.block_type?.name || '—'}
                          </td>
                          <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                            {block.area || '—'}
                          </td>
                          <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                            {block.establish_date || '—'}
                          </td>
                          <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                            {block.institute?.name || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {blocks.links?.length > 1 && (
                  <div className="flex justify-center pt-6 flex-wrap gap-2">
                    {blocks.links.map((link, i) => (
                      <Button
                        key={i}
                        disabled={!link.url}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (link.url) {
                            fetch(link.url)
                              .then((response) => response.json())
                              .then((data) => {
                                setBlocks(data);
                              })
                              .catch((error) => {
                                console.error('Error:', error);
                              });
                          }
                        }}
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
      </AppLayout>
    </ErrorBoundary>
  );
}