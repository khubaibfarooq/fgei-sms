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
  { title: 'Assets', href: '/reports/assets' },
];

interface instituteAssetsProp {
  id: number;
  current_qty: number;
  details: string;
  added_date: string;
  institute?: { id: number; name?: string };
  block?: { id: number; name?: string };
  room?: { id: number; name?: string };
  assetCategory?: { id: number; name?: string };
  asset?: { id: number; name?: string };
  region?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
}

interface Props {
  instituteAssets: {
    data: instituteAssetsProp[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    institute_id?: string;
    block_id?: string;
    room_id?: string;
    asset_category_id?: string;
    asset_id?: string;
    region_id?: string;
  };
  institutes: Item[];
  blocks: Item[];
  rooms: Item[];
  assetCategories: Item[];
  assets: Item[];
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

export default function Assets({ instituteAssets: instituteAssetsProp, institutes, blocks: initialBlocks, rooms: initialRooms, assetCategories, assets: initialAssets, regions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [block, setBlock] = useState(filters.block_id || '');
  const [room, setRoom] = useState(filters.room_id || '');
  const [assetCategory, setAssetCategory] = useState(filters.asset_category_id || '');
  const [asset, setAsset] = useState(filters.asset_id || '');
  const [region, setRegion] = useState(filters.region_id || '');
  const [blocks, setBlocks] = useState<Item[]>(initialBlocks.filter(isValidItem));
  const [rooms, setRooms] = useState<Item[]>(initialRooms.filter(isValidItem));
  const [assets, setAssets] = useState<Item[]>(initialAssets.filter(isValidItem));
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [instituteAssets, setInstituteAssets] = useState(instituteAssetsProp);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);

  // Fetch institutes based on region selection
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
    //debouncedApplyFilters(); // Trigger asset filter update
  };

  // Log initial props for debugging
  useEffect(() => {
    const invalidItems = {
      institutes: Array.isArray(filteredInstitutes) ? filteredInstitutes.filter(item => !isValidItem(item)) : [],
      blocks: initialBlocks.filter(item => !isValidItem(item)),
      rooms: initialRooms.filter(item => !isValidItem(item)),
      assetCategories: assetCategories.filter(item => !isValidItem(item)),
      assets: initialAssets.filter(item => !isValidItem(item)),
      regions: regions.filter(item => !isValidItem(item)),
    };
    Object.entries(invalidItems).forEach(([key, items]) => {
      if (items.length > 0) console.warn(`Invalid ${key}:`, items);
    });
  }, [institutes, initialBlocks, initialRooms, assetCategories, initialAssets, regions, filteredInstitutes]);

  useEffect(() => {
    if (institute) {
      setIsLoadingBlocks(true);
      fetch(`/reports/blocks?institute_id=${institute}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched blocks:', data);
          if (Array.isArray(data)) {
            const validBlocks = data.filter(isValidItem);
            if (validBlocks.length < data.length) {
              console.warn('Filtered out invalid blocks:', data.filter(item => !isValidItem(item)));
            }
            setBlocks(validBlocks);
          } else {
            console.warn('Blocks response is not an array:', data);
            toast.error('Invalid blocks data received');
            setBlocks([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching blocks:', error);
          toast.error('Failed to fetch blocks');
          setBlocks([]);
        })
        .finally(() => setIsLoadingBlocks(false));
      setBlock('');
      setRooms([]);
      setRoom('');
    } else {
      setBlocks([]);
      setRooms([]);
      setRoom('');
    }
  }, [institute]);

  useEffect(() => {
    if (block) {
      setIsLoadingRooms(true);
      fetch(`/reports/rooms?block_id=${block}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched rooms:', data);
          if (Array.isArray(data)) {
            const validRooms = data.filter(isValidItem);
            if (validRooms.length < data.length) {
              console.warn('Filtered out invalid rooms:', data.filter(item => !isValidItem(item)));
            }
            setRooms(validRooms);
          } else {
            console.warn('Rooms response is not an array:', data);
            toast.error('Invalid rooms data received');
            setRooms([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching rooms:', error);
          toast.error('Failed to fetch rooms');
          setRooms([]);
        })
        .finally(() => setIsLoadingRooms(false));
      setRoom('');
    } else {
      setRooms([]);
      setRoom('');
    }
  }, [block]);

  useEffect(() => {
    if (assetCategory) {
      setIsLoadingAssets(true);
      fetch(`/reports/assets/list?asset_category_id=${assetCategory}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched assets:', data);
          if (Array.isArray(data)) {
            const validAssets = data.filter(isValidItem);
            if (validAssets.length < data.length) {
              console.warn('Filtered out invalid assets:', data.filter(item => !isValidItem(item)));
            }
            setAssets(validAssets);
          } else {
            console.warn('Assets response is not an array:', data);
            toast.error('Invalid assets data received');
            setAssets([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching assets:', error);
          toast.error('Failed to fetch assets');
          setAssets([]);
        })
        .finally(() => setIsLoadingAssets(false));
      setAsset('');
    } else {
      setAssets([]);
      setAsset('');
    }
  }, [assetCategory]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assets');

    worksheet.columns = [
      { header: 'Details', key: 'details', width: 30 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Institute', key: 'institute', width: 20 },
      { header: 'Block', key: 'block', width: 20 },
      { header: 'Room', key: 'room', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Asset', key: 'asset', width: 20 },
      { header: 'Region', key: 'region', width: 20 },
    ];

    instituteAssets.data.forEach((instAsset) => {
      worksheet.addRow({
        details: instAsset.details,
        qty: instAsset.current_qty,
        institute: instAsset.institute?.name || 'N/A',
        block: instAsset.block?.name || 'N/A',
        room: instAsset.room?.name || 'N/A',
        category: instAsset.assetCategory?.name || 'N/A',
        asset: instAsset.asset?.name || 'N/A',
        region: instAsset.region?.name || 'N/A',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, 'Assets_Report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Assets Report', 14, 15);

    const tableColumn = [
      'Details',
      'Qty',
      'Institute',
      'Block',
      'Room',
      'Category',
      'Asset',
      'Region',
    ];

    const tableRows = instituteAssets.data.map((instAsset) => [
      instAsset.details,
      instAsset.current_qty,
      instAsset.institute?.name || 'N/A',
      instAsset.block?.name || 'N/A',
      instAsset.room?.name || 'N/A',
      instAsset.assetCategory?.name || 'N/A',
      instAsset.asset?.name || 'N/A',
      instAsset.region?.name || 'N/A',
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10 },
    });

    doc.save('Assets_Report.pdf');
  };

  const debouncedApplyFilters = useMemo(
    () =>
      debounce(() => {
        const params = new URLSearchParams({
          search: search || '',
          institute_id: institute || '',
          block_id: block || '',
          room_id: room || '',
          asset_category_id: assetCategory || '',
          asset_id: asset || '',
          region_id: region || '',
        });

        fetch(`/reports/assets/institute-assets?${params.toString()}`)
          .then((response) => response.json())
          .then((data) => {
            console.log('Fetched filtered institute assets:', data);
            setInstituteAssets(data);
          })
          .catch((error) => {
            console.error('Error fetching filtered assets:', error);
            toast.error('Failed to fetch filtered assets');
          });
      }, 300),
    [search, institute, block, room, assetCategory, asset, region]
  );

  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => {
    if (!Array.isArray(filteredInstitutes)) {
      console.warn('filteredInstitutes is not an array or is null:', filteredInstitutes);
      return [];
    }
    return filteredInstitutes.filter(isValidItem);
  }, [filteredInstitutes]);

  const memoizedBlocks = useMemo(() => blocks.filter(isValidItem), [blocks]);
  const memoizedRooms = useMemo(() => rooms.filter(isValidItem), [rooms]);
  const memoizedAssetCategories = useMemo(() => assetCategories.filter(isValidItem), [assetCategories]);
  const memoizedAssets = useMemo(() => assets.filter(isValidItem), [assets]);
  const memoizedRegions = useMemo(() => regions.filter(isValidItem), [regions]);

  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Assets Report" />
        <div className="flex-1 p-2 md:p-2">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left Side: Search Controls */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                  <p className="text-muted-foreground text-sm">Refine your assets search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Region Filter - Added based on Transport.tsx */}
                  {memoizedRegions.length > 0 && ( <Select value={region} onValueChange={handleRegionChange}>
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
                        <div className="text-muted-foreground text-sm p-2">No institutes available</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={block} onValueChange={(value) => { setBlock(value); }} disabled={isLoadingBlocks}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Blocks</SelectItem>
                      {isLoadingBlocks ? (
                        <div className="text-muted-foreground text-sm p-2">Loading blocks...</div>
                      ) : memoizedBlocks.length > 0 ? (
                        memoizedBlocks.map((b) => {
                          return (
                            <SelectItem key={b.id} value={b.id.toString()}>
                              {b.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No blocks available</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={room} onValueChange={(value) => { setRoom(value); }} disabled={isLoadingRooms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Rooms</SelectItem>
                      {isLoadingRooms ? (
                        <div className="text-muted-foreground text-sm p-2">Loading rooms...</div>
                      ) : memoizedRooms.length > 0 ? (
                        memoizedRooms.map((r) => {
                          return (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No rooms available</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={assetCategory} onValueChange={(value) => { setAssetCategory(value); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Asset Categories</SelectItem>
                      {memoizedAssetCategories.length > 0 ? (
                        memoizedAssetCategories.map((category) => {
                          return (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No asset categories available</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={asset} onValueChange={(value) => { setAsset(value); }} disabled={isLoadingAssets}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Assets</SelectItem>
                      {isLoadingAssets ? (
                        <div className="text-muted-foreground text-sm p-2">Loading assets...</div>
                      ) : memoizedAssets.length > 0 ? (
                        memoizedAssets.map((a) => {
                          return (
                            <SelectItem key={a.id} value={a.id.toString()}>
                              {a.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">No assets available</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Button onClick={debouncedApplyFilters} className="w-full">
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Assets List */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">Assets Report</CardTitle>
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
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-primary dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Asset</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Room</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instituteAssets.data?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border p-2 text-center text-sm text-gray-900 dark:text-gray-100">
                            No assets found.
                          </td>
                        </tr>
                      ) : (
                        instituteAssets.data?.map((instAsset) => (
                          <tr key={instAsset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex items-center gap-3">
                                <Building className="h-5 w-5 text-blue-600" />
                                <div className="space-y-1">
                                  <div className="font-medium">{instAsset.asset?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                              {instAsset.current_qty}
                            </td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                              {instAsset.room?.name || 'N/A'}
                            </td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                              {instAsset.details || 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {instituteAssets.links?.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
                      {instituteAssets.links.map((link, i) => (
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
                                  setInstituteAssets(data);
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}