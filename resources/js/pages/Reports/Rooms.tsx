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
    { title: 'Rooms', href: '/reports/rooms' },
];

interface RoomProp {
    id: number;
    name: string;
    area: string;
    capacity: string;
    img: string;
    block?: { id: number; name?: string; institute?: { id: number; name?: string } };
    type?: { id: number; name?: string };
}

interface Item {
    id: number;
    name: string;
}

interface Props {
    rooms: {
        data: RoomProp[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
        institute_id?: string;
        block_id?: string;
        roomtype_id?: string;
        region_id?: string;
    };
    institutes: Item[];
    roomtypes: Item[];
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

export default function Rooms({ rooms: roomsProp, institutes, roomtypes, regions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [institute, setInstitute] = useState(filters.institute_id || '');
    const [block, setBlock] = useState(filters.block_id || '');
    const [roomtype, setRoomtype] = useState(filters.roomtype_id || '');
    const [region, setRegion] = useState(filters.region_id || '');
    const [rooms, setRooms] = useState(roomsProp);
    const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);
    const [blocks, setBlocks] = useState<Item[]>([]);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
    const [allRoomsForExport, setAllRoomsForExport] = useState<RoomProp[]>([]);

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
        setInstitute('');
        setBlock('');
        setRoomtype('');
        fetchInstitutes(value);
    };

    // Fetch blocks based on institute selection
    useEffect(() => {
        if (institute) {
            setIsLoadingBlocks(true);
            fetch(`/reports/rooms/getInstituteBlocks?institute_id=${institute}`)
                .then((response) => response.json())
                .then((data) => {
                    console.log('Fetched blocks:', data);
                    if (Array.isArray(data)) {
                        const validBlocks = data.filter(isValidItem);
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
        } else {
            setBlocks([]);
            setBlock('');
        }
    }, [institute]);

    // Fetch all rooms for export (without pagination)
    const fetchAllRoomsForExport = async (): Promise<RoomProp[]> => {
        try {
            const params = new URLSearchParams({
                search: search || '',
                institute_id: institute || '',
                block_id: block || '',
                roomtype_id: roomtype || '',
                region_id: region || '',
                all: 'true' // Add parameter to indicate we want all data
            });

            const response = await fetch(`/reports/rooms/getRoomsReport?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch all rooms for export');
            }
            const data: RoomProp[] = await response.json();
            setAllRoomsForExport(data);
            return data;
        } catch (error) {
            console.error('Error fetching all rooms for export:', error);
            toast.error('Failed to fetch rooms for export');
            return [];
        }
    };

    // Log initial props for debugging
    useEffect(() => {
        const invalidItems = {
            institutes: Array.isArray(filteredInstitutes) ? filteredInstitutes.filter(item => !isValidItem(item)) : [],
            roomtypes: roomtypes.filter(item => !isValidItem(item)),
            regions: regions.filter(item => !isValidItem(item)),
        };
        Object.entries(invalidItems).forEach(([key, items]) => {
            if (items.length > 0) console.warn(`Invalid ${key}:`, items);
        });
    }, [institutes, roomtypes, regions, filteredInstitutes]);

    const exportToExcel = async () => {
        try {
            const allRooms = await fetchAllRoomsForExport();

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Rooms');

            const instituteName =
                allRooms.length > 0 && allRooms[0].block?.institute?.name
                    ? allRooms[0].block.institute.name
                    : 'All Institutes';

            // Header
            worksheet.mergeCells('A1:E1');
            const instituteCell = worksheet.getCell('A1');
            instituteCell.value = `Institute: ${instituteName}`;
            instituteCell.font = { size: 16, bold: true };
            instituteCell.alignment = { horizontal: 'center' };

            worksheet.mergeCells('A2:E2');
            const titleCell = worksheet.getCell('A2');
            titleCell.value = 'Rooms Report';
            titleCell.font = { size: 14, bold: true };
            titleCell.alignment = { horizontal: 'center' };

            worksheet.addRow([]); // spacing

            // Headers
            const headers = ['Room Name', 'Room Type', 'Block', 'Area', 'Capacity'];
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF428BCA' },
            };
            headerRow.alignment = { horizontal: 'center' };

            // Data
            allRooms.forEach((room: any) => {
                worksheet.addRow([
                    room.name || '—',
                    room.room_type?.name || 'N/A',
                    room.block?.name || 'N/A',
                    room.area || 'N/A',
                    room.capacity || 'N/A',
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
            FileSaver.saveAs(blob, 'Rooms_Report.xlsx');
            toast.success('Excel exported successfully');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export Excel');
        }
    };

    const exportToPDF = async () => {
        try {
            const allRooms = await fetchAllRoomsForExport();

            const doc = new jsPDF();

            // Get institute name from first room (if available) or use default
            const instituteName =
                allRooms.length > 0 && allRooms[0].block?.institute?.name
                    ? allRooms[0].block.institute.name
                    : 'All Institutes';

            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`Institute: ${instituteName}`, 14, 15);

            doc.setFontSize(14);
            doc.text('Rooms Report', 14, 25);

            // Table columns
            const tableColumn = ['Room Name', 'Room Type', 'Block', 'Area', 'Capacity'];

            // Table rows
            const tableRows = allRooms.map((room: any) => [
                room.name || '—',
                room.room_type?.name || 'N/A',
                room.block?.name || 'N/A',
                room.area || 'N/A',
                room.capacity || 'N/A',
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

            doc.save('Rooms_Report.pdf');
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
                    block_id: block || '',
                    roomtype_id: roomtype || '',
                    region_id: region || '',
                });

                fetch(`/reports/rooms/getRoomsReport?${params.toString()}`)
                    .then((response) => response.json())
                    .then((data) => {
                        console.log('Fetched filtered rooms:', data);
                        setRooms(data);
                    })
                    .catch((error) => {
                        console.error('Error fetching filtered rooms:', error);
                        toast.error('Failed to fetch filtered rooms');
                    });
            }, 300),
        [search, institute, block, roomtype, region]
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
    const memoizedRoomtypes = useMemo(() => roomtypes.filter(isValidItem), [roomtypes]);
    const memoizedRegions = useMemo(() => regions.filter(isValidItem), [regions]);

    return (
        <ErrorBoundary>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Rooms Report" />
                <div className="flex-1 p-2 md:p-2">

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Filters</CardTitle>
                            <p className="text-muted-foreground text-sm">Refine your rooms search</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="Search rooms..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => setSearch('')}
                                    disabled={!search}
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2">


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

                                {/* Block Filter */}
                                <Select value={block} onValueChange={(value) => { setBlock(value); }} disabled={isLoadingBlocks}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Block" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Blocks</SelectItem>
                                        {isLoadingBlocks ? (
                                            <div className="text-muted-foreground text-sm p-2">Loading blocks...</div>
                                        ) : memoizedBlocks.length > 0 ? (
                                            memoizedBlocks.map((b) => (
                                                <SelectItem key={b.id} value={b.id.toString()}>
                                                    {b.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="text-muted-foreground text-sm p-2">No blocks available</div>
                                        )}
                                    </SelectContent>
                                </Select>

                                {/* Room Type Filter */}
                                <Select value={roomtype} onValueChange={(value) => { setRoomtype(value); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Room Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Room Types</SelectItem>
                                        {memoizedRoomtypes.length > 0 ? (
                                            memoizedRoomtypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="text-muted-foreground text-sm p-2">No room types available</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button onClick={debouncedApplyFilters} className="w-fit">
                                    Apply Filters
                                </Button>
                                <Button onClick={exportToPDF} className="w-full md:w-auto">
                                    Export PDF
                                </Button>
                                <Button onClick={exportToExcel} className="w-full md:w-auto">
                                    Export Excel
                                </Button>
                            </div>


                            <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm">
                                <thead>
                                    <tr className="bg-primary dark:bg-gray-800">
                                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                                            Room Name
                                        </th>
                                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                                            Room Type
                                        </th>
                                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                                            Block
                                        </th>
                                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                                            Area
                                        </th>  <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                                            Institute
                                        </th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="border p-2 text-center text-sm text-gray-900 dark:text-gray-100">
                                                No rooms found.
                                            </td>
                                        </tr>
                                    ) : (
                                        rooms.data?.map((room: RoomProp) => (
                                            <tr key={room.id} className="hover:bg-primary/10 dark:hover:bg-gray-700">
                                                <td className="border p-2 text-left font-bold dark:text-gray-100">
                                                    <div className='flex flex-column gap-2 align-middle'> <ImagePreview dataImg={room.img} size="h-20" />  <span className='font-bold'>{room.name}</span></div>
                                                </td>
                                                <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                                                    {room.type?.name || '—'}
                                                </td>
                                                <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                                                    {room.block?.name || '—'}
                                                </td>
                                                <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                                                    {room.area || '—'}
                                                </td>
                                                <td className="border p-2 text-left text-gray-900 dark:text-gray-100">
                                                    {room.block?.institute?.name || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {rooms.links?.length > 1 && (
                                <div className="flex justify-center pt-6 flex-wrap gap-2">
                                    {rooms.links.map((link, i) => (
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
                                                            setRooms(data);
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



            </AppLayout>
        </ErrorBoundary>
    );
}
