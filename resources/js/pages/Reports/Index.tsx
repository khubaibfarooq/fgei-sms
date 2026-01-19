import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { ImagePreview } from '@/components/ui/image-preview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Combobox from '@/components/ui//combobox';
import { formatDate } from '@/utils/dateFormatter';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FundsTran from '../funds/FundsTran';
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
  img: string | null
  establish_date?: string;

}

interface Room {
  id: number;
  name: string;
  area: string;
  room_type_id: number;
  block_id: number;
  created_at: string;
  updated_at: string;
  img: string | null;
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

interface Project {

  completed: string;
  inprogress: string;
  planned: string;
  name: string;
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
  name: string;
  institute_id: number;
  asset_id: number;
  total_qty: number;
  locations_count: number;
  institute: Institute;
  asset: Asset;
}
interface Upgradations {
  id: number;
  details: string;
  from: string;
  to: string;
  levelfrom: string;
  levelto: string;
  status: string;
}
interface Funds {
  id: number;
  fund_head: { id: number; name?: string };
  balance: number;
}
interface Transport {
  id: number;
  vehicle_no: string;
  vehicle_type?: { id: number; name?: string };
}
interface Shifts {
  id: number;
  name: string;
  building_name: string;
  building_type?: { id: number; name?: string };
}
interface Props {
  institutes?: Item[];
  regions?: Item[];
  blocks?: Block[];
  shifts?: Shifts[];
  upgradations?: Upgradations[];
  funds?: Funds[];
  projects?: Project[];
  institute?: Institute | null;
  instituteAssets?: InstituteAsset[];
  rooms?: Room[];
  transports?: Transport[];
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

export default function InstitutionalReportIndex({ institute: initialInstitute = null, institutes: initialInstitutes = [], regions: initialRegions = [], blocks: initialBlocks = [], instituteAssets: initialAssets = [], rooms: initialRooms = [], shifts: initialShifts = [], upgradations: initialUpgradations = [], funds: initialFunds = [], projects: initialProjects = [], transports: initialTransports = [], filters: initialFilters = { search: '', institute_id: '', region_id: '' } }: Props) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [institute, setInstitute] = useState(initialFilters.institute_id || '');
  const [fetchedinstitute, setFetchedInstitute] = useState<Institute | null>(initialInstitute);
  console.log("fetchedinstitute", fetchedinstitute);
  const [region, setRegion] = useState(initialFilters.region_id || '');
  const [institutes, setInstitutes] = useState<Item[]>(initialInstitutes);
  const [regions, setRegions] = useState<Item[]>(initialRegions);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [instituteAssets, setInstituteAssets] = useState<InstituteAsset[]>(initialAssets);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [shifts, setShifts] = useState<Shifts[]>(initialShifts);
  const [upgradations, setUpgradations] = useState<Upgradations[]>(initialUpgradations);
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [upgradationsOpen, setUpgradationsOpen] = useState(false);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [funds, setFunds] = useState<Funds[]>(initialFunds);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [transports, setTransports] = useState<Transport[]>(initialTransports);
  const [transportsOpen, setTransportsOpen] = useState(false);
  const formatBalance = (amount: any): string => {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, '')) || 0;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)} Mn`;
    }
    return new Intl.NumberFormat('ur-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

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
      setFetchedInstitute(data.institute || []);
      console.log(fetchedinstitute)
      setBlocks(data.blocks || []);
      setInstituteAssets(data.instituteAssets || []);
      console.log(data.instituteAssets);
      setRooms(data.rooms || []);
      setShifts(data.shifts || []);
      setUpgradations(data.upgradations || []);
      setFunds(data.funds || []);
      console.log(data.projects);
      setProjects(data.projects || []);
      setTransports(data.transports || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };



  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchData({ search, institute_id: institute, region_id: region });
    }
  };

  const handleInstituteChange = (value: string) => {
    setInstitute(value);
    fetchData({ search, institute_id: value, region_id: region });
  };
  const fetchInstitutes = async (regionId: string) => {
    try {
      const params = new URLSearchParams({ region_id: regionId || '' }).toString();
      const response = await fetch(`/reports/getInstitutes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch institutes');
      }
      const data = await response.json();
      console.log('Fetched institutes:', data);
      setInstitutes(data);
      // Reset institute if the selected institute is not in the new list
      if (institute && regionId !== '0' && !data.some((inst: Item) => inst.id.toString() === institute)) {
        setInstitute('');
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to load institutes');
      setInstitutes([]);
    }
  };
  const handleRegionChange = async (value: string) => {
    setRegion(value);
    fetchInstitutes(value);
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
      { header: 'Asset', key: 'asset', width: 20 },
      { header: 'Quantity', key: 'qty', width: 10 },

      { header: 'Rooms', key: 'locations', width: 20 },

    ];
    instituteAssets.forEach((instAsset) => {
      assetsSheet.addRow({
        asset: instAsset.asset?.name || 'N/A',

        qty: instAsset.total_qty,
        locations: instAsset.locations_count,
      });
    });

    // Upgradations Worksheet
    const fundsSheet = workbook.addWorksheet('Funds');
    fundsSheet.columns = [
      { header: 'Fund Head', key: 'Fundhead', width: 30 },
      { header: 'Balance', key: 'balance', width: 15 },

    ];
    funds.forEach((f) => {
      fundsSheet.addRow({
        Fundhead: f.fund_head?.name,
        balance: f.balance,

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
    // Projectd Worksheet
    const projectsSheet = workbook.addWorksheet('Projects');
    projectsSheet.columns = [
      { header: 'Project Type', key: 'projecttype', width: 30 },
      { header: 'Completed', key: 'completed', width: 15 },
      { header: 'In  Progress', key: 'inprogress', width: 15 },
      { header: 'Planned', key: 'planned', width: 15 },

    ];
    projects.forEach((p) => {
      projectsSheet.addRow({
        projecttype: p.name,
        completed: p.completed,
        inprogress: p.inprogress,
        planned: p.planned,

      });
    });
    // Transports Worksheet
    const transportsSheet = workbook.addWorksheet('Transports');
    transportsSheet.columns = [
      { header: 'Vehicle No', key: 'vehicle_no', width: 20 },
      { header: 'Vehicle Type', key: 'vehicle_type', width: 20 },
    ];
    transports.forEach((t) => {
      transportsSheet.addRow({
        vehicle_no: t.vehicle_no,
        vehicle_type: t.vehicle_type?.name || 'N/A',
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, 'Institutional_Report.xlsx');
  };
  const exportToPDF = async () => {
    const doc = new jsPDF();
    let startY = 20; // Initial Y position

    // Helper function to add a section to PDF
    const addSectionToPDF = (title: string, columns: string[], data: any[]) => {
      // Add section title
      doc.setFontSize(14);
      doc.text(title, 14, startY);

      // Add table
      autoTable(doc, {
        head: [columns],
        body: data,
        startY: startY + 3,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 67, 27] }, // Dark green header
      });

      // Update startY for next section
      startY = (doc as any).lastAutoTable.finalY + 8;

      // Add new page if needed for next section
      if (startY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        startY = 20;
      }
    };

    // Helper function to load image
    const loadImage = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
          } else {
            reject(new Error('Canvas context not available'));
          }
        };
        img.onerror = (e) => reject(e);
      });
    };

    // Helper to add a single full-width image
    const addSingleImage = async (title: string, imgUrl: string) => {
      try {
        if (startY > doc.internal.pageSize.height - 60) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(16);
        doc.text(title, 14, startY);
        startY += 10;

        const imgData = await loadImage(`/assets/${imgUrl}`);
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 28;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (startY + pdfHeight > doc.internal.pageSize.height - 20) {
          doc.addPage();
          startY = 20;
          doc.setFontSize(16);
          doc.text(title, 14, startY);
          startY += 10;
        }

        doc.addImage(imgData, 'JPEG', 14, startY, pdfWidth, pdfHeight);
        startY += pdfHeight + 10;
      } catch (error) {
        console.error(`Failed to load image for ${title}:`, error);
      }
    };

    // Helper to add grid of images
    const addGridSection = async (title: string, items: any[]) => {
      // Filter items that have images
      const itemsWithImages = items.filter(item => item.img);

      if (itemsWithImages.length === 0) return;

      // Add section title
      if (startY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        startY = 20;
      }
      doc.setFontSize(16);
      doc.text(title, 14, startY);
      startY += 10;

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const gap = 5;
      const colWidth = (pageWidth - (margin * 2) - (gap * 2)) / 3;

      for (let i = 0; i < itemsWithImages.length; i += 3) {
        const rowItems = itemsWithImages.slice(i, i + 3);
        let maxRowHeight = 0;
        const rowData: { imgData: string | null, height: number, name: string }[] = [];

        // Pre-load images and calculate heights for the row
        for (const item of rowItems) {
          let imgData = null;
          let imgHeight = 0;

          try {
            imgData = await loadImage(`/assets/${item.img}`);
            const imgProps = doc.getImageProperties(imgData);
            imgHeight = (imgProps.height * colWidth) / imgProps.width;
          } catch (error) {
            console.error(`Failed to load image for ${item.name}:`, error);
          }

          // Add space for text
          const textHeight = 10;
          const totalHeight = imgHeight + textHeight;
          if (totalHeight > maxRowHeight) maxRowHeight = totalHeight;

          rowData.push({ imgData, height: imgHeight, name: item.name });
        }

        // Check page break
        if (startY + maxRowHeight > doc.internal.pageSize.height - 20) {
          doc.addPage();
          startY = 20;
        }

        // Render row
        rowData.forEach((data, index) => {
          const xPos = margin + (index * (colWidth + gap));

          // Render Name
          doc.setFontSize(10);
          // Split text to fit column width
          const splitTitle = doc.splitTextToSize(data.name, colWidth);
          doc.text(splitTitle, xPos, startY + 5);

          // Render Image
          if (data.imgData) {
            doc.addImage(data.imgData, 'JPEG', xPos, startY + 10, colWidth, data.height);
          }
        });

        startY += maxRowHeight + 10;
      }
      // Add extra spacing after section
      startY += 10;
    };


    // Start with main title
    doc.setFontSize(16);
    doc.text('Institutional Report', 14, 15);
    startY = 25; // Set initial position after title

    // Shifts Section
    if (shifts.length > 0) {
      const shiftsColumns = ['Name', 'Building Name', 'Building Type'];
      const shiftsData = shifts.map(shift => [
        shift.name,
        shift.building_name,
        shift.building_type?.name || 'N/A'
      ]);
      addSectionToPDF('Shifts', shiftsColumns, shiftsData);
    }

    // Blocks Section
    if (blocks.length > 0) {
      const blocksColumns = ['Name', 'Area (sq ft)'];
      const blocksData = blocks.map(block => [
        block.name,
        block.area
      ]);
      addSectionToPDF('Blocks', blocksColumns, blocksData);
    }

    // Rooms Section
    if (rooms.length > 0) {
      const roomsColumns = ['Name', 'Area (sq ft)', 'Block'];
      const roomsData = rooms.map(room => [
        room.name,
        room.area,
        room.block?.name || 'N/A'
      ]);
      addSectionToPDF('Rooms', roomsColumns, roomsData);
    }

    // Institute Assets Section
    if (instituteAssets.length > 0) {
      const assetsColumns = ['Asset Name', 'Quantity', 'Rooms'];
      const assetsData = instituteAssets.map(asset => [
        asset.name,
        asset.total_qty.toString(),
        asset.locations_count.toString(),
      ]);
      addSectionToPDF('Institute Assets', assetsColumns, assetsData);
    }
    // Funds Section
    if (funds.length > 0) {
      const fundsColumns = ['Fund Head', 'Balance'];
      const fundsData = funds.map(f => [
        f.fund_head?.name,
        f.balance,

      ]); addSectionToPDF('Institute Funds', fundsColumns, fundsData);
    }
    // Upgradations Section
    if (upgradations.length > 0) {
      const upgradationsColumns = ['Details', 'Date From', 'Date To', 'Level From', 'Level To', 'Status'];
      const upgradationsData = upgradations.map(up => [
        up.details,
        up.from,
        up.to,
        up.levelfrom,
        up.levelto,
        up.status
      ]);
      addSectionToPDF('Institute Upgradations', upgradationsColumns, upgradationsData);
    }
    // Projects Section
    if (projects.length > 0) {
      const projectsColumns = ['Project Type', 'Completed', 'In Progress', 'Planned'];
      const projectsData = projects.map(p => [
        p.name,
        p.completed,
        p.inprogress,
        p.planned

      ]); addSectionToPDF('Institute Projects', projectsColumns, projectsData);
    }
    // Transports Section
    if (transports.length > 0) {
      const transportsColumns = ['Vehicle No', 'Vehicle Type'];
      const transportsData = transports.map(t => [
        t.vehicle_no,
        t.vehicle_type?.name || 'N/A'
      ]);
      addSectionToPDF('Institute Transports', transportsColumns, transportsData);
    }

    // Institute Layout Image
    if (fetchedinstitute?.img_layout) {
      await addSingleImage('Institute Layout', fetchedinstitute.img_layout);
    }

    // Institute 3D Image
    if (fetchedinstitute?.img_3d) {
      await addSingleImage('Institute Front View', fetchedinstitute.img_3d);
    }

    // Blocks Images Section
    await addGridSection('Blocks Images', blocks);

    // Rooms Images Section
    await addGridSection('Rooms Images', rooms);

    doc.save('Institutional_Report.pdf');
  };
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Institutional Report" />
      <div className="flex-1 p-3 ">
        <Card >
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>          <CardTitle>Institutional Report</CardTitle></div>


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
          <CardContent className="py-3 space-y-2">

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {memoizedRegions.length > 0 && (

                <Combobox
                  entity="region"
                  value={region}
                  onChange={(value) => handleRegionChange(value)}
                  options={memoizedRegions.map((reg) => ({
                    id: reg.id.toString(), // Convert ID to string to match prop type
                    name: reg.name.split(' ').pop() || reg.name,

                  }))}
                  includeAllOption={true}

                />

                // <Select value={region} onValueChange={handleRegionChange}>
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
                //       <div className="text-muted-foreground text-sm p-2">No Regions available</div>
                //     )}
                //   </SelectContent>
                // </Select>
              )}
              <Combobox
                entity="institute"
                value={institute}
                onChange={(value) => handleInstituteChange(value)}
                options={memoizedInstitutes.map((inst) => ({
                  id: inst.id.toString(), // Convert ID to string to match prop type
                  name: inst.name,
                }))}
                includeAllOption={true}

              />
              {/* <Select value={institute} onValueChange={handleInstituteChange}>
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
              </Select> */}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Layout image view */}
          <div className="space-y-2">
            <Label>Current Layout Image</Label>
            {fetchedinstitute?.img_layout ? (
              <ImagePreview dataImg={`${fetchedinstitute.img_layout}`} className="w-full h-48 object-cover rounded" />


            ) : (
              <p className="text-sm text-muted-foreground">No layout image uploaded.</p>
            )}

          </div>

          {/* 3D image view */}
          <div className="space-y-2">
            <Label>Current Front View Image</Label>
            {fetchedinstitute?.img_3d ? (
              <ImagePreview dataImg={`${fetchedinstitute.img_3d}`} className="w-full h-48 object-cover rounded" />

            ) : (
              <p className="text-sm text-muted-foreground">No Font View image uploaded.</p>
            )}

          </div>

          {/* Video view */}
          <div className="space-y-2">
            <Label>Current Video</Label>
            {fetchedinstitute?.video ? (
              <video controls className="w-full h-48 rounded">
                <source src={`/assets/${fetchedinstitute.video}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <p className="text-sm text-muted-foreground">No video uploaded.</p>
            )}

          </div>
        </div>
        {/* Shifts */}
        <div className="grid grid-cols-1 md:grid-cols-2 my-2 gap-6">
          <div className="border rounded-lg  border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 

  "
              onClick={() => setShiftsOpen(!shiftsOpen)}
            >
              <h3 className="text-lg font-semibold">Shifts({shifts.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${shiftsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {shiftsOpen && (
              <div className="p-4 border-t">
                {shifts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Building Name</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Building Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift) => (
                          <tr key={shift.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{shift.name}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{shift.building_name}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{shift.building_type?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No shifts available</div>
                )}
              </div>
            )}
          </div>
          {/* Blocks */}
          <div className="border rounded-lg border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setBlocksOpen(!blocksOpen)}
            >
              <h3 className="text-lg font-semibold">Blocks({blocks.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${blocksOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {blocksOpen && (
              <div className="p-4 border-t">
                {blocks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Area (sq ft)</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Establish Date</th>

                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((block) => (
                          <tr key={block.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">  <div className='flex flex-column gap-2 align-middle'> <ImagePreview dataImg={block.img} size="h-20 w-20 object-contain" />  <span className='font-bold'>{block.name}</span></div> </td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{block.area}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(block.establish_date)}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No blocks available</div>
                )}
              </div>
            )}
          </div>

        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 my-2  gap-6">

          {/* Rooms */}
          <div className="border rounded-lg  border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setRoomsOpen(!roomsOpen)}
            >
              <h3 className="text-lg font-semibold">Rooms({rooms.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${roomsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {roomsOpen && (
              <div className="p-4 border-t">
                {rooms.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Block</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Name</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Area (sq ft)</th>

                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((room) => (
                          <tr key={room.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{room.block?.name}</td>

                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100"><div className='flex flex-column gap-2 align-middle'> <ImagePreview dataImg={room.img} size="h-20 w-20 object-contain" />  <span className='font-bold'>{room.name}</span></div></td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{room.area}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No rooms available</div>
                )}
              </div>
            )}
          </div>

          {/* Institute Assets */}
          <div className="border rounded-lg  border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setAssetsOpen(!assetsOpen)}
            >
              <h3 className="text-lg font-semibold">Institute Assets({instituteAssets.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${assetsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {assetsOpen && (
              <div className="p-4 border-t">
                {instituteAssets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Asset Name</th>

                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Total Quantity</th>

                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Rooms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instituteAssets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 font-bold dark:text-gray-100">{asset.name}</td>

                            <td className="border p-2 text-sm text-green-700 font-bold dark:text-gray-100">{asset.total_qty}</td>

                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{asset.locations_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No assets available</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 my-2  md:grid-cols-2 gap-6">
          {/* Institute Upgradations */}
          <div className="border rounded-lg  border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setUpgradationsOpen(!upgradationsOpen)}
            >
              <h3 className="text-lg font-semibold">Institute Upgradations({upgradations.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${upgradationsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {upgradationsOpen && (
              <div className="p-4 border-t">
                {upgradations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
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
                          <tr key={up.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.details}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(up.from)}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(up.to)}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.levelfrom}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.levelto}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{up.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No upgradations available</div>
                )}
              </div>
            )}
          </div>
          {/* Institute Projects */}
          <div className="border rounded-lg border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setProjectsOpen(!projectsOpen)}
            >
              <h3 className="text-lg font-semibold">Institute Projects({projects.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${projectsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {projectsOpen && (
              <div className="p-4 border-t">
                {projects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Project Type</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Completed</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">In Progress</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Planned</th>

                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => (
                          <tr className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{p.name}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{p.completed}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{p.inprogress}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{p.planned}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No Fund available</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 my-2  md:grid-cols-2 gap-6">
          {/* Institute Funds */}
          <div className="border rounded-lg border-primary/95">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setFundsOpen(!fundsOpen)}
            >
              <h3 className="text-lg font-semibold">Institute Funds({funds.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${fundsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {fundsOpen && (
              <div className="p-4 border-t">
                {funds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Fund Head</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funds.map((f) => (
                          <tr key={f.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{f.fund_head?.name}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100 font-bold">{formatBalance(f.balance)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="border p-2 text-md text-gray-900 font-bold dark:text-gray-100">Total</td>
                          <td className="border p-2 text-md text-gray-900 font-bold dark:text-gray-100">{formatBalance(funds.reduce((total, f) => Number(total) + Number(f.balance), 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No Fund available</div>
                )}
              </div>
            )}
          </div>
          {/* Institute Transports */}
          <div className="border rounded-lg border-primary/100">
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setTransportsOpen(!transportsOpen)}
            >
              <h3 className="text-lg font-semibold">Institute Transports({transports.length})</h3>
              <svg
                className={`w-5 h-5 transform transition-transform ${transportsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {transportsOpen && (
              <div className="p-4 border-t">
                {transports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm border-1">
                      <thead>
                        <tr className="bg-primary dark:bg-gray-800">
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Vehicle No</th>
                          <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">Vehicle Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transports.map((t) => (
                          <tr key={t.id} className="hover:bg-primary/10  dark:hover:bg-gray-700">
                            <td className="border p-2 text-sm text-gray-900 font-bold dark:text-gray-100">{t.vehicle_no}</td>
                            <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">{t.vehicle_type?.name}</td>
                          </tr>
                        ))}

                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">No Transport available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}