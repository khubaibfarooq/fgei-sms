import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

interface FundHead {
    id: number;
    name: string;
}

interface FundHeadRow {
    fund_head_id: string;
    sanction_amount: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    project: { id: number; name: string; fund_head_id?: Record<string, number> | null } | null;
    fundHeads: FundHead[];
    onSuccess: () => void;
}

const emptyRow = (): FundHeadRow => ({ fund_head_id: '', sanction_amount: '' });

const FundHeadSelectModal = ({ isOpen, onClose, project, fundHeads, onSuccess }: Props) => {
    const [rows, setRows] = useState<FundHeadRow[]>([emptyRow()]);
    const [loading, setLoading] = useState(false);

    // Pre-fill rows from existing fund_head_id JSON when modal opens
    useEffect(() => {
        if (isOpen && project?.fund_head_id && Object.keys(project.fund_head_id).length > 0) {
            const existing = Object.entries(project.fund_head_id).map(([id, amt]) => ({
                fund_head_id: id,
                sanction_amount: amt.toString(),
            }));
            setRows(existing);
        } else if (isOpen) {
            setRows([emptyRow()]);
        }
    }, [isOpen, project]);

    const addRow = () => setRows(prev => [...prev, emptyRow()]);

    const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

    const updateRow = (i: number, field: keyof FundHeadRow, value: string) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

    const totalSanctionAmount = rows.reduce((sum, r) => {
        const amt = parseFloat(r.sanction_amount);
        return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const handleSubmit = async () => {
        if (!project) return;

        const validRows = rows.filter(r => r.fund_head_id && r.sanction_amount);
        if (validRows.length === 0) {
            toast.error('Please add at least one fund head with a sanction amount.');
            return;
        }

        const invalidAmounts = validRows.filter(r => parseFloat(r.sanction_amount) <= 0);
        if (invalidAmounts.length > 0) {
            toast.error('All sanction amounts must be greater than zero.');
            return;
        }

        // Check for duplicate fund heads
        const ids = validRows.map(r => r.fund_head_id);
        if (new Set(ids).size !== ids.length) {
            toast.error('Duplicate fund heads are not allowed. Each fund head must be unique.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`/projects/${project.id}/select-head`, {
                fund_heads: validRows.map(r => ({
                    fund_head_id: parseInt(r.fund_head_id),
                    sanction_amount: parseFloat(r.sanction_amount),
                })),
            });

            toast.success(
                validRows.length > 1
                    ? `${validRows.length} fund heads assigned. Approval workflow initialized.`
                    : 'Fund head selected. Approval workflow initialized.'
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message
                || error.response?.data?.errors
                || 'Failed to assign fund heads.';
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Select Fund Heads</DialogTitle>
                    <DialogDescription>
                        Assign fund heads with sanction amounts for{' '}
                        <strong>{project.name}</strong>.
                        If multiple heads share the same approval stage name, one stage is created; otherwise separate stages are created.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto pr-1">
                    {/* Header labels */}
                    <div className="grid grid-cols-[1fr_7rem_2rem] gap-2 px-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Fund Head</Label>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Sanction Amount</Label>
                        <span />
                    </div>

                    {rows.map((row, i) => (
                        <div key={i} className="grid grid-cols-[1fr_7rem_2rem] items-center gap-2">
                            {/* Fund Head Select */}
                            <Select
                                value={row.fund_head_id}
                                onValueChange={(val) => updateRow(i, 'fund_head_id', val)}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Select fund head" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fundHeads.map(fh => (
                                        <SelectItem
                                            key={fh.id}
                                            value={fh.id.toString()}
                                            disabled={rows.some(
                                                (r, ri) => ri !== i && r.fund_head_id === fh.id.toString()
                                            )}
                                        >
                                            {fh.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Amount Input */}
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                placeholder="Amount"
                                className="h-9 text-sm"
                                value={row.sanction_amount}
                                onChange={(e) => updateRow(i, 'sanction_amount', e.target.value)}
                            />

                            {/* Remove Row */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={rows.length === 1}
                                onClick={() => removeRow(i)}
                                title="Remove"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    {/* Add Row Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-dashed"
                        onClick={addRow}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Another Fund Head
                    </Button>
                </div>

                {/* Total */}
                {rows.some(r => r.sanction_amount) && (
                    <div className="text-sm font-medium text-right text-muted-foreground border-t pt-2">
                        Total Sanction: <span className="text-foreground font-bold">
                            Rs. {totalSanctionAmount.toLocaleString()}
                        </span>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FundHeadSelectModal;
