import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import {
    Calendar,
    FileText,
    Check,
    User,
    Building,
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
import { format } from 'date-fns';
import axios from 'axios';

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
}

interface FundHead {
    id: number;
    name: string;
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Funds', href: '/funds' },
    { title: 'Pending Transactions', href: '#' },
];

export default function PendingTrans({ transactions, summary, fundHeads, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [fromDate, setFromDate] = useState(filters.from || '');
    const [toDate, setToDate] = useState(filters.to || '');
    const [fundHeadId, setFundHeadId] = useState(filters.fund_head_id || '');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<FundTransaction | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);

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
                                                        {transaction.amount.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="border p-3 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => openApprovalModal(transaction)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
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
        </AppLayout>
    );
}
