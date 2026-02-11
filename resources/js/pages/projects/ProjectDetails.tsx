import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Eye, FileText, Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from '@/components/ui/image-preview2';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Project {
    id: number;
    name: string;
    description?: string | null;
    estimated_cost: number;
    actual_cost: number | null;
    pdf: string | null;
    structural_plan: string | null;
    final_comments: string | null;
    status: string;
    approval_status: string;
    priority: string;
    completion_per?: number;
    institute: {
        name: string;
    };
    contractor?: {
        name: string;
        contact?: string | null;
        email?: string | null;
        address?: string | null;
        company?: {
            name: string;
            contact?: string | null;
            email?: string | null;
            address?: string | null;
        } | null;
    };
    fund_head?: {
        name: string;
    };
    projecttype?: {
        name: string;
    };
    current_stage?: {
        stage_name: string;
        level?: string;
        can_change_cost?: boolean;
        is_last?: boolean;
    };
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

interface Payment {
    id: number;
    amount: number;
    status: string;
    added_date: string;
    img: string | null;
    description: string | null;
    fund_head?: {
        name: string;
    };
}

interface ProjectImage {
    id: number;
    project_id: number;
    desc: string | null;
    date: string | null;
    image: string;
}

interface Props {
    project: Project;
    canEditMilestones: boolean;
}

const formatAmount = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)} Mn`;
    }
    return value.toLocaleString();
};

export default function ProjectDetails({ project, canEditMilestones }: Props) {
    const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
    const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
    const [projectPayments, setProjectPayments] = useState<Payment[]>([]);
    const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Image Upload State
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
    const [imageForm, setImageForm] = useState({ desc: '', date: '', image: null as File | null });
    const [uploadingImage, setUploadingImage] = useState(false);

    // Description Modal State
    const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
    const [contractorModalOpen, setContractorModalOpen] = useState(false);

    // Milestone Edit State
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [milestoneForm, setMilestoneForm] = useState({
        name: '',
        description: '',
        days: 0,
        status: '',
        completed_date: '',
        img: null as File | null,
        pdf: null as File | null,
    });
    const [savingMilestone, setSavingMilestone] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}/details` },
    ];

    // Fetch project details data
    useEffect(() => {
        const fetchDetails = async () => {
            setLoadingData(true);
            try {
                const [historyRes, milestonesRes, paymentsRes, imagesRes] = await Promise.all([
                    axios.get(`/projects/${project.id}/history`),
                    axios.get(`/projects/${project.id}/milestones`),
                    axios.get(`/projects/${project.id}/payments`),
                    axios.get(`/projects/${project.id}/images`)
                ]);
                setApprovalHistory(historyRes.data);
                setProjectMilestones(milestonesRes.data);
                setProjectPayments(paymentsRes.data.payments);
                setProjectImages(imagesRes.data);
            } catch (error) {
                console.error("Failed to fetch project details", error);
                toast.error("Failed to load project details.");
            } finally {
                setLoadingData(false);
            }
        };
        fetchDetails();
    }, [project.id]);

    const handleMilestoneClick = (milestone: Milestone) => {
        setEditingMilestone(milestone);
        setMilestoneForm({
            name: milestone.name,
            description: milestone.description || '',
            days: milestone.days || 0,
            status: milestone.status,
            completed_date: milestone.completed_date ? milestone.completed_date.split('T')[0] : '',
            img: null as File | null,
            pdf: null as File | null,
        });
    };

    const handleMilestoneUpdate = async () => {
        if (!editingMilestone) return;
        setSavingMilestone(true);

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', milestoneForm.name);
        formData.append('days', milestoneForm.days.toString());
        formData.append('status', milestoneForm.status);
        formData.append('description', milestoneForm.description);

        if (milestoneForm.status === 'completed' && milestoneForm.completed_date) {
            formData.append('completed_date', milestoneForm.completed_date);
        } else {
            formData.append('completed_date', '');
        }

        if (milestoneForm.img) {
            formData.append('img', milestoneForm.img);
        }
        if (milestoneForm.pdf) {
            formData.append('pdf', milestoneForm.pdf);
        }

        try {
            await axios.post(`/milestones/${editingMilestone.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success("Milestone updated successfully");
            setEditingMilestone(null);
            // Refresh milestones
            const res = await axios.get(`/projects/${project.id}/milestones`);
            setProjectMilestones(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update milestone");
        } finally {
            setSavingMilestone(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Project: ${project.name}`} />
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="p-3 pb-2 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div className="flex-2 flex items-start gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.history.back()}
                                className="h-8 w-8 -ml-2 shrink-0"
                                title="Back"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle className="text-lg font-bold leading-tight">{project.name}</CardTitle>
                                <p className="text-muted-foreground text-xs">{project.institute?.name}</p>
                            </div>
                        </div>
                        {project.pdf && (
                            <a
                                href={`/assets/${project.pdf}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium h-8"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                View PDF
                            </a>

                        )}
                        {project.structural_plan && (
                            <a
                                href={`/assets/${project.structural_plan}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium h-8"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                View Structural Plan
                            </a>
                        )}
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                    <div className="p-3 pb-2 space-y-2 shrink-0">
                        <div className="flex flex-wrap gap-2 items-center text-xs">
                            <Badge variant="outline" className={`h-5 px-2 text-[10px] ${project.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                                project.status === 'inprogress' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                    'border-gray-500 text-gray-600 bg-gray-50'
                                }`}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </Badge>
                            <Badge variant="outline" className={`h-5 px-2 text-[10px] ${project.approval_status === 'approved' ? 'border-green-500 text-green-600 bg-green-50' :
                                project.approval_status === 'rejected' ? 'border-red-500 text-red-600 bg-red-50' :
                                    'border-yellow-500 text-yellow-600 bg-yellow-50'
                                }`}>
                                {project.approval_status.charAt(0).toUpperCase() + project.approval_status.slice(1)}
                            </Badge>
                            <div className="text-muted-foreground ml-auto hidden sm:block text-[10px] uppercase tracking-wider font-semibold">
                                {project.current_stage?.stage_name || 'Held with Regional Office'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2 bg-muted/20 p-2 rounded-md border text-xs">
                            {/* Project Type */}
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</p>
                                <p className="font-medium truncate" title={project.projecttype?.name}>{project.projecttype?.name || '-'}</p>
                            </div>

                            {/* Priority */}
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Priority</p>
                                <p className="font-medium capitalize">{project.priority || '-'}</p>
                            </div>

                            {/* Fund Head */}
                            <div className="sm:col-span-2 lg:col-span-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fund Head</p>
                                <p className="font-medium truncate" title={project.fund_head?.name}>{project.fund_head?.name || '-'}</p>
                            </div>

                            {/* Contractor */}
                            <div className="sm:col-span-2 lg:col-span-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contractor</p>
                                <div className="flex items-center gap-1">
                                    <p className="font-medium truncate" title={project.contractor?.name}>{project.contractor?.name || '-'}</p>
                                    {project.contractor && (
                                        <button
                                            onClick={() => setContractorModalOpen(true)}
                                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                            title="View Contractor Details"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Estimated Cost */}
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Cost</p>
                                <p className="font-medium">{formatAmount(project.estimated_cost)}</p>
                            </div>

                            {/* Actual Cost */}
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Act. Cost</p>
                                <p className="font-medium">{formatAmount(project.actual_cost)}</p>
                            </div>

                            {/* Completion Percentage */}
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</p>
                                <p className="font-medium">{project.completion_per ? `${parseFloat(project.completion_per.toString())}%` : '-'}</p>
                            </div>

                            {/* Description Truncated */}
                            {project.description && (
                                <div className="col-span-2 sm:col-span-4 lg:col-span-6 border-t pt-1 mt-1">
                                    <div className="flex items-start gap-1">
                                        <p className="flex-1 text-muted-foreground line-clamp-1 italic text-[11px]">{project.description}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                            onClick={() => setDescriptionModalOpen(true)}
                                            title="View Full Description"
                                        >
                                            <Eye className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs Section (Merged) */}
                    <div className="flex-1 flex flex-col min-h-0 border-t">
                        <Tabs defaultValue="approvals" className="flex flex-col h-full w-full">
                            <div className="px-4 border-b bg-muted/20">
                                <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                                    <TabsTrigger value="approvals" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-3 bg-transparent">Approvals</TabsTrigger>
                                    <TabsTrigger value="milestones" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-3 bg-transparent">Milestones</TabsTrigger>
                                    <TabsTrigger value="payments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-3 bg-transparent">Payments</TabsTrigger>
                                    <TabsTrigger value="images" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-3 bg-transparent flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> Images</TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
                                {/* Approvals Tab */}
                                <TabsContent value="approvals" className="mt-0 space-y-3 h-full">
                                    {loadingData ? (
                                        <div className="flex justify-center py-8 text-muted-foreground">Loading history...</div>
                                    ) : approvalHistory.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                            No approval history found.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {approvalHistory.map((record) => (
                                                <Card key={record.id} className="overflow-hidden border shadow-sm">
                                                    <CardHeader className="p-2 bg-muted/30 pb-1 border-b">
                                                        <div className="flex justify-between items-center">
                                                            <div className="font-semibold text-xs">{record.stage?.stage_name || 'Stage'}</div>
                                                            {record.status === 'approved' ? (
                                                                <Badge variant="outline" className="h-4 border-green-500 text-green-600 bg-green-50 gap-1 px-1 py-0 text-[10px]">
                                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                                                                </Badge>
                                                            ) : record.status === 'rejected' ? (
                                                                <Badge variant="outline" className="h-4 border-red-500 text-red-600 bg-red-50 gap-1 px-1 py-0 text-[10px]">
                                                                    <XCircle className="w-2.5 h-2.5" /> Rejected
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="h-4 border-yellow-500 text-yellow-600 bg-yellow-50 gap-1 px-1 py-0 text-[10px]">
                                                                    <Clock className="w-2.5 h-2.5" /> Pending
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-2 text-xs">
                                                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                                            <div className="text-[10px] text-muted-foreground flex items-center">
                                                                <Clock className="w-2.5 h-2.5 mr-1" />
                                                                {record.action_date ? new Date(record.action_date).toLocaleString() : "-"}
                                                            </div>
                                                            <div className="text-[10px]">
                                                                <span className="font-medium text-muted-foreground">Appr: </span>
                                                                {record.approver?.name}
                                                            </div>
                                                        </div>

                                                        {record.comments && (
                                                            <div className="bg-muted/50 px-2 py-1 rounded text-[10px] italic border mt-1 line-clamp-2">
                                                                "{record.comments}"
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {record.pdf && (
                                                                <a
                                                                    href={`/${record.pdf}`}
                                                                    target="_blank"
                                                                    className="text-blue-600 hover:underline text-[10px] flex items-center gap-1"
                                                                >
                                                                    <FileText className="h-3 w-3" /> PDF
                                                                </a>
                                                            )}
                                                            {record.img && (
                                                                <div className="flex items-center gap-1">
                                                                    <ImagePreview
                                                                        dataImg={record.img}
                                                                        size="h-4 w-4"
                                                                        className="rounded border object-cover"
                                                                    />
                                                                    <span className="text-[10px] text-muted-foreground">Image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Milestones Tab */}
                                <TabsContent value="milestones" className="mt-0 space-y-3 h-full">
                                    {loadingData ? (
                                        <div className="flex justify-center py-8 text-muted-foreground">Loading milestones...</div>
                                    ) : projectMilestones.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                            No milestones found.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {projectMilestones.map((milestone) => (
                                                <Card
                                                    key={milestone.id}
                                                    className={`border shadow-sm overflow-hidden ${canEditMilestones ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                                                    onClick={() => canEditMilestones && handleMilestoneClick(milestone)}
                                                >
                                                    <div className="flex items-start">
                                                        {milestone.img && (
                                                            <div className="w-16 h-16 shrink-0">
                                                                <ImagePreview
                                                                    dataImg={milestone.img}
                                                                    size="h-16 w-16"
                                                                    className="h-16 w-16 object-cover rounded-none"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <CardHeader className="p-2 py-1.5 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
                                                                <div className="font-semibold text-xs truncate pr-2">{milestone.name}</div>
                                                                <Badge variant={
                                                                    milestone.status === 'completed' ? 'default' :
                                                                        milestone.status === 'inprogress' ? 'secondary' : 'outline'
                                                                } className="capitalize text-[10px] px-1 py-0 h-4 shrink-0">
                                                                    {milestone.status}
                                                                </Badge>
                                                            </CardHeader>
                                                            <CardContent className="p-2 text-xs space-y-1">
                                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                                    <span>Due: {milestone.days} days</span>
                                                                    {milestone.completed_date && (
                                                                        <span className="text-green-600 dark:text-green-400">Done: {new Date(milestone.completed_date).toLocaleDateString()}</span>
                                                                    )}
                                                                </div>
                                                                {milestone.description && (
                                                                    <p className="text-muted-foreground text-[10px] line-clamp-1">
                                                                        {milestone.description}
                                                                    </p>
                                                                )}
                                                                {milestone.pdf && (
                                                                    <a
                                                                        href={`/assets/${milestone.pdf}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-blue-600 hover:underline text-[10px] flex items-center gap-1 mt-0.5"
                                                                    >
                                                                        <FileText className="h-3 w-3" /> View PDF
                                                                    </a>
                                                                )}
                                                            </CardContent>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Payments Tab */}
                                <TabsContent value="payments" className="mt-0 space-y-3 h-full">
                                    {loadingData ? (
                                        <div className="flex justify-center py-8 text-muted-foreground">Loading payments...</div>
                                    ) : projectPayments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                            No payments found.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {projectPayments.map((payment) => (
                                                <Card key={payment.id} className="border shadow-sm">
                                                    <CardHeader className="p-2 py-1.5 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
                                                        <div className="font-semibold text-xs">Rs. {payment.amount.toLocaleString()}</div>
                                                        <Badge variant="outline" className={`capitalize text-[10px] px-1 py-0 h-4 ${payment.status === 'Approved' ? 'border-green-500 text-green-600 bg-green-50' :
                                                            payment.status === 'Rejected' ? 'border-red-500 text-red-600 bg-red-50' :
                                                                'border-yellow-500 text-yellow-600 bg-yellow-50'
                                                            }`}>
                                                            {payment.status}
                                                        </Badge>
                                                    </CardHeader>
                                                    <CardContent className="p-2 text-xs space-y-1">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <div className="text-muted-foreground font-medium truncate max-w-[150px]" title={payment.fund_head?.name || 'General Fund'}>
                                                                {payment.fund_head?.name || 'General Fund'}
                                                            </div>
                                                            <div className="text-muted-foreground">
                                                                {new Date(payment.added_date).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        {payment.description && (
                                                            <p className="text-muted-foreground text-[10px] italic bg-muted/30 px-1.5 py-0.5 rounded truncate">
                                                                "{payment.description}"
                                                            </p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Images Tab */}
                                <TabsContent value="images" className="mt-0 space-y-3 h-full">
                                    {loadingData ? (
                                        <div className="flex justify-center py-8 text-muted-foreground">Loading images...</div>
                                    ) : (
                                        <div className="space-y-3">


                                            {projectImages.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                                    No images found.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {projectImages.map((img) => (
                                                        <Card key={img.id} className="overflow-hidden border shadow-sm">
                                                            <div className="relative group">
                                                                <ImagePreview
                                                                    dataImg={`assets/${img.image}`}
                                                                    size="w-full h-32 object-cover"
                                                                />

                                                            </div>
                                                            <CardContent className="p-2">
                                                                {img.desc && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1" title={img.desc}>{img.desc}</p>
                                                                )}
                                                                {img.date && (
                                                                    <p className="text-[10px] text-muted-foreground block">{new Date(img.date).toLocaleDateString()}</p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </CardContent>
            </Card >

            {/* Description Modal */}
            < Dialog open={descriptionModalOpen} onOpenChange={setDescriptionModalOpen} >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Project Description</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Contractor Details Modal */}
            < Dialog open={contractorModalOpen} onOpenChange={setContractorModalOpen} >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Contractor Details</DialogTitle>
                    </DialogHeader>
                    {project.contractor && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                                    <span className="text-muted-foreground font-medium">Name:</span>
                                    <span>{project.contractor.name}</span>
                                    <span className="text-muted-foreground font-medium">Contact:</span>
                                    <span>{project.contractor.contact || '-'}</span>
                                    <span className="text-muted-foreground font-medium">Email:</span>
                                    <span>{project.contractor.email || '-'}</span>
                                    <span className="text-muted-foreground font-medium">Address:</span>
                                    <span>{project.contractor.address || '-'}</span>
                                </div>
                            </div>
                            {project.contractor.company && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">Company Details</h4>
                                        <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                                            <span className="text-muted-foreground font-medium">Name:</span>
                                            <span>{project.contractor.company.name}</span>
                                            <span className="text-muted-foreground font-medium">Contact:</span>
                                            <span>{project.contractor.company.contact || '-'}</span>
                                            <span className="text-muted-foreground font-medium">Email:</span>
                                            <span>{project.contractor.company.email || '-'}</span>
                                            <span className="text-muted-foreground font-medium">Address:</span>
                                            <span>{project.contractor.company.address || '-'}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog >

            {/* Milestone Edit Modal */}
            < Dialog open={!!editingMilestone
            } onOpenChange={(open) => !open && setEditingMilestone(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Milestone</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={milestoneForm.name}
                                onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={milestoneForm.description}
                                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Days</Label>
                                <Input
                                    type="number"
                                    value={milestoneForm.days}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, days: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={milestoneForm.status}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="inprogress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        {milestoneForm.status === 'completed' && (
                            <div>
                                <Label>Completed Date</Label>
                                <Input
                                    type="date"
                                    value={milestoneForm.completed_date}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, completed_date: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, img: e.target.files?.[0] || null })}
                                />
                            </div>
                            <div>
                                <Label>PDF</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, pdf: e.target.files?.[0] || null })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingMilestone(null)}>Cancel</Button>
                        <Button onClick={handleMilestoneUpdate} disabled={savingMilestone}>
                            {savingMilestone ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Image Upload Modal */}
            < Dialog open={imageUploadModalOpen} onOpenChange={setImageUploadModalOpen} >
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Upload Project Image</DialogTitle>
                        <DialogDescription>
                            Add a new image for <strong>{project.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="img_file" className="text-right">Image</Label>
                            <Input
                                id="img_file"
                                type="file"
                                accept="image/*"
                                className="col-span-3"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageForm({ ...imageForm, image: e.target.files[0] });
                                    }
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="img_desc" className="text-right">Description</Label>
                            <Textarea
                                id="img_desc"
                                placeholder="Describe the image..."
                                className="col-span-3"
                                value={imageForm.desc}
                                onChange={(e) => setImageForm({ ...imageForm, desc: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="img_date" className="text-right">Date</Label>
                            <Input
                                id="img_date"
                                type="date"
                                className="col-span-3"
                                value={imageForm.date}
                                onChange={(e) => setImageForm({ ...imageForm, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setImageUploadModalOpen(false)}>Cancel</Button>
                        <Button
                            disabled={uploadingImage || !imageForm.image}
                            onClick={async () => {
                                if (!imageForm.image) return;
                                setUploadingImage(true);
                                const formData = new FormData();
                                formData.append('image', imageForm.image);
                                if (imageForm.desc) formData.append('desc', imageForm.desc);
                                if (imageForm.date) formData.append('date', imageForm.date);
                                try {
                                    await axios.post(`/projects/${project.id}/images`, formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                    toast.success('Image uploaded successfully');
                                    setImageUploadModalOpen(false);
                                    const res = await axios.get(`/projects/${project.id}/images`);
                                    setProjectImages(res.data);
                                } catch {
                                    toast.error('Failed to upload image');
                                } finally {
                                    setUploadingImage(false);
                                }
                            }}
                        >
                            {uploadingImage ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </AppLayout >
    );
}
