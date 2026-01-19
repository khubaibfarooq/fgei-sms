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
import { ImagePreview } from '@/components/ui/image-preview';
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
    stage: { stage_name: string };
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
            const [historyRes, milestonesRes, paymentsRes] = await Promise.all([
                axios.get(`/projects/${projectId}/history`),
                axios.get(`/projects/${projectId}/milestones`),
                axios.get(`/projects/${projectId}/payments`)
            ]);

            setProjectDetails({
                project: {
                    id: projectId,
                    name: tx.description,
                    estimated_cost: tx.amount,
                    actual_cost: null,
                    status: tx.status,
                    approval_status: tx.status,
                    priority: '',
                    institute: tx.institute,
                    description: tx.description,
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

            <div className="flex-1 p-2 md:p-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Pending Fund Transactions
                        </CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-3 space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {summary.total_count}
                                            </p>
                                        </div>
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Pending IN</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {summary.total_in.toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="default" className="bg-green-100 text-green-800">IN</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Pending OUT</p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {summary.total_out.toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="destructive" className="bg-red-100 text-red-800">OUT</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Regional Fund Head Balances */}
                        {balances.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Building className="h-5 w-5 text-primary" />
                                        Regional Fund Head Balances
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {balances.map((b, i) => (
                                        <div
                                            key={i}
                                            className="bg-muted/50 dark:bg-gray-800 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-default"
                                        >
                                            <p className="text-xs font-medium text-muted-foreground truncate">
                                                {b.fund_head.name}
                                            </p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
                                                {formatBalance(b.balance)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                            </div>
                        )}

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium mb-1">Search</label>
                                <Input
                                    placeholder="Search description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fund Head</label>
                                <Select value={fundHeadId} onValueChange={setFundHeadId}>
                                    <SelectTrigger>
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
                                <label className="block text-sm font-medium mb-1">From</label>
                                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">To</label>
                                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </div>
                        </div>

                        <Button onClick={applyFilters} className="w-full md:w-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Apply Filters
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            Showing {transactions.from} to {transactions.to} of {transactions.total} pending transactions
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-primary dark:bg-gray-800">
                                        <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Date</th>
                                        <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Fund Head</th>
                                        <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Institute</th>
                                        <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Description</th>
                                        <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Type</th>
                                        <th className="border p-3 text-right text-sm font-medium text-white dark:text-gray-200">Amount</th>
                                        <th className="border p-3 text-left text-sm font-medium text-white dark:text-gray-200">Added By</th>
                                        <th className="border p-3 text-center text-sm font-medium text-white dark:text-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="border p-8 text-center">
                                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-muted-foreground">No pending transactions found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.data.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="border p-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {new Date(transaction.added_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="border p-3 text-sm font-medium">{transaction.fund_head.name}</td>
                                                <td className="border p-3 text-sm">{transaction.institute.name}</td>
                                                <td className="border p-3 text-sm">{transaction.description}</td>
                                                <td className="border p-3 text-center">{getTypeBadge(transaction.type)}</td>
                                                <td className="border p-3 text-right text-sm font-medium">
                                                    <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                                                        {transaction.type === 'in' ? '+' : '-'}
                                                        {formatBalance(transaction.amount)}
                                                    </span>
                                                </td>
                                                <td className="border p-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {transaction.user.name}
                                                    </div>
                                                </td>
                                                <td className="border p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openDetails(transaction)}
                                                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => openApprovalModal(transaction)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Check className="h-4 w-4 mr-1" />
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
                            <div className="flex justify-center pt-6 flex-wrap gap-2">
                                {transactions.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
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
                <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            {projectDetails?.project.name}
                        </DialogTitle>
                        <DialogDescription>
                            {projectDetails?.project.institute.name}
                            <p className="text-sm text-muted-foreground">Description: {projectDetails?.project.description}</p>
                            <p className="text-sm text-muted-foreground">Estimated Cost: {projectDetails?.project.estimated_cost}</p>
                            <p className="text-sm text-muted-foreground">Actual Cost: {projectDetails?.project.actual_cost}</p>

                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 h-full min-h-0">
                        <Tabs defaultValue="approvals" className="w-full h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-3 shrink-0">
                                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                                <TabsTrigger value="payments">Payments</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 mt-4 pb-6 h-full min-h-0">
                                <TabsContent value="approvals" className="m-0 space-y-4">
                                    {loadingDetails ? (
                                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                                    ) : projectDetails?.history.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">No approval history.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {projectDetails?.history.map((record) => (
                                                <Card key={record.id} className="overflow-hidden">
                                                    <div className="p-4 flex gap-4">
                                                        <div className="mt-1">
                                                            {record.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-start">
                                                                <p className="font-semibold">{record.stage?.stage_name || 'Stage'}</p>
                                                                <Badge variant={record.status === 'approved' ? 'default' : 'destructive'} className="capitalize">{record.status}</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {record.approver?.name} • <Clock className="h-3 w-3 ml-1" /> {new Date(record.action_date).toLocaleString()}</p>
                                                            {record.comments && <p className="text-sm bg-muted/50 p-2 rounded mt-2 border italic">"{record.comments}"</p>}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="milestones" className="m-0 space-y-4">
                                    {projectDetails?.milestones.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">No milestones found.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {projectDetails?.milestones.map((milestone) => (
                                                <Card key={milestone.id} className="p-4 space-y-2">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="font-semibold text-sm">{milestone.name}</p>
                                                        <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">{milestone.status}</Badge>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground space-y-1">
                                                        <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due in: {milestone.days} days</p>
                                                        {milestone.completed_date && <p className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Done: {new Date(milestone.completed_date).toLocaleDateString()}</p>}
                                                    </div>
                                                    {milestone.description && <p className="text-xs text-muted-foreground line-clamp-2">{milestone.description}</p>}
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="payments" className="m-0 space-y-4">
                                    {projectDetails?.payments.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">No payments recorded.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {projectDetails?.payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                                    <div className="space-y-1">
                                                        <p className="font-bold">{payment.amount.toLocaleString()}</p>
                                                        <p className="text-xs text-muted-foreground">{payment.fund_head?.name || 'General Fund'} • {new Date(payment.added_date).toLocaleDateString()}</p>
                                                    </div>
                                                    <Badge variant={payment.status === 'Approved' ? 'default' : 'outline'}>{payment.status}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <DialogFooter className="p-6 border-t shrink-0">
                        <Button variant="outline" onClick={() => setProjectModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
