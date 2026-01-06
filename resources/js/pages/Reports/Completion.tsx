import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, XCircle } from 'lucide-react';
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

interface DetailCriteria {
    name: string;
    weight: number;
    completed: boolean;
    message: string;
}

interface InstituteCompletionDetails {
    institute: string;
    percentage: number;
    criteria: DetailCriteria[];
}


export default function Completion({
    regions = [],
    filters: initialFilters,
    institutes: initialInstitutes = [],
    totalinstitutes,
}: Props) {
    const [totalInstitutes, setTotalInstitutes] = useState(totalinstitutes);
    const [region, setRegion] = useState(initialFilters.region_id || '');
    const [institute, setInstitute] = useState(initialFilters.institute_id || '');
    const [status, setStatus] = useState(initialFilters.status || '');

    const [institutesList, setInstitutesList] = useState<Institute[]>(initialInstitutes);
    const [summary, setSummary] = useState<SummaryItem[]>([]);
    const [details, setDetails] = useState<DetailItem[]>([]);
    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState<InstituteCompletionDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const handleShowDetails = async (instituteId: number) => {
        setDetailsLoading(true);
        setModalOpen(true);
        setSelectedDetails(null);
        try {
            const res = await fetch(`/reports/completion/getDetails?institute_id=${instituteId}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSelectedDetails(data);
        } catch (error) {
            toast.error('Failed to load details');
            setModalOpen(false);
        } finally {
            setDetailsLoading(false);
        }
    };

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
            { header: 'Total Institutions', key: 'total', width: 20 },
            { header: 'Completed', key: 'completed', width: 20 },
            { header: 'Above 50%', key: 'greater', width: 20 },
            { header: 'Below 50%', key: 'less', width: 20 },
            { header: 'Zero (0%)', key: 'zero', width: 20 },
        ];
        summary.forEach(item => {
            wsSummary.addRow({
                region: item.region,
                total: item.total_institutes,
                completed: item.completed,
                greater: item.greater_than_50,
                less: item.less_than_50,
                zero: item.zero
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
                { header: 'Total Institutions', key: 'total', width: 20 },
                { header: 'Completed', key: 'completed', width: 20 },
                { header: 'Above 50%', key: 'greater', width: 20 },
                { header: 'Below 50%', key: 'less', width: 20 },
                { header: 'Zero (0%)', key: 'zero', width: 20 },
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
                    less: item.less_than_50,
                    zero: item.zero
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
            head: [['Region', 'Total Institutions', 'Completed', 'Above 50%', 'Below 50%', 'Zero (0%)']],
            body: summary.map(s => [s.region, s.total_institutes, s.completed, s.greater_than_50, s.less_than_50, s.zero]),
            startY: 20,
        });

        // Details
        doc.addPage();
        doc.text('Completion Report - Details', 14, 15);

        const isRegionView = details.length > 0 && details[0].is_region;

        if (isRegionView) {
            autoTable(doc, {
                head: [['Region', 'Total Inst.', 'Comp.', 'Above 50%', 'Below 50%', 'Zero (0%)']],
                body: details.map(d => [
                    d.name,
                    d.total_institutes || 0,
                    d.completed || 0,
                    d.greater_than_50 || 0,
                    d.less_than_50 || 0,
                    d.zero || 0
                ]),
                startY: 20,
                styles: { fontSize: 8 },
            });
        } else {
            autoTable(doc, {
                head: [['Institute', 'Shifts', 'Blocks', 'Rooms', 'Assets', 'Plants', 'Transports', 'Funds', 'Projects', 'Upgradations', 'Total %']],
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
            setTotalInstitutes(data.totalinstitutes);
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
                                    <SelectItem value="greater_than_50">Above 50%</SelectItem>
                                    <SelectItem value="less_than_50">Below 50%</SelectItem>
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

                {/* Combined Summary & Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg md:text-xl lg:text-2xl font-bold">Summary & Institute Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary Section - Modern Stat Cards */}
                        <div>
                            <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Summary Overview
                            </h3>
                            {summary.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                                    {/* Total Institutions Card */}
                                    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-slate-200/50 dark:bg-slate-700/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                        <p className="text-base md:text-lg lg:text-xl font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Institutions</p>
                                        <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-700 dark:text-slate-200 group-hover:scale-105 transition-transform">{totalInstitutes}</p>
                                    </div>

                                    {/* Completed Card */}
                                    {(status === 'completed' || status === '') && summary.map((item, idx) => (
                                        <div key={`completed-${idx}`} className="relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group hover:border-emerald-400">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/50 dark:bg-emerald-800/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <p className="text-base md:text-lg lg:text-xl font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">✓ Completed</p>
                                            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">{item.completed}</p>
                                        </div>
                                    ))}

                                    {/* Above 50% Card */}
                                    {(status === 'greater_than_50' || status === '') && summary.map((item, idx) => (
                                        <div key={`above50-${idx}`} className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group hover:border-blue-400">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/50 dark:bg-blue-800/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <p className="text-base md:text-lg lg:text-xl font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">↑ Above 50%</p>
                                            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">{item.greater_than_50}</p>
                                        </div>
                                    ))}

                                    {/* Below 50% Card */}
                                    {(status === 'less_than_50' || status === '') && summary.map((item, idx) => (
                                        <div key={`below50-${idx}`} className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900 p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group hover:border-amber-400">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/50 dark:bg-amber-800/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <p className="text-base md:text-lg lg:text-xl font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">↓ Below 50%</p>
                                            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">{item.less_than_50}</p>
                                        </div>
                                    ))}

                                    {/* Zero Card */}
                                    {(status === 'zero' || status === '') && summary.map((item, idx) => (
                                        <div key={`zero-${idx}`} className="relative overflow-hidden rounded-xl border border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group hover:border-red-400">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/50 dark:bg-red-800/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <p className="text-sm md:text-base lg:text-lg font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">✕ Zero (0%)</p>
                                            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">{item.zero}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                                    No summary data available
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Details Section */}
                        <div>
                            <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Institute Details
                            </h3>

                            {/* Filter Buttons - Modern Pill Style */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                {!isRegionView && regions.length > 0 ? (
                                    <Button
                                        onClick={() => {
                                            setRegion('');
                                            setInstitute('');
                                            fetchData({ region_id: '', institute_id: '' });
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                        ← Show All Regions
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            setRegion('');
                                            setInstitute('');
                                            fetchData({ region_id: '', institute_id: '' });
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full px-4 text-base hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                        ← Show All Institutes
                                    </Button>
                                )}

                                <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

                                <Button
                                    onClick={() => { setStatus(''); fetchData({ status: '' }); }}
                                    size="sm"
                                    className={`rounded-full px-4 transition-all ${status === '' || status === 'all' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                                >
                                    All
                                </Button>
                                <Button
                                    onClick={() => { setStatus('completed'); fetchData({ status: 'completed' }); }}
                                    size="sm"
                                    className={`rounded-full px-4 text-base transition-all ${status === 'completed' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'}`}
                                >
                                    ✓ Completed
                                </Button>
                                <Button
                                    onClick={() => { setStatus('greater_than_50'); fetchData({ status: 'greater_than_50' }); }}
                                    size="sm"
                                    className={`rounded-full px-4 text-base transition-all ${status === 'greater_than_50' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400'}`}
                                >
                                    ↑ Above 50%
                                </Button>
                                <Button
                                    onClick={() => { setStatus('less_than_50'); fetchData({ status: 'less_than_50' }); }}
                                    size="sm"
                                    className={`rounded-full px-4 text-base transition-all ${status === 'less_than_50' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400'}`}
                                >
                                    ↓ Below 50%
                                </Button>
                                <Button
                                    onClick={() => { setStatus('zero'); fetchData({ status: 'zero' }); }}
                                    size="sm"
                                    className={`rounded-full px-4 text-base transition-all ${status === 'zero' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400'}`}
                                >
                                    ✕ Zero
                                </Button>
                            </div>

                            {/* Modern Table Design */}
                            <div className="overflow-x-auto rounded-xl border shadow-sm">
                                <table className="w-full text-sm md:text-base">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b">
                                            <th className="px-4 md:px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300  text-base md:text-lg lg:text-xl tracking-wider min-w-[200px]">
                                                {isRegionView ? 'Region' : 'Institute'}
                                            </th>

                                            {isRegionView ? (
                                                <>
                                                    {status === '' && <th className="px-3 md:px-4 py-4 text-center font-semibold text-slate-700 dark:text-slate-300  text-base md:text-lg lg:text-xl tracking-wider">Total</th>}
                                                    {(status === 'completed' || status === '') && <th className="px-3 md:px-4 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-400  text-base md:text-lg lg:text-xl tracking-wider">Completed</th>}
                                                    {(status === 'greater_than_50' || status === '') && <th className="px-3 md:px-4 py-4 text-center font-semibold text-blue-700 dark:text-blue-400  text-base md:text-lg lg:text-xl tracking-wider">Above 50%</th>}
                                                    {(status === 'less_than_50' || status === '') && <th className="px-3 md:px-4 py-4 text-center font-semibold text-amber-700 dark:text-amber-400  text-base md:text-lg lg:text-xl tracking-wider">Below 50%</th>}
                                                    {(status === 'zero' || status === '') && <th className="px-3 md:px-4 py-4 text-center font-semibold text-red-700 dark:text-red-400  text-base md:text-lg lg:text-xl tracking-wider">Zero(0%)</th>}
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Shifts</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Blocks</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Rooms</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Assets</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Plants</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Trans.</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Fund</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Proj.</th>
                                                    <th className="px-2 md:px-3 py-4 text-center font-semibold text-slate-600 dark:text-slate-400 uppercase text-base md:text-lg lg:text-xl tracking-wider">Upg.</th>
                                                    <th className="px-3 md:px-4 py-4 text-center font-semibold text-slate-700 dark:text-slate-300 uppercase text-base md:text-lg lg:text-xl tracking-wider bg-slate-200/50 dark:bg-slate-700/50">Score</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.length > 0 ? (
                                            details.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className={`
                                                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                                                        hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors
                                                        ${isRegionView ? 'cursor-pointer' : ''}
                                                        border-b border-slate-100 dark:border-slate-800 last:border-0
                                                    `}
                                                    onClick={() => isRegionView ? handleRegionClick(item.id) : handleInstituteClick(item.id)}
                                                >
                                                    <td className={`px-4 md:px-6 py-4 font-semibold text-base md:text-lg lg:text-xl ${isRegionView ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {isRegionView ? item.name.split(' ').pop() || item.name : item.name}
                                                    </td>

                                                    {isRegionView ? (
                                                        <>
                                                            {status === '' && <td className="px-3 md:px-4 py-4 text-center font-bold text-base md:text-lg lg:text-xl text-slate-700 dark:text-slate-300">{item.total_institutes}</td>}
                                                            {(status === 'completed' || status === '') && (
                                                                <td className="px-3 md:px-4 py-4 text-center" onClick={(e) => { e.stopPropagation(); setStatus('completed'); handleRegionClick(item.id); }}>
                                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-full text-sm md:text-base lg:text-lg font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                                                        {item.completed}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {(status === 'greater_than_50' || status === '') && (
                                                                <td className="px-3 md:px-4 py-4 text-center" onClick={(e) => { e.stopPropagation(); setStatus('greater_than_50'); handleRegionClick(item.id); }}>
                                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-full text-sm md:text-base lg:text-lg font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                                                        {item.greater_than_50}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {(status === 'less_than_50' || status === '') && (
                                                                <td className="px-3 md:px-4 py-4 text-center" onClick={(e) => { e.stopPropagation(); setStatus('less_than_50'); handleRegionClick(item.id); }}>
                                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-full text-sm md:text-base lg:text-lg font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                                                                        {item.less_than_50}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {(status === 'zero' || status === '') && (
                                                                <td className="px-3 md:px-4 py-4 text-center" onClick={(e) => { e.stopPropagation(); setStatus('zero'); handleRegionClick(item.id); }}>
                                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-full text-sm md:text-base lg:text-lg font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                                                                        {item.zero}
                                                                    </span>
                                                                </td>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.shifts || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.blocks || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.rooms || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.assets || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.plants || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.transports || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.funds || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.projects || 0}</td>
                                                            <td className="px-2 md:px-3 py-4 text-center text-base md:text-lg lg:text-xl font-semibold text-slate-700 dark:text-slate-300">{item.upgradations || 0}</td>
                                                            <td className="px-3 md:px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-800/30">
                                                                <span
                                                                    className={`
                                                                        inline-flex items-center justify-center min-w-[4rem] px-4 py-2 rounded-full text-base md:text-lg lg:text-xl font-bold cursor-pointer
                                                                        transition-all hover:scale-105 hover:shadow-md
                                                                        ${item.percentage === 100
                                                                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200 dark:shadow-emerald-900'
                                                                            : item.percentage >= 50
                                                                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-200 dark:shadow-blue-900'
                                                                                : item.percentage > 0
                                                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200 dark:shadow-amber-900'
                                                                                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-200 dark:shadow-red-900'
                                                                        }
                                                                    `}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShowDetails(item.id);
                                                                    }}
                                                                    title="Click to see breakdown"
                                                                >
                                                                    {item.percentage}%
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={isRegionView ? 6 : 11} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                            <span className="text-2xl">📊</span>
                                                        </div>
                                                        <p className="font-medium">No details available</p>
                                                        <p className="text-sm">Try adjusting your filters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Completion Details: {selectedDetails?.institute || 'Loading...'}</DialogTitle>
                            <DialogDescription>
                                Detailed breakdown of invalid or missing criteria.
                            </DialogDescription>
                        </DialogHeader>

                        {detailsLoading ? (
                            <div className="flex justify-center p-8">Loading details...</div>
                        ) : selectedDetails ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <span className="font-semibold text-lg">Total Score</span>
                                    <span className={`text-2xl font-bold ${selectedDetails.percentage === 100 ? 'text-green-600' :
                                        selectedDetails.percentage < 10 ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                        {selectedDetails.percentage}%
                                    </span>
                                </div>

                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Criteria</th>
                                                <th className="px-4 py-3 text-right">Weight</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3 text-left">Message</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedDetails.criteria.map((criterion, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 font-medium">{criterion.name}</td>
                                                    <td className="px-4 py-3 text-right text-muted-foreground">{criterion.weight}%</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {criterion.completed ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 ${criterion.completed ? 'text-green-600' : 'text-red-600'}`}>
                                                        {criterion.message}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Fallback/Help Text */}
                                {selectedDetails.percentage < 100 && (
                                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900">
                                        Note: Please address the items marked with <XCircle className="w-3 h-3 inline text-red-500" /> to reach 100% completion.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-red-500">Failed to load details.</div>
                        )}
                    </DialogContent>
                </Dialog>
            </div >
        </AppLayout >
    );
}
