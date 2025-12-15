import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import MultiSelect from '@/components/ui/MultiSelect'; // We need to check if this exists or use a simple alternative

// Assuming MultiSelect is not available or we need a simple implementation for users
// If MultiSelect is not available, we can use a simple multiple select or just a list of checkboxes.
// For now, I'll use a simple multi-select simulation or assume the user wants something simple.
// I will check the components folder first.

interface Props {
    stage?: {
        id: number;
        stage_name: string;
        project_type_id: number;
        stage_order: number;
        description: string | null;
        is_mandatory: boolean;
        users_can_approve: number[] | null;
    };
    projectTypes: { id: number; name: string }[];
    users: { id: number; name: string }[];
}

export default function ApprovalStageForm({ stage, projectTypes, users }: Props) {
    const isEdit = !!stage;
    const [data, setData] = useState({
        stage_name: stage?.stage_name || '',
        project_type_id: stage?.project_type_id?.toString() || '',
        stage_order: stage?.stage_order?.toString() || '',
        description: stage?.description || '',
        is_mandatory: stage?.is_mandatory ?? true,
        users_can_approve: stage?.users_can_approve || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            router.put(`/approval-stages/${stage.id}`, data, {
                onSuccess: () => toast.success('Stage updated successfully'),
            });
        } else {
            router.post('/approval-stages', data, {
                onSuccess: () => toast.success('Stage created successfully'),
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Approval Stages', href: '/approval-stages' },
        { title: isEdit ? 'Edit Stage' : 'Create Stage', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Stage' : 'Create Stage'} />
            <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEdit ? 'Edit Approval Stage' : 'Define New Stage'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Stage Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={data.stage_name}
                                    onChange={(e) => setData({ ...data, stage_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Project Type <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.project_type_id}
                                    onValueChange={(val) => setData({ ...data, project_type_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Project Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projectTypes.map((pt) => (
                                            <SelectItem key={pt.id} value={pt.id.toString()}>
                                                {pt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Stage Order (Sequence) <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    value={data.stage_order}
                                    onChange={(e) => setData({ ...data, stage_order: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="mandatory"
                                    checked={data.is_mandatory}
                                    onCheckedChange={(checked) => setData({ ...data, is_mandatory: !!checked })}
                                />
                                <Label htmlFor="mandatory">Is Mandatory?</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Approvers (Users)</Label>
                                <MultiSelect
                                    options={users.map(u => ({ value: u.id.toString(), label: u.name }))}
                                    value={(data.users_can_approve || []).map(id => id.toString())}
                                    onChange={(vals) => setData({ ...data, users_can_approve: vals.map(v => parseInt(v)) })}
                                    placeholder="Select Approvers..."
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Link href="/approval-stages">
                                    <Button variant="outline" type="button">
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                </Link>
                                <Button type="submit">
                                    <Save className="w-4 h-4 mr-2" /> Save Stage
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
