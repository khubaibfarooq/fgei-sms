import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Plus, Edit, Trash2 } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';

interface ApprovalStage {
    id: number;
    stage_name: string;
    stage_order: number;
    is_user_required: boolean;
    is_mandatory: boolean;
    level: string;
    is_last: boolean;
    can_change_cost: boolean;
    users_can_approve: number[] | null;
    fund_head: {
        id: number;
        name: string;
    } | null;
}

interface User {
    id: number;
    name: string;
}

interface FundHead {
    id: number;
    name: string;
}

interface Props {
    stages: ApprovalStage[];
    users: User[];
    fundHeads: FundHead[];
    filters: {
        fund_head_id: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Approval Stages', href: '/approval-stages' },
];

export default function ApprovalStagesIndex({ stages, users, fundHeads, filters }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this stage?')) {
            router.delete(`/approval-stages/${id}`, {
                onSuccess: () => toast.success('Stage deleted successfully'),
            });
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.get('/approval-stages',
            { fund_head_id: e.target.value },
            { preserveState: true, preserveScroll: true }
        );
    };

    const getUserNames = (userIds: number[] | null) => {
        if (!userIds || userIds.length === 0) return '-';
        return userIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approval Stages" />
            <div className="flex-1 p-4 md:p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Approval Stages</CardTitle>
                        <div className="flex gap-2">
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filters?.fund_head_id || ''}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Fund Heads</option>
                                {fundHeads.map((head) => (
                                    <option key={head.id} value={head.id}>
                                        {head.name}
                                    </option>
                                ))}
                            </select>
                            <Link href="/approval-stages/create">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" /> Add Stage
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr className="border-b">
                                        <th className="p-3 text-left font-medium">Order</th>
                                        <th className="p-3 text-left font-medium">Stage Name</th>
                                        <th className="p-3 text-left font-medium">Fund Head</th>
                                        <th className="p-3 text-left font-medium">Level</th>
                                        <th className="p-3 text-left font-medium">User Req?</th>
                                        <th className="p-3 text-left font-medium">Last Stage?</th>
                                        <th className="p-3 text-left font-medium">Change Cost?</th>
                                        <th className="p-3 text-left font-medium">Approvers</th>
                                        <th className="p-3 text-left font-medium">Mandatory</th>
                                        <th className="p-3 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stages.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center text-muted-foreground p-6">
                                                No approval stages defined.
                                            </td>
                                        </tr>
                                    ) : (
                                        stages.map((stage) => (
                                            <tr key={stage.id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="p-3">{stage.stage_order}</td>
                                                <td className="p-3 font-medium">{stage.stage_name}</td>
                                                <td className="p-3">{stage.fund_head?.name || '-'}</td>
                                                <td className="p-3 capitalize">{stage.level}</td>
                                                <td className="p-3">{stage.is_user_required ? 'Yes' : 'No'}</td>
                                                <td className="p-3">{stage.is_last ? 'Yes' : 'No'}</td>
                                                <td className="p-3">{stage.can_change_cost ? 'Yes' : 'No'}</td>
                                                <td className="p-3 max-w-xs truncate" title={getUserNames(stage.users_can_approve)}>
                                                    {getUserNames(stage.users_can_approve)}
                                                </td>
                                                <td className="p-3">{stage.is_mandatory ? 'Yes' : 'No'}</td>
                                                <td className="p-3 flex gap-2">
                                                    <Link href={`/approval-stages/${stage.id}/edit`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(stage.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
