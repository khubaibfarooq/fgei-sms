import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import Combobox from '@/components/ui/combobox';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { router } from '@inertiajs/react';
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
    { title: 'Completion', href: '/reports/completion' },
];

interface Region { id: number; name: string; }
interface Institute { id: number; name: string; }

interface SummaryItem {
    region: string;
    total_institutes: number;
    completed: number;
    less_than_50: number;
    greater_than_50: number;
    zero: number;
}



interface Props {
    regions: Region[];
    filters: {
        region_id?: string;
        institute_id?: string;
        status?: string;
    };
    institutes: Institute[];
    totalinstitutes: number;
}



interface DetailItem {
    id: number;
    name: string;
    region_name?: string;
    is_region?: boolean;
    total_institutes?: number;
    completed?: number;
    less_than_50?: number;
    greater_than_50?: number;
    zero?: number;
    shifts?: number;
    blocks?: number;
    rooms?: number;
    assets?: number;
    plants?: number;
    transports?: number;
    funds?: number;
    projects?: number;
    upgradations?: number;
    percentage: number;
}


export default function Completion({
    regions = [],
    filters: initialFilters,
    institutes: initialInstitutes = [],
    totalinstitutes,
}: Props) {
    const [region, setRegion] = useState(initialFilters.region_id || '');
    const [institute, setInstitute] = useState(initialFilters.institute_id || '');
    const [status, setStatus] = useState(initialFilters.status || '');

    const [institutesList, setInstitutesList] = useState<Institute[]>(initialInstitutes);
    const [summary, setSummary] = useState<SummaryItem[]>([]);
    const [details, setDetails] = useState<DetailItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch institutes when region changes
    useEffect(() => {
        if (region && region !== '0') {
            fetch(`/reports/getInstitutes?region_id=${region}`)
                .then(res => res.json())
                .then(data => setInstitutesList(data))
                .catch(() => toast.error('Failed to load institutes'));
        } else {
            setInstitutesList([]);
        }
    }, [region]);

    const handleRegionClick = (regionId: number) => {
        const newRegionId = regionId.toString();
        setRegion(newRegionId);
        setInstitute('');
        fetchData({ region_id: newRegionId, institute_id: '' });
    };
    const handleInstituteClick = (instituteId: number) => {
        const newInstituteId = instituteId.toString();
        setInstitute(newInstituteId);
        setRegion('');
        window.open(`/reports/institutes?region_id=${region}&institute_id=${instituteId}`, '_blank');
    };
    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();

        // Summary Sheet
        const wsSummary = workbook.addWorksheet('Summary');
        wsSummary.columns = [
            { header: 'Region', key: 'region', width: 30 },
            { header: 'Total Institutes', key: 'total', width: 20 },
            { header: 'Completed', key: 'completed', width: 20 },
            { header: '> 50%', key: 'greater', width: 20 },
            { header: '< 50%', key: 'less', width: 20 },
        ];
        summary.forEach(item => {
            wsSummary.addRow({
                region: item.region,
                total: item.total_institutes,
                completed: item.completed,
                greater: item.greater_than_50,
                less: item.less_than_50
            });
        });

        // Details Sheet
        const wsDetails = workbook.addWorksheet('Details');

        const isRegionView = details.length > 0 && details[0].is_region;

        if (isRegionView) {
            wsDetails.columns = [
                { header: 'Region', key: 'name', width: 30 },
                { header: 'Shifts', key: 'shifts', width: 10 },
                { header: 'Blocks', key: 'blocks', width: 10 },
                { header: 'Rooms', key: 'rooms', width: 10 },
                { header: 'Assets', key: 'assets', width: 10 },
                { header: 'Plants', key: 'plants', width: 10 },
                { header: 'Transports', key: 'transports', width: 12 },
                { header: 'Funds', key: 'funds', width: 10 },
                { header: 'Projects', key: 'projects', width: 10 },
                { header: 'Upgradations', key: 'upgradations', width: 12 },
                { header: 'Total Institutes', key: 'total', width: 20 },
                { header: 'Completed', key: 'completed', width: 20 },
                { header: '> 50%', key: 'greater', width: 20 },
                { header: '< 50%', key: 'less', width: 20 },
            ];
            details.forEach(item => {
                wsDetails.addRow({
                    name: item.name,
                    shifts: item.shifts,
                    blocks: item.blocks,
                    rooms: item.rooms,
                    assets: item.assets,
                    plants: item.plants,
                    transports: item.transports,
                    funds: item.funds,
                    projects: item.projects,
                    upgradations: item.upgradations,
                    total: item.total_institutes,
                    completed: item.completed,
                    greater: item.greater_than_50,
                    less: item.less_than_50
                });
            });
        } else {
            wsDetails.columns = [
                { header: 'Institute', key: 'name', width: 40 },
                { header: 'Region', key: 'region', width: 30 },
                { header: 'Shifts', key: 'shifts', width: 10 },
                { header: 'Blocks', key: 'blocks', width: 10 },
                { header: 'Rooms', key: 'rooms', width: 10 },
                { header: 'Assets', key: 'assets', width: 10 },
                { header: 'Plants', key: 'plants', width: 10 },
                { header: 'Transports', key: 'transports', width: 12 },
                { header: 'Funds', key: 'funds', width: 10 },
                { header: 'Projects', key: 'projects', width: 10 },
                { header: 'Upgradations', key: 'upgradations', width: 12 },
                { header: 'Total %', key: 'percentage', width: 10 },
            ];
            details.forEach(item => {
                wsDetails.addRow({
                    name: item.name,
                    region: item.region_name,
                    shifts: item.shifts,
                    blocks: item.blocks,
                    rooms: item.rooms,
                    assets: item.assets,
                    plants: item.plants,
                    transports: item.transports,
                    funds: item.funds,
                    projects: item.projects,
                    upgradations: item.upgradations,
                    percentage: item.percentage + '%'
                });
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        FileSaver.saveAs(new Blob([buffer]), 'Completion_Report.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');

        // Summary
        doc.text('Completion Report - Summary', 14, 15);
        autoTable(doc, {
            head: [['Region', 'Total Institutes', 'Completed', '> 50%', '< 50%']],
            body: summary.map(s => [s.region, s.total_institutes, s.completed, s.greater_than_50, s.less_than_50]),
            startY: 20,
        });

        // Details
        doc.addPage();
        doc.text('Completion Report - Details', 14, 15);

        const isRegionView = details.length > 0 && details[0].is_region;

        if (isRegionView) {
            autoTable(doc, {
                head: [['Region', 'Shifts', 'Blocks', 'Rooms', 'Assets', 'Plants', 'Transports', 'Funds', 'Projects', 'Upgradations', 'Total Inst.', 'Comp.', '> 50%', '< 50%']],
                body: details.map(d => [
                    d.name,
                    d.shifts || 0,
                    d.blocks || 0,
                    d.rooms || 0,
                    d.assets || 0,
                    d.plants || 0,
                    d.transports || 0,
                    d.funds || 0,
                    d.projects || 0,
                    d.upgradations || 0,
                    d.total_institutes || 0,
                    d.completed || 0,
                    d.greater_than_50 || 0,
                    d.less_than_50 || 0
                ]),
                startY: 20,
                styles: { fontSize: 8 },
            });
        } else {
            autoTable(doc, {
                head: [['Institute', 'Region', 'Shifts', 'Blocks', 'Rooms', 'Assets', 'Plants', 'Transports', 'Funds', 'Projects', 'Upgradations', 'Total %']],
                body: details.map(d => [
                    d.name,
                    d.region_name || '',
                    d.shifts || 0,
                    d.blocks || 0,
                    d.rooms || 0,
                    d.assets || 0,
                    d.plants || 0,
                    d.transports || 0,
                    d.funds || 0,
                    d.projects || 0,
                    d.upgradations || 0,
                    (d.percentage || 0) + '%'
                ]),
                startY: 20,
                styles: { fontSize: 8 },
            });
        }

        doc.save('Completion_Report.pdf');
    };

    const fetchData = async (overrides?: { region_id?: string; institute_id?: string; status?: string }) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                region_id: overrides?.region_id ?? region ?? '',
                institute_id: overrides?.institute_id ?? institute ?? '',
                status: overrides?.status ?? status ?? '',
            });
            const res = await fetch(`/reports/completion/getData?${params.toString()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSummary(data.summary);
            setDetails(data.details);
            if (data.institutes) setInstitutesList(data.institutes);
        } catch (error) {
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, []);

    const handleApply = () => {
        fetchData();
    };

    const handleReset = () => {
        setRegion('');
        setInstitute('');
        setStatus('');
        fetchData({ region_id: '', institute_id: '', status: '' });
    };

    const isRegionView = details.length > 0 && details[0].is_region;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Completion Report" />

            <div className="p-4 lg:p-6 max-w-full space-y-6">
                <Card className="w-full shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold">Completion Report</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Institute data completion status
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={exportToPDF} variant="outline" size="sm">PDF</Button>
                                <Button onClick={exportToExcel} variant="outline" size="sm">Excel</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {regions.length > 0 && <Combobox
                                entity="region"
                                value={region}
                                onChange={(val) => { setRegion(val); setInstitute(''); }}
                                options={regions.map(r => ({ id: r.id.toString(), name: r.name.split(' ').pop() || r.name }))}
                                includeAllOption={true}
                                placeholder="Select Region"
                            />}
                            <Combobox
                                entity="institute"
                                value={institute}
                                onChange={setInstitute}
                                options={institutesList.map(i => ({ id: i.id.toString(), name: i.name }))}
                                includeAllOption={true}
                                placeholder="Select Institute"
                            />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="completed">Completed (100%)</SelectItem>
                                    <SelectItem value="greater_than_50">Greater than 50%</SelectItem>
                                    <SelectItem value="less_than_50">Less than 50%</SelectItem>
                                    <SelectItem value="zero">Zero (0%)</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button onClick={handleApply} className="flex-1" disabled={loading}>
                                    {loading ? 'Loading...' : 'Apply'}
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="flex-1">Reset</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-center">Total Institutes</th>
                                        {status == 'completed' || status == '' ? <th className="px-4 py-3 text-center">Completed Data</th> : null}
                                        {status == 'greater_than_50' || status == '' ? <th className="px-4 py-3 text-center">Greater than 50%</th> : null}
                                        {status == 'less_than_50' || status == '' ? <th className="px-4 py-3 text-center">Less than 50%</th> : null}
                                        {status == 'zero' || status == '' ? <th className="px-4 py-3 text-center">Zero (0%)</th> : null}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {summary.length > 0 ? (
                                        summary.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-muted/50">
                                                <td className="px-4 py-3 text-center">{totalinstitutes}</td>
                                                {status == 'completed' || status == '' ? <td className="px-4 py-3 text-center text-green-600 font-bold">{item.completed}</td> : null}
                                                {status == 'greater_than_50' || status == '' ? <td className="px-4 py-3 text-center text-green-600 font-bold">
                                                    {item.greater_than_50}</td> : null}
                                                {status == 'less_than_50' || status == '' ? <td className="px-4 py-3 text-center text-red-600 font-bold">{item.less_than_50}</td> : null}
                                                {status == 'zero' || status == '' ? <td className="px-4 py-3 text-center text-red-600 font-bold">{item.zero}</td> : null}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                No summary data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Institute Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!isRegionView && regions.length > 0 ? (
                            <Button
                                onClick={() => {
                                    setRegion('');
                                    setInstitute('');
                                    fetchData({ region_id: '', institute_id: '' });
                                }}
                                variant="outline"
                                size="sm"

                            >
                                Show All Regions
                            </Button>) : (
                            <Button
                                onClick={() => {
                                    setRegion('');
                                    setInstitute('');
                                    fetchData({ region_id: '', institute_id: '' });
                                }}
                                variant="outline"
                                size="sm"

                            >
                                Show All Institutes
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                setStatus('');
                                fetchData({ status: '' });
                            }}
                            variant="outline"
                            size="sm"
                            className='mr-2 text-white bg-blue-500 hover:bg-blue-600'
                        >
                            All Statuses
                        </Button>  <Button
                            onClick={() => {
                                setStatus('completed');
                                fetchData({ status: 'completed' });
                            }}
                            variant="outline"
                            size="sm"
                            className='mr-2 text-white bg-green-500 hover:bg-green-600'
                        >
                            Completed (100%)
                        </Button> <Button
                            onClick={() => {
                                setStatus('greater_than_50');
                                fetchData({ status: 'greater_than_50' });
                            }}
                            variant="outline"
                            size="sm"
                            className='mr-2 text-white bg-green-500 hover:bg-green-600'
                        >
                            Greater than 50%
                        </Button> <Button
                            onClick={() => {
                                setStatus('less_than_50');
                                fetchData({ status: 'less_than_50' });
                            }}
                            variant="outline"
                            size="sm"
                            className='mr-2 text-white bg-red-500 hover:bg-red-600'
                        >
                            Less than 50%
                        </Button>
                        <Button
                            onClick={() => {
                                setStatus('zero');
                                fetchData({ status: 'zero' });
                            }}
                            variant="outline"
                            size="sm"
                            className='mr-2 text-white bg-red-500 hover:bg-red-600'
                        >
                            Zero (0%)
                        </Button>
                        <div className="overflow-x-auto">

                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[200px]">{isRegionView ? 'Region' : 'Institute'}</th>

                                        {isRegionView ? (
                                            <>
                                                {status == '' ? <th className="px-4 py-3 text-center">Total Inst.</th> : null}
                                                {
                                                    status == 'completed' || status == '' ? <th className="px-4 py-3 text-center">Comp.</th> : null
                                                }
                                                {
                                                    status == 'greater_than_50' || status == '' ? <th className="px-4 py-3 text-center">&gt; 50%</th> : null
                                                }
                                                {
                                                    status == 'less_than_50' || status == '' ? <th className="px-4 py-3 text-center">&lt; 50%</th> : null
                                                }
                                                {
                                                    status == 'zero' || status == '' ? <th className="px-4 py-3 text-center">Zero (0%)</th> : null
                                                }
                                            </>
                                        ) : (<>
                                            <th className="px-4 py-3 text-center">Shifts</th>
                                            <th className="px-4 py-3 text-center">Blocks</th>
                                            <th className="px-4 py-3 text-center">Rooms</th>
                                            <th className="px-4 py-3 text-center">Assets</th>
                                            <th className="px-4 py-3 text-center">Plants</th>
                                            <th className="px-4 py-3 text-center">Transports</th>
                                            <th className="px-4 py-3 text-center">Fund</th>
                                            <th className="px-4 py-3 text-center">Projects</th>
                                            <th className="px-4 py-3 text-center">Upgrad.</th>
                                            <th className="px-4 py-3 text-center">Total %</th>
                                        </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {details.length > 0 ? (
                                        details.map((item) => (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-muted/50 ${isRegionView ? 'cursor-pointer' : ''}`}
                                                onClick={() => isRegionView ? handleRegionClick(item.id) : handleInstituteClick(item.id)}
                                            >
                                                <td className={`px-4 py-3 font-medium ${isRegionView ? 'text-blue-600' : ''}`}>
                                                    {isRegionView ? item.name.split(' ').pop() || item.name : item.name}
                                                </td>


                                                {isRegionView ? (
                                                    <>
                                                        {status == '' ? <td className="px-4 py-3 text-center">{item.total_institutes}</td> : null}
                                                        {
                                                            status == 'completed' || status == '' ? <td className="px-4 py-3 text-center text-green-600 font-bold" onClick={() => {
                                                                setStatus('completed');

                                                                handleRegionClick(item.id);
                                                            }} >{item.completed}</td> : null
                                                        }
                                                        {
                                                            status == 'greater_than_50' || status == '' ? <td className="px-4 py-3 text-center text-green-600 font-bold" onClick={() => {
                                                                setStatus('greater_than_50');
                                                                handleRegionClick(item.id);
                                                            }} >{item.greater_than_50}</td> : null
                                                        }
                                                        {
                                                            status == 'less_than_50' || status == '' ? <td className="px-4 py-3 text-center text-red-600 font-bold" onClick={() => {
                                                                setStatus('less_than_50');
                                                                handleRegionClick(item.id);
                                                            }} >{item.less_than_50}</td> : null
                                                        }
                                                        {
                                                            status == 'zero' || status == '' ? <td className="px-4 py-3 text-center text-red-600 font-bold" onClick={() => {
                                                                setStatus('zero');
                                                                handleRegionClick(item.id);

                                                            }} >{item.zero}</td> : null
                                                        }
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 text-center">{item.shifts}</td>
                                                        <td className="px-4 py-3 text-center">{item.blocks}</td>
                                                        <td className="px-4 py-3 text-center">{item.rooms}</td>
                                                        <td className="px-4 py-3 text-center">{item.assets}</td>
                                                        <td className="px-4 py-3 text-center">{item.plants}</td>
                                                        <td className="px-4 py-3 text-center">{item.transports}</td>
                                                        <td className="px-4 py-3 text-center">{item.funds}</td>
                                                        <td className="px-4 py-3 text-center">{item.projects}</td>
                                                        <td className="px-4 py-3 text-center">{item.upgradations}</td>
                                                        <td className="px-4 py-3 text-center font-bold">
                                                            <span className={
                                                                item.percentage === 100 ? 'text-green-600' :
                                                                    item.percentage < 50 ? 'text-red-600' : 'text-yellow-600'
                                                            }>
                                                                {item.percentage}%
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isRegionView ? 14 : 11} className="px-4 py-8 text-center text-muted-foreground">
                                                No details available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card >
            </div >
        </AppLayout >
    );
}
