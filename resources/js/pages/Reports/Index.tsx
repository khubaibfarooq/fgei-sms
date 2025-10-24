import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { toast } from 'sonner';

interface Item {
  id: number;
  name: string;
}
interface Block {
  id: number;
  name: string;
  area: string;
  institute_id: number;
  created_at: string;
  updated_at: string;
}

interface Room {
  id: number;
  name: string;
  area: string;
  room_type_id: number;
  block_id: number;
  created_at: string;
  updated_at: string;
  block?: { id: number; name?: string };
}

interface Institute {
  id: number;
  name: string;
  hr_id: number;
  type: string;
  region_id: number;
  established_date: string;
  total_area: string;
  convered_area: string;
  video: string | null;
  img_layout: string;
  img_3d: string;
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: number;
  name: string;
  asset_category_id: number;
  details: string;
  created_at: string;
  updated_at: string;
}

interface InstituteAsset {
  id: number;
  details: string;
  institute_id: number;
  asset_id: number;
  room_id: number;
  current_qty: number;
  added_by: number;
  added_date: string;
  created_at: string;
  updated_at: string;
  institute: Institute;
  room: Room;
  asset: Asset;
}
interface Upgradations {
  id: number;
  details: string;
  from:string;
   to: string;
    levelfrom: string;
     levelto: string;
    status: string;
  }
  interface Shifts {
  id: number;
  name: string;
  building_name:string;
  building_type?: { id: number; name?: string };}
interface Props {
  institutes?: Item[];
  regions?: Item[];
  blocks?: Block[];
  shifts?:Shifts[];
  upgradations?:Upgradations[];
  instituteAssets?: InstituteAsset[];
  rooms?: Room[];
  filters?: {
    search: string;
    institute_id?: string;
    region_id?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Institutional Report', href: '/reports/institutes' },
];

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

export default function InstitutionalReportIndex({ institutes: initialInstitutes = [], regions: initialRegions = [], blocks: initialBlocks = [], instituteAssets: initialAssets = [], rooms: initialRooms = [],shifts:initialShifts=[],upgradations:initialUpgradations=[], filters: initialFilters = { search: '', institute_id: '', region_id: '' } }: Props) {
   const [search, setSearch] = useState(initialFilters.search || '');
  const [institute, setInstitute] = useState(initialFilters.institute_id || '');
  const [region, setRegion] = useState(initialFilters.region_id || '');
  const [institutes, setInstitutes] = useState<Item[]>(initialInstitutes);
  const [regions, setRegions] = useState<Item[]>(initialRegions);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [instituteAssets, setInstituteAssets] = useState<InstituteAsset[]>(initialAssets);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [shifts, setShifts] = useState<Shifts[]>(initialShifts);
  const [upgradations, setUpgradations] = useState<Upgradations[]>(initialUpgradations);



  const memoizedInstitutes = useMemo(() => institutes.filter(isValidItem), [institutes]);
  const memoizedRegions = useMemo(() => regions.filter(isValidItem), [regions]);
console.log(memoizedRegions);
  const fetchData = async (params: { search?: string; institute_id?: string; region_id?: string }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`/reports/institutes/getData?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setInstitutes(data.institutes || []);
      setBlocks(data.blocks || []);
      setInstituteAssets(data.instituteAssets || []);
      setRooms(data.rooms || []);
      setShifts(data.shifts || []);
            setUpgradations(data.upgradations || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData({ search});
  }, [search]);

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchData({ search, institute_id: institute, region_id: region });
    }
  };

  const handleInstituteChange = (value: string) => {
    setInstitute(value);
    fetchData({ search, institute_id: value, region_id: region });
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
    fetchData({ search, institute_id: institute, region_id: value });
  };


  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    // Shifts Worksheet
    const shiftsSheet = workbook.addWorksheet('Shifts');
    shiftsSheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Building Name', key: 'building_name', width: 20 },
      { header: 'Building Type', key: 'building_type', width: 20 },
    ];
    shifts.forEach((shift) => {
      shiftsSheet.addRow({
        name: shift.name,
        building_name: shift.building_name,
        building_type: shift.building_type?.name || 'N/A',
      });
    });

    // Blocks Worksheet
    const blocksSheet = workbook.addWorksheet('Blocks');
    blocksSheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Area (sq ft)', key: 'area', width: 15 },
    ];
    blocks.forEach((block) => {
      blocksSheet.addRow({
        name: block.name,
        area: block.area,
      });
    });

    // Rooms Worksheet
    const roomsSheet = workbook.addWorksheet('Rooms');
    roomsSheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Area (sq ft)', key: 'area', width: 15 },
      { header: 'Block', key: 'block', width: 20 },
    ];
    rooms.forEach((room) => {
      roomsSheet.addRow({
        name: room.name,
        area: room.area,
        block: room.block?.name || 'N/A',
      });
    });

    // Institute Assets Worksheet
    const assetsSheet = workbook.addWorksheet('Assets');
    assetsSheet.columns = [
      { header: 'Details', key: 'details', width: 30 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Institute', key: 'institute', width: 20 },
      { header: 'Room', key: 'room', width: 20 },
      { header: 'Asset', key: 'asset', width: 20 },
    ];
    instituteAssets.forEach((instAsset) => {
      assetsSheet.addRow({
        details: instAsset.details,
        qty: instAsset.current_qty,
        institute: instAsset.institute?.name || 'N/A',
        room: instAsset.room?.name || 'N/A',
        asset: instAsset.asset?.name || 'N/A',
      });
    });

    // Upgradations Worksheet
    const upgradationsSheet = workbook.addWorksheet('Upgradations');
    upgradationsSheet.columns = [
      { header: 'Details', key: 'details', width: 30 },
      { header: 'Date From', key: 'from', width: 15 },
      { header: 'Date To', key: 'to', width: 15 },
      { header: 'Level From', key: 'levelfrom', width: 15 },
      { header: 'Level To', key: 'levelto', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    upgradations.forEach((up) => {
      upgradationsSheet.addRow({
        details: up.details,
        from: up.from,
        to: up.to,
        levelfrom: up.levelfrom,
        levelto: up.levelto,
        status: up.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, 'Institutional_Report.xlsx');
  };
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Institutional Report" />
      <div className="flex-1 p-2 md:p-2">
        <Card>
          <CardHeader>
            <CardTitle>Institutional Report</CardTitle>
            <Button onClick={exportToExcel} className="w-full">
              Export Excel
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="py-3 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search institutes... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {memoizedRegions.length > 0 && (
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
                      <div className="text-muted-foreground text-sm p-2">No Regions available</div>
                    )}
                  </SelectContent>
                </Select>
              )}
              <Select value={institute} onValueChange={handleInstituteChange}>
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
            </div>
          </CardContent>
        </Card>
        
            {/* Shifts */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Shifts</h3>
              {shifts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b431b]  dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Building Name</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Building Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{shift.name}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{shift.building_name}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{shift.building_type?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No blocks available</div>
              )}
            </div>
            {/* Blocks */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Blocks</h3>
              {blocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b431b]  dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Area (sq ft)</th>
                      
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((block) => (
                        <tr key={block.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{block.name}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{block.area}</td>
                        
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No blocks available</div>
              )}
            </div>

            {/* Rooms */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Rooms</h3>
              {rooms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b431b]  dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Area (sq ft)</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Block</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{room.name}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{room.area}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{room.block?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No rooms available</div>
              )}
            </div>

            {/* Institute Assets */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Institute Assets</h3>
              {instituteAssets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b431b]  dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Asset Name</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Details</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Room</th>
                      
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Added Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instituteAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.asset.name}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.details}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.current_qty}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.room.name}</td>
                       
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.added_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No assets available</div>
              )}
            </div>
             {/* Institute Upgradations */}
            <div>
               
              <h3 className="text-lg font-semibold mb-2">Institute Upgradations</h3>
              {upgradations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b431b]  dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Details</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Date from</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Date to</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Level From</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Level To</th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upgradations.map((up) => (
                        <tr key={up.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.details}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.from}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.to}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.levelfrom}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.levelto}</td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No assets available</div>
              )}
            </div>
      </div>
    </AppLayout>
  );
}