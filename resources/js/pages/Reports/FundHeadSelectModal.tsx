import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface FundHead {
    id: number;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    project: { id: number; name: string } | null;
    fundHeads: FundHead[];
    onSuccess: () => void;
}

const FundHeadSelectModal = ({ isOpen, onClose, project, fundHeads, onSuccess }: Props) => {
    const [selectedFundHead, setSelectedFundHead] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedFundHead) {
            toast.error('Please select a fund head.');
            return;
        }

        if (!project) return;

        router.post(`/projects/${project.id}/select-head`, {
            fund_head_id: selectedFundHead,
        }, {
            onSuccess: () => {
                toast.success('Fund head selected successfully. Approval workflow initialized.');
                onSuccess();
                onClose();
            },
            onError: (errors: any) => {
                console.error('Failed to select fund head', errors);
                toast.error('Failed to initialize approval workflow.');
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Fund Head</DialogTitle>
                    <DialogDescription>
                        Choose the fund head for project: <strong>{project?.name}</strong>. This will initialize the approval workflow.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fund_head" className="text-right">
                            Fund Head
                        </Label>
                        <div className="col-span-3">
                            <Select onValueChange={setSelectedFundHead} value={selectedFundHead}>
                                <SelectTrigger id="fund_head">
                                    <SelectValue placeholder="Select a fund head" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fundHeads.map((head) => (
                                        <SelectItem key={head.id} value={head.id.toString()}>
                                            {head.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Initializing...' : 'Confirm selection'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FundHeadSelectModal;
