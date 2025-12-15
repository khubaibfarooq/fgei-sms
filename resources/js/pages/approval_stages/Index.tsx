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
    is_mandatory: boolean;
    project_type: {
        id: number;
        name: string;
    };
}

interface Props {
    stages: ApprovalStage[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Approval Stages', href: '/approval-stages' },
];

export default function ApprovalStagesIndex({ stages }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this stage?')) {
            router.delete(`/approval-stages/${id}`, {
                onSuccess: () => toast.success('Stage deleted successfully'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approval Stages" />
            <div className="flex-1 p-4 md:p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Approval Stages</CardTitle>
                        <Link href="/approval-stages/create">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" /> Add Stage
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr className="border-b">
                                        <th className="p-3 text-left font-medium">Order</th>
                                        <th className="p-3 text-left font-medium">Stage Name</th>
                                        <th className="p-3 text-left font-medium">Project Type</th>
                                        <th className="p-3 text-left font-medium">Mandatory</th>
                                        <th className="p-3 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stages.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted-foreground p-6">
                                                No approval stages defined.
                                            </td>
                                        </tr>
                                    ) : (
                                        stages.map((stage) => (
                                            <tr key={stage.id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="p-3">{stage.stage_order}</td>
                                                <td className="p-3 font-medium">{stage.stage_name}</td>
                                                <td className="p-3">{stage.project_type?.name || '-'}</td>
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
