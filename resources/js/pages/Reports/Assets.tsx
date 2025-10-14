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
  };
  institutes: Item[];
  blocks: Item[];
  rooms: Item[];
  assetCategories: Item[];
  assets: Item[];
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

export default function Assets({  instituteAssets: instituteAssetsProp, institutes, blocks: initialBlocks, rooms: initialRooms, assetCategories, assets: initialAssets, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [block, setBlock] = useState(filters.block_id || '');
  const [room, setRoom] = useState(filters.room_id || '');
  const [assetCategory, setAssetCategory] = useState(filters.asset_category_id || '');
  const [asset, setAsset] = useState(filters.asset_id || '');
  const [blocks, setBlocks] = useState<Item[]>(initialBlocks.filter(isValidItem));
  const [rooms, setRooms] = useState<Item[]>(initialRooms.filter(isValidItem));
  const [assets, setAssets] = useState<Item[]>(initialAssets.filter(isValidItem));
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [instituteAssets, setInstituteAssets] = useState(instituteAssetsProp || []);

  // Log initial props for debugging
  useEffect(() => {
   
    const invalidItems = {
      institutes: institutes.filter(item => !isValidItem(item)),
      blocks: initialBlocks.filter(item => !isValidItem(item)),
      rooms: initialRooms.filter(item => !isValidItem(item)),
      assetCategories: assetCategories.filter(item => !isValidItem(item)),
      assets: initialAssets.filter(item => !isValidItem(item)),
    };
    Object.entries(invalidItems).forEach(([key, items]) => {
      if (items.length > 0) console.warn(`Invalid ${key}:`, items);
    });
  }, [institutes, initialBlocks, initialRooms, assetCategories, initialAssets]);

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
    { header: 'Room', key: 'room', width: 20 },
    { header: 'Asset', key: 'asset', width: 20 },
  ];

  instituteAssets.data.forEach((instAsset) => {
    worksheet.addRow({
      details: instAsset.details,
      qty: instAsset.current_qty,
      institute: instAsset.institute?.name || 'N/A',
      room: instAsset.room?.name || 'N/A',
      asset: instAsset.asset?.name || 'N/A',
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
  ];

  const tableRows = instituteAssets.data.map((instAsset) => [
    instAsset.details,
    instAsset.current_qty,
    instAsset.institute?.name || 'N/A',
    instAsset.block?.name || 'N/A',
    instAsset.room?.name || 'N/A',
    instAsset.assetCategory?.name || 'N/A',
    instAsset.asset?.name || 'N/A',
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    styles: { fontSize: 10 },
  });

  doc.save('Assets_Report.pdf');
};
  const applyFilters = () => {
    router.get(
      '/reports/assets',
      { search, institute_id: institute, block_id: block, room_id: room, asset_category_id: assetCategory, asset_id: asset },
      { preserveScroll: true }
    );
  };

  // const debouncedApplyFilters = useMemo(
  //   () =>
  //     debounce(() => {
  //       router.get(
  //         '/reports/assets',
  //         { search, institute_id: institute, block_id: block, room_id: room, asset_category_id: assetCategory, asset_id: asset },
  //         { preserveScroll: true,
          
  //          }
  //       );
  //     }, 300),
  //   [search, institute, block, room, assetCategory, asset]
  // );
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
      });

      fetch(`/reports/assets/institute-assets?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched filtered institute assets:', data);
          setInstituteAssets(data); // You'll need to add a state for this
        })
        .catch((error) => {
          console.error('Error fetching filtered assets:', error);
          toast.error('Failed to fetch filtered assets');
        });
    }, 300),
  [search, institute, block, room, assetCategory, asset]
);


  // Memoize dropdown items to prevent unnecessary re-renders
  const memoizedInstitutes = useMemo(() => institutes.filter(isValidItem), [institutes]);
  const memoizedBlocks = useMemo(() => blocks.filter(isValidItem), [blocks]);
  const memoizedRooms = useMemo(() => rooms.filter(isValidItem), [rooms]);
  const memoizedAssetCategories = useMemo(() => assetCategories.filter(isValidItem), [assetCategories]);
  const memoizedAssets = useMemo(() => assets.filter(isValidItem), [assets]);

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
                  <Select value={block} onValueChange={(value) => { setBlock(value);  }} disabled={isLoadingBlocks}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Blocks</SelectItem>
                      {isLoadingBlocks ? (
                        <div className="text-muted-foreground text-sm p-2">Loading blocks...</div>
                      ) : memoizedBlocks.length > 0 ? (
                        memoizedBlocks.map((b) => {
                          console.log('Rendering block SelectItem:', { id: b.id, value: b.id.toString(), name: b.name });
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
                          console.log('Rendering room SelectItem:', { id: r.id, value: r.id.toString(), name: r.name });
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
                  <Select value={assetCategory} onValueChange={(value) => { setAssetCategory(value);  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Asset Categories</SelectItem>
                      {memoizedAssetCategories.length > 0 ? (
                        memoizedAssetCategories.map((category) => {
                          console.log('Rendering assetCategory SelectItem:', { id: category.id, value: category.id.toString(), name: category.name });
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
                  <Select value={asset} onValueChange={(value) => { setAsset(value);  }} disabled={isLoadingAssets}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Assets</SelectItem>
                      {isLoadingAssets ? (
                        <div className="text-muted-foreground text-sm p-2">Loading assets...</div>
                      ) : memoizedAssets.length > 0 ? (
                        memoizedAssets.map((a) => {
                          console.log('Rendering asset SelectItem:', { id: a.id, value: a.id.toString(), name: a.name });
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
                    {  instituteAssets.data.length === 0 ? (
                      <p className="text-muted-foreground text-center">No assets found.</p>
                    ) : (
                      instituteAssets.data.map((instAsset) => (
                        <div
                          key={instAsset.id}
                          className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-blue-600" />
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-foreground">
                                {instAsset.details}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Qty: {instAsset.current_qty} | Institute: {instAsset.institute?.name || 'N/A'} | 
                              Room: {instAsset.room?.name || 'N/A'} | 
                                 Asset: {instAsset.asset?.name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {instituteAssets.links.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
                      {instituteAssets.links.map((link, i) => (
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