import React, { useState, useEffect } from 'react';
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

interface ApprovalProps {
    isOpen: boolean;
    onClose: () => void;
    project: { id: number; name: string; current_stage_id?: number; overall_status: string } | null;
}

interface ApprovalHistory {
    id: number;
    status: string;
    comments: string;
    action_date: string;
    approver: { name: string };
    stage: { stage_name: string };
}

export default function ApprovalModal({ isOpen, onClose, project }: ApprovalProps) {
    const [comment, setComment] = useState('');
    const [history, setHistory] = useState<ApprovalHistory[]>([]);
    const [loading, setLoading] = useState(false);

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
        router.post(
            `/projects/${project.id}/approvals`,
            { status, comments: comment },
            {
                onSuccess: () => {
                    toast.success(`Project ${status} successfully`);
                    onClose();
                    setComment('');
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
                                        </div>
                                    </div>
                                ))
                            )}
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
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
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
                            Approve
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
