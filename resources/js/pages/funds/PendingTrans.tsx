import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Calendar,
    ArrowLeft,
    CheckCircle,
    XCircle,
    FileText,
    Eye,
    User,
    Check,
    Clock,
    Building,
    ClipboardCheck,
    Filter,
    Upload,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import axios from 'axios';
import { ImagePreview } from '@/components/ui/image-preview2';
import { toast } from 'sonner';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface FundTransaction {
    id: number;
    amount: number;
    type: 'in' | 'out';
    description: string;
    date: string;
    status: string;
    added_date: string;
    created_at: string;
    updated_at: string;
    added_by: number;
    trans_type: string;
    img: string;
    tid?: number | null;
    fund_head: {
        id: number;
        name: string;
    };
    institute: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    } | null;
    approved_date?: string | null;
}

interface FundHead {
    id: number;
    name: string;
}

interface Payment {
    id: number;
    amount: number;
    status: string;
    added_date: string;
    img: string;
    description: string | null;
    fund_head?: {
        name: string;
    };
}

interface Milestone {
    id: number;
    name: string;
    description: string | null;
    days: number;
    status: string;
    completed_date: string | null;
    img: string | null;
    pdf: string | null;
}

interface ApprovalHistory {
    id: number;
    status: string;
    comments: string;
    action_date: string;
    approver: { name: string };
    stage: { stage_name: string; fund_head?: { name: string } | null };
    pdf: string | null;
    img: string | null;
}

interface ProjectDetails {
    project: {
        id: number;
        name: string;
        estimated_cost: number;
        actual_cost: number | null;
        status: string;
        approval_status: string;
        priority: string;
        institute: { name: string };
        description: string;
        pdf: string | null;
        structural_plan: string | null;
        final_comments: string | null;
        fund_head?: { name: string } | null;
        contractor?: { name: string; contact?: string | null } | null;
        projecttype?: { name: string } | null;
    };
    history: ApprovalHistory[];
    milestones: Milestone[];
    payments: Payment[];
}

interface TransactionDetail {
    id: number;
    fund_head_name: string;
    asset_name: string;
    room_name: string;
    amount: string;
    qty: number;
}

interface BalanceItem {
    fund_head: { id: number; name: string };
    balance: number | string;
    pending_in: number;
    pending_out: number;
}

interface Props {
    transactions: {
        data: FundTransaction[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
        from: number;
        to: number;
        total: number;
    };
    summary: {
        total_count: number;
        total_in: number;
        total_out: number;
    };
    fundHeads: FundHead[];
    filters: {
        search: string;
        from?: string;
        to?: string;
        fund_head_id?: string;
    };
    balances: BalanceItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Funds', href: '/funds' },
    { title: 'Pending Transactions', href: '#' },
];

export default function PendingTrans({ transactions, summary, fundHeads, balances = [], filters }: Props) {
    const formatCurrency = (amount: any): string => {
        const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, '')) || 0;
        return new Intl.NumberFormat('ur-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

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

    const [search, setSearch] = useState(filters.search || '');
    const [fromDate, setFromDate] = useState(filters.from || '');
    const [toDate, setToDate] = useState(filters.to || '');
    const [fundHeadId, setFundHeadId] = useState(filters.fund_head_id || '');

    // Modal state for Transactions
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [selectedTxDetail, setSelectedTxDetail] = useState<FundTransaction | null>(null);
    const [txDetails, setTxDetails] = useState<TransactionDetail | null>(null);

    // Modal state for Projects
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);

    const [loadingDetails, setLoadingDetails] = useState(false);

    // Approval Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<FundTransaction | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    const fetchTransactionDetails = async (tx: FundTransaction) => {
        if (!tx.tid) return;
        setSelectedTxDetail(tx);
        setTransactionModalOpen(true);
        setLoadingDetails(true);
        try {
            const { data } = await axios.get(`/transactions/getbytid?tid=${tx.tid}`);
            setTxDetails(data.transdetails?.[0] || null);
        } catch (err) {
            console.error('Failed to load transaction details:', err);
            toast.error('Failed to load transaction details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const fetchProjectDetails = async (tx: FundTransaction) => {
        const projectId = tx.tid;
        if (!projectId) return;

        setSelectedTxDetail(tx);
        setProjectModalOpen(true);
        setLoadingDetails(true);
        try {
            const [projectDetailsRes, historyRes, milestonesRes, paymentsRes] = await Promise.all([
                axios.get(`/projects/${projectId}/project-details`),
                axios.get(`/projects/${projectId}/history`),
                axios.get(`/projects/${projectId}/milestones`),
                axios.get(`/projects/${projectId}/payments`)
            ]);
            //  console.log(milestonesRes.data);
            const d = projectDetailsRes.data;
            setProjectDetails({
                project: {
                    id: projectId,
                    name: d.name,
                    estimated_cost: d.estimated_cost,
                    actual_cost: d.actual_cost,
                    status: d.status,
                    approval_status: d.approval_status,
                    priority: d.priority,
                    institute: d.institute,
                    description: d.description,
                    pdf: d.pdf,
                    structural_plan: d.structural_plan ?? null,
                    final_comments: d.final_comments ?? null,
                    fund_head: d.fund_head ?? null,
                    contractor: d.contractor ?? null,
                    projecttype: d.projecttype ?? null,
                },
                history: historyRes.data,
                milestones: milestonesRes.data,
                payments: paymentsRes.data.payments
            });
        } catch (err) {
            console.error('Failed to load project details:', err);
            toast.error('Failed to load project details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const openDetails = (tx: FundTransaction) => {
        if (tx.trans_type === 'project') {
            fetchProjectDetails(tx);
        } else {
            fetchTransactionDetails(tx);
        }
    };

    // Image upload state
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Apply filters
    const applyFilters = () => {
        router.get(
            window.location.pathname,
            {
                search,
                from: fromDate || undefined,
                to: toDate || undefined,
                fund_head_id: fundHeadId || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') applyFilters();
    };

    // Open approval modal
    const openApprovalModal = (tx: FundTransaction) => {
        setSelectedTx(tx);
        setSelectedImage(null);
        setImagePreview(null);
        setModalOpen(true);
    };

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove selected image
    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    // Handle approve transaction
    const handleApprove = async () => {
        if (!selectedTx) return;

        setApprovingId(selectedTx.id);

        try {
            // Create FormData to send image
            const formData = new FormData();
            if (selectedImage) {
                console.log('Appending image to FormData:', selectedImage.name, selectedImage.size);
                formData.append('img', selectedImage);
            } else {
                console.log('No image selected');
            }

            console.log('Sending approval request for transaction:', selectedTx.id);
            const { data } = await axios.post(`/funds/${selectedTx.id}/approve`, formData);

            if (data.success) {
                setModalOpen(false);
                setSelectedImage(null);
                setImagePreview(null);
                // Refresh the page to show updated data
                router.reload();
            } else {
                alert(data.message || 'Failed to approve transaction');
            }
        } catch (err: any) {
            console.error('Failed to approve transaction:', err);
            const errorMessage = err.response?.data?.message || 'An error occurred while approving the transaction';
            alert(errorMessage);
        } finally {
            setApprovingId(null);
        }
    };

    const getTypeBadge = (type: 'in' | 'out') =>
        type === 'in' ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                IN
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                OUT
            </Badge>
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending Fund Transactions" />

            <div className="flex-1 p-1 md:p-2">
                <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Pending Fund Transactions
                        </CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-2 px-4 pb-3 space-y-3">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-2">
                            <Card>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Total Pending</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                {summary.total_count}
                                            </p>
                                        </div>
                                        <FileText className="h-4 w-4 text-blue-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Pending IN</p>
                                            <p className="text-xl font-bold text-green-600">
                                                {summary.total_in.toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="default" className="bg-green-100 text-green-800 text-[10px]">IN</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Pending OUT</p>
                                            <p className="text-xl font-bold text-red-600">
                                                {summary.total_out.toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="destructive" className="bg-red-100 text-red-800 text-[10px]">OUT</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Fund Head Balances & Pending Amounts */}
                        {balances.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold flex items-center gap-1">
                                    <Building className="h-4 w-4 text-primary" />
                                    Fund Head Balances
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                    {balances.map((b, i) => (
                                        <div
                                            key={i}
                                            onClick={() => window.open(`/fund-trans/${b.fund_head.id}`, '_blank')}
                                            className="bg-muted/50 dark:bg-gray-800 p-3 rounded-lg border hover:shadow-md hover:border-primary transition-all cursor-pointer flex flex-col gap-1.5"
                                        >
                                            <p className="text-xs font-semibold text-muted-foreground truncate" title={b.fund_head.name}>
                                                {b.fund_head.name}
                                            </p>
                                            <div className="flex justify-between items-end mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground">Current Balance</span>
                                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                        {formatBalance(b.balance)}
                                                    </span>
                                                </div>
                                                {(b.pending_in > 0 || b.pending_out > 0) && (
                                                    <div className="flex flex-col items-end text-right">
                                                        <span className="text-[10px] text-muted-foreground">Pending</span>
                                                        {b.pending_in > 0 && (
                                                            <span className="text-[10px] font-medium text-green-500" title={`Pending IN: ${b.pending_in.toLocaleString()}`}>
                                                                +{formatBalance(b.pending_in)}
                                                            </span>
                                                        )}
                                                        {b.pending_out > 0 && (
                                                            <span className="text-[10px] font-medium text-red-500" title={`Pending OUT: ${b.pending_out.toLocaleString()}`}>
                                                                -{formatBalance(b.pending_out)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                            </div>
                        )}

                        {/* Filters */}
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs font-medium mb-1">Search</label>
                                <Input
                                    className="h-8 text-sm"
                                    placeholder="Search description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                />
                            </div>
                            <div className="min-w-[140px]">
                                <label className="block text-xs font-medium mb-1">Fund Head</label>
                                <Select value={fundHeadId} onValueChange={setFundHeadId}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="All Fund Heads" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Fund Heads</SelectItem>
                                        {fundHeads.map((fh) => (
                                            <SelectItem key={fh.id} value={fh.id.toString()}>
                                                {fh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">From</label>
                                <Input className="h-8 text-sm" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">To</label>
                                <Input className="h-8 text-sm" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </div>
                            <Button onClick={applyFilters} size="sm" className="h-8">
                                <Filter className="h-3 w-3 mr-1" />
                                Filter
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            Showing {transactions.from}–{transactions.to} of {transactions.total} pending transactions
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-md border" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <table className="w-full border-collapse text-xs">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-primary dark:bg-gray-800">
                                        <th className="border p-2 text-left font-medium text-white dark:text-gray-200">Date</th>
                                        <th className="border p-2 text-left font-medium text-white dark:text-gray-200">Fund Head</th>
                                        <th className="border p-2 text-left font-medium text-white dark:text-gray-200">Institute</th>
                                        <th className="border p-2 text-left font-medium text-white dark:text-gray-200">Description</th>
                                        <th className="border p-2 text-center font-medium text-white dark:text-gray-200">Type</th>
                                        <th className="border p-2 text-right font-medium text-white dark:text-gray-200">Amount</th>
                                        <th className="border p-2 text-left font-medium text-white dark:text-gray-200">Added By</th>
                                        <th className="border p-2 text-center font-medium text-white dark:text-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="border p-6 text-center">
                                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-muted-foreground text-xs">No pending transactions found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.data.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="border p-1.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        {new Date(transaction.added_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="border p-1.5 font-medium">{transaction.fund_head.name}</td>
                                                <td className="border p-1.5">{transaction.institute.name}</td>
                                                <td className="border p-1.5 max-w-[200px] truncate">{transaction.description}</td>
                                                <td className="border p-1.5 text-center">{getTypeBadge(transaction.type)}</td>
                                                <td className="border p-1.5 text-right font-medium">
                                                    <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                                                        {transaction.type === 'in' ? '+' : '-'}
                                                        {formatBalance(transaction.amount)}
                                                    </span>
                                                </td>
                                                <td className="border p-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        {transaction.user.name}
                                                    </div>
                                                </td>
                                                <td className="border p-1.5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openDetails(transaction)}
                                                            className="h-6 px-2 text-[10px] text-blue-600 border-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-3 w-3 mr-0.5" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => openApprovalModal(transaction)}
                                                            className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Check className="h-3 w-3 mr-0.5" />
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {transactions.links.length > 1 && (
                            <div className="flex justify-center pt-2 flex-wrap gap-1">
                                {transactions.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Approval Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Approve Transaction</DialogTitle>
                        <DialogDescription>
                            Review the transaction details before approving
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTx && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Fund Head:</strong> {selectedTx.fund_head.name}
                                </div>
                                <div>
                                    <strong>Institute:</strong> {selectedTx.institute.name}
                                </div>
                                <div>
                                    <strong>Type:</strong> {getTypeBadge(selectedTx.type)}
                                </div>
                                <div>
                                    <strong>Amount:</strong>{' '}
                                    <span className={selectedTx.type === 'in' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                        {selectedTx.type === 'in' ? '+' : '-'}
                                        {selectedTx.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <strong>Description:</strong> {selectedTx.description}
                                </div>
                                <div>
                                    <strong>Date:</strong> {format(new Date(selectedTx.added_date), 'dd MMM yyyy')}
                                </div>
                                <div>
                                    <strong>Added By:</strong> {selectedTx.user.name}
                                </div>
                            </div>

                            <Separator />

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Note:</strong> Approving this transaction will update the fund balance.
                                    {selectedTx.type === 'in'
                                        ? ' The balance will be increased by the transaction amount.'
                                        : ' The balance will be decreased by the transaction amount.'}
                                </p>
                            </div>

                            <Separator />

                            {/* Image Upload Section */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Attach Image (Optional)</label>
                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload" className="cursor-pointer">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Click to upload an image
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative border rounded-lg p-2">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={removeImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={approvingId !== null}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={approvingId !== null}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {approvingId !== null ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve Transaction
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Detail Modal */}
            <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
                <DialogContent className="max-w-md h-[90vh]  overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of the selected transaction
                        </DialogDescription>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : txDetails ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Fund Head</p>
                                    <p className="font-medium">{txDetails.fund_head_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-medium text-lg">
                                        {Number(txDetails.amount).toLocaleString()}
                                    </p>
                                </div>
                                {txDetails.asset_name && (
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Asset</p>
                                        <p className="font-medium">{txDetails.asset_name}</p>
                                    </div>
                                )}
                                {txDetails.qty > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Quantity</p>
                                        <p className="font-medium">{txDetails.qty}</p>
                                    </div>
                                )}
                                {txDetails.room_name && (
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Room</p>
                                        <p className="font-medium">{txDetails.room_name}</p>
                                    </div>
                                )}
                            </div>

                            {selectedTxDetail?.img && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Transaction Evidence</p>
                                    <ImagePreview dataImg={selectedTxDetail.img} size="h-64 w-full" />
                                </div>
                            )}

                            <div className="pt-2">
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-sm p-3 bg-muted rounded-md border">
                                    {selectedTxDetail?.description || 'No description provided'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No additional details found for this transaction.
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTransactionModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Project Detail Modal */}
            <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
                <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
                    <DialogHeader className="px-4 pt-3 pb-2 border-b shrink-0">
                        <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{projectDetails?.project.name}</span>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-xs space-y-1.5 mt-1">
                                {/* Status row */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-medium text-foreground">{projectDetails?.project.institute.name}</span>
                                    {projectDetails?.project.status && (
                                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${
                                            projectDetails.project.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                                            projectDetails.project.status === 'inprogress' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                            'border-gray-500 text-gray-600 bg-gray-50'
                                        }`}>
                                            {projectDetails.project.status.charAt(0).toUpperCase() + projectDetails.project.status.slice(1)}
                                        </Badge>
                                    )}
                                    {projectDetails?.project.approval_status && (
                                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${
                                            projectDetails.project.approval_status === 'approved' ? 'border-green-500 text-green-600 bg-green-50' :
                                            projectDetails.project.approval_status === 'rejected' ? 'border-red-500 text-red-600 bg-red-50' :
                                            'border-yellow-500 text-yellow-600 bg-yellow-50'
                                        }`}>
                                            {projectDetails.project.approval_status.charAt(0).toUpperCase() + projectDetails.project.approval_status.slice(1)}
                                        </Badge>
                                    )}
                                    {projectDetails?.project.priority && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{projectDetails.project.priority}</Badge>
                                    )}
                                </div>

                                {/* Meta grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 bg-muted/20 p-2 rounded-md border">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Cost</p>
                                        <p className="font-medium text-foreground">{projectDetails?.project.estimated_cost?.toLocaleString() ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Act. Cost</p>
                                        <p className="font-medium text-foreground">{projectDetails?.project.actual_cost?.toLocaleString() ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Request</p>
                                        <p className="font-medium text-orange-600">{selectedTxDetail?.amount?.toLocaleString()} RS</p>
                                    </div>
                                    {projectDetails?.project.projecttype?.name && (
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</p>
                                            <p className="font-medium text-foreground truncate">{projectDetails.project.projecttype.name}</p>
                                        </div>
                                    )}
                                    {projectDetails?.project.fund_head?.name && (
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fund Head</p>
                                            <p className="font-medium text-foreground truncate">{projectDetails.project.fund_head.name}</p>
                                        </div>
                                    )}
                                    {projectDetails?.project.contractor?.name && (
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contractor</p>
                                            <p className="font-medium text-foreground truncate">{projectDetails.project.contractor.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {projectDetails?.project.description && (
                                    <div className="bg-muted/10 border rounded px-2 py-1">
                                        <p className="text-[11px] text-muted-foreground italic line-clamp-2" dangerouslySetInnerHTML={{ __html: projectDetails.project.description }} />
                                    </div>
                                )}

                                {/* Final comments */}
                                {projectDetails?.project.final_comments && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded px-2 py-1 text-[11px] text-yellow-800 dark:text-yellow-200">
                                        <span className="font-semibold">Final Comments: </span>{projectDetails.project.final_comments}
                                    </div>
                                )}

                                {/* PDF buttons */}
                                <div className="flex items-center gap-2">
                                    {projectDetails?.project.pdf && (
                                        <a href={`/assets/${projectDetails.project.pdf}`} target="_blank"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700">
                                            <FileText className="h-3 w-3" /> Project PDF
                                        </a>
                                    )}
                                    {projectDetails?.project.structural_plan && (
                                        <a href={`/assets/${projectDetails.project.structural_plan}`} target="_blank"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] hover:bg-indigo-700">
                                            <FileText className="h-3 w-3" /> Structural Plan
                                        </a>
                                    )}
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 h-full min-h-0">

                        <Tabs defaultValue="approvals" className="w-full h-full flex flex-col mt-4">
                            <TabsList className="grid w-full grid-cols-3 shrink-0 h-8 text-xs">
                                <TabsTrigger value="approvals" className="text-xs py-1">Approvals</TabsTrigger>
                                <TabsTrigger value="milestones" className="text-xs py-1">Milestones</TabsTrigger>
                                <TabsTrigger value="payments" className="text-xs py-1">Payments</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 mt-2 pb-4 h-full min-h-0">
                                {/* Approvals Tab */}
                                <TabsContent value="approvals" className="m-0 space-y-2">
                                    {loadingDetails ? (
                                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
                                    ) : projectDetails?.history.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">No approval history.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {projectDetails?.history.map((record) => (
                                                <div key={record.id} className="flex gap-2 p-2 border rounded-lg bg-muted/20">
                                                    <div className="mt-0.5 shrink-0">
                                                        {record.status === 'approved'
                                                            ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                            : <XCircle className="h-4 w-4 text-red-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-0.5">
                                                        <div className="flex justify-between items-center gap-2">
                                                            <p className="text-xs font-semibold truncate">{record.stage?.stage_name || 'Stage'}</p>
                                                            <Badge variant={record.status === 'approved' ? 'default' : 'destructive'} className="capitalize text-[10px] shrink-0">{record.status}</Badge>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <User className="h-2.5 w-2.5" /> {record.approver?.name}
                                                            <span className="mx-1">·</span>
                                                            <Clock className="h-2.5 w-2.5" /> {new Date(record.action_date).toLocaleString()}
                                                        </p>
                                                        {record.stage?.fund_head?.name && (
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Building className="h-2.5 w-2.5" /> {record.stage.fund_head.name}
                                                            </p>
                                                        )}
                                                        {record.comments && (
                                                            <p className="text-[10px] bg-muted/50 px-2 py-1 rounded border italic">"{record.comments}"</p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {record.pdf && (
                                                                <a href={`/${record.pdf}`} target="_blank" className="text-blue-600 underline text-[10px]">PDF</a>
                                                            )}
                                                            {record.img && (
                                                                <ImagePreview dataImg={record.img} size="h-12" className="rounded border" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Milestones Tab */}
                                <TabsContent value="milestones" className="m-0">
                                    {projectDetails?.milestones.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">No milestones found.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {projectDetails?.milestones.map((milestone) => (
                                                <div key={milestone.id} className="p-2 border rounded-lg bg-muted/20 space-y-1 text-xs">
                                                    <div className="flex justify-between items-start gap-1">
                                                        <p className="font-semibold leading-tight">{milestone.name}</p>
                                                        <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'} className="text-[9px] shrink-0">{milestone.status}</Badge>
                                                    </div>
                                                    {milestone.img && (
                                                        <ImagePreview dataImg={milestone.img} size="h-20" className="w-full object-cover rounded" />
                                                    )}
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                                                        <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" /> {milestone.days}d</span>
                                                        {milestone.completed_date && (
                                                            <span className="flex items-center gap-0.5 text-green-600"><CheckCircle className="h-2.5 w-2.5" /> {new Date(milestone.completed_date).toLocaleDateString()}</span>
                                                        )}
                                                        {milestone.pdf && (
                                                            <a href={`/${milestone.pdf}`} target="_blank" className="text-blue-600 underline">PDF</a>
                                                        )}
                                                    </div>
                                                    {milestone.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{milestone.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Payments Tab */}
                                <TabsContent value="payments" className="m-0 space-y-1.5">
                                    {projectDetails?.payments.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">No payments recorded.</div>
                                    ) : (
                                        projectDetails?.payments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between px-3 py-2 border rounded-lg bg-muted/20 text-xs">
                                                <div>
                                                    <p className="font-bold">{payment.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-muted-foreground">{payment.fund_head?.name || 'General Fund'} · {new Date(payment.added_date).toLocaleDateString()}</p>
                                                    {payment.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{payment.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {payment.img && <ImagePreview dataImg={payment.img} size="h-10" className="rounded border" />}
                                                    <Badge variant={payment.status === 'Approved' ? 'default' : 'outline'} className="text-[10px]">{payment.status}</Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <DialogFooter className="px-4 py-2 border-t shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setProjectModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
