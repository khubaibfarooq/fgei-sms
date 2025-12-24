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
    project: { id: number; name: string; current_stage_id?: number; overall_status: string } | null;
    onSuccess?: () => void;
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

export default function ApprovalModal({ isOpen, onClose, project, onSuccess }: ApprovalProps) {

    const [comment, setComment] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [history, setHistory] = useState<ApprovalHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const historyEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (history.length > 0) {
            scrollToBottom();
        }
    }, [history]);


    useEffect(() => {
        if (isOpen && project) {
            fetchHistory();
        }
    }, [isOpen, project]);

    const fetchHistory = async () => {
        if (!project) return;
        try {
            const { data } = await axios.get(`/projects/${project.id}/history`);
            setHistory(data);

        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const handleAction = (status: 'approved' | 'rejected') => {
        if (!project) return;
        setLoading(true);

        const fd = new FormData();
        fd.append('status', status);
        fd.append('comments', comment);
        if (!pdfFile) {
            toast.error('Please upload a PDF file');
            return;
        }
        if (pdfFile) {
            fd.append('pdf', pdfFile);
        }
        if (imgFile) {
            fd.append('img', imgFile);
        }

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

                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Approval History</h4>
                        <div className="border rounded-lg p-4 h-48 overflow-y-auto space-y-4 bg-muted/30">
                            {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No approval history.</p>
                            ) : (
                                history.map((record) => (
                                    <div key={record.id} className="flex gap-3 text-sm">
                                        {record.status === 'approved' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {record.stage?.stage_name || 'Stage'} - {record.status}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                by {record.approver?.name} on {record.action_date ? new Date(record.action_date).toLocaleString() : ''}
                                            </p>
                                            {record.comments && (
                                                <p className="mt-1 text-gray-700 bg-white p-2 rounded border">
                                                    "{record.comments}"
                                                </p>
                                            )}
                                            {record.pdf && (
                                                <a
                                                    href={`/${record.pdf}`}
                                                    target="_blank"
                                                    className="mt-1 text-blue-600 underline text-xs flex items-center gap-1"
                                                >
                                                    View PDF
                                                </a>
                                            )}
                                            {record.img && (
                                                <div className="mt-2">
                                                    <img
                                                        src={`/${record.img}`}
                                                        alt="Approval evidence"
                                                        className="h-20 w-auto rounded border"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={historyEndRef} />
                        </div>
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="comments">Comments</Label>
                        <Textarea
                            id="comments"
                            placeholder="Add comments for this action..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pdf">Attachment (PDF)</Label>
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
                    <Button variant="outline" onClick={onClose} >
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => handleAction("rejected")}

                        >
                            Reject
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction("approved")}

                        >
                            Approve
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
