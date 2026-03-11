import React, { useState, useEffect, useRef } from 'react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Input } from '@/components/ui/input';

interface ApprovalProps {
    isOpen: boolean;
    onClose: () => void;
    project: { id: number; name: string; current_stage_id?: number[] | null; approval_status: string } | null;
    onSuccess?: () => void;
}

interface ApprovalHistory {
    id: number;
    status: string;
    comments: string;
    action_date: string;
    approver: { name: string };
    stage: {
        stage_name: string;
        fund_head?: { name: string } | null;
    };
    pdf: string | null;
    img: string | null;
}

interface PendingStage {
    id: number;           // ProjectApproval row id
    stage_id: number;
    stage_name: string;
}

export default function ApprovalModal({ isOpen, onClose, project, onSuccess }: ApprovalProps) {

    const [comment, setComment] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [history, setHistory] = useState<ApprovalHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [pendingStages, setPendingStages] = useState<PendingStage[]>([]);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
    const historyEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (history.length > 0) scrollToBottom();
    }, [history]);

    useEffect(() => {
        if (isOpen && project) {
            fetchHistory();
            fetchPendingStages();
        } else {
            // Reset on close
            setComment('');
            setPdfFile(null);
            setImgFile(null);
            setPendingStages([]);
            setSelectedStageId(null);
        }
    }, [isOpen, project]);

    // Auto-select the only stage when there's just one
    useEffect(() => {
        if (pendingStages.length === 1) {
            setSelectedStageId(pendingStages[0].stage_id);
        }
    }, [pendingStages]);

    const fetchHistory = async () => {
        if (!project) return;
        try {
            const { data } = await axios.get(`/projects/${project.id}/history`);
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const fetchPendingStages = async () => {
        if (!project) return;
        try {
            const { data } = await axios.get(`/projects/${project.id}/pending-stages`);
            setPendingStages(data);
        } catch (error) {
            console.error('Failed to fetch pending stages', error);
        }
    };

    const handleAction = (status: 'approved' | 'rejected') => {
        if (!project) return;

        if (pendingStages.length > 1 && !selectedStageId) {
            toast.error('Please select a stage to act on.');
            return;
        }

        if (!pdfFile) {
            toast.error('Please upload a PDF file');
            return;
        }

        setLoading(true);

        const fd = new FormData();
        fd.append('status', status);
        fd.append('comments', comment);
        fd.append('pdf', pdfFile);
        if (imgFile) fd.append('img', imgFile);
        if (selectedStageId) fd.append('stage_id', selectedStageId.toString());

        router.post(
            `/projects/${project.id}/approvals`,
            fd,
            {
                forceFormData: true,
                onSuccess: () => {
                    toast.success(`Project ${status} successfully`);
                    if (onSuccess) onSuccess();
                    onClose();
                    setComment('');
                    setPdfFile(null);
                    setImgFile(null);
                    setSelectedStageId(null);
                },
                onError: () => {
                    toast.error('Failed to process approval');
                },
                onFinish: () => setLoading(false),
            }
        );
    };

    if (!project) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Project Approval: {project.name}</DialogTitle>
                    <DialogDescription>
                        Review project details and action approval.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-3">
                    {/* Approval History */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Approval History</h4>
                        <div className="border rounded-lg p-3 h-40 overflow-y-auto space-y-3 bg-muted/30">
                            {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No approval history.</p>
                            ) : (
                                history.map((record) => (
                                    <div key={record.id} className="flex gap-3 text-sm">
                                        {record.status === 'approved' ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        ) : record.status === 'pending' ? (
                                            <Clock className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        )}
                                        <div>
                                            <p className="font-medium text-xs">
                                                {record.stage?.stage_name || 'Stage'}
                                                {record.stage?.fund_head?.name && (
                                                    <span className="ml-2 text-[10px] font-normal bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-full">
                                                        {record.stage.fund_head.name}
                                                    </span>
                                                )}
                                                {' '}— <span className="capitalize">{record.status}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {record.approver?.name
                                                    ? `by ${record.approver.name} on ${record.action_date ? new Date(record.action_date).toLocaleString() : ''}`
                                                    : 'Awaiting approval'}
                                            </p>
                                            {record.comments && (
                                                <p className="mt-1 text-gray-700 dark:text-gray-300 bg-background p-1.5 rounded border text-xs">
                                                    "{record.comments}"
                                                </p>
                                            )}
                                            {record.pdf && (
                                                <a href={`/${record.pdf}`} target="_blank"
                                                    className="mt-1 text-blue-600 underline text-xs flex items-center gap-1">
                                                    View PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={historyEndRef} />
                        </div>
                    </div>

                    {/* Pending Stage Selection — shown only when multiple stages are pending */}
                    {pendingStages.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Select Stage to Act On
                                {pendingStages.length === 1 && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">(auto-selected)</span>
                                )}
                            </Label>
                            <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                                {pendingStages.map((stage) => (
                                    <label
                                        key={stage.id}
                                        className={`flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 transition-colors hover:bg-muted/50 ${selectedStageId === stage.stage_id
                                            ? 'bg-primary/10 border border-primary/30'
                                            : 'border border-transparent'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="pending_stage"
                                            value={stage.stage_id}
                                            checked={selectedStageId === stage.stage_id}
                                            onChange={() => setSelectedStageId(stage.stage_id)}
                                            className="accent-primary"
                                        />
                                        <span className="text-sm font-medium">{stage.stage_name}</span>
                                        <span className="ml-auto text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 px-1.5 py-0.5 rounded-full">
                                            Pending
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="space-y-2">
                        <Label htmlFor="comments">Comments</Label>
                        <Textarea
                            id="comments"
                            placeholder="Add comments for this action..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Attachments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pdf">Attachment (PDF) <span className="text-destructive">*</span></Label>
                            <Input
                                id="pdf"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="img">Attachment (Image)</Label>
                            <Input
                                id="img"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => handleAction('rejected')}
                            disabled={loading}
                        >
                            Reject
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction('approved')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Approve'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
