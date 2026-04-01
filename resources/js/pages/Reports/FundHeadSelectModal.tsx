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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Trash2, Lock } from 'lucide-react';

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
    project: { id: number; name: string; fund_head_id?: Record<string, number | string> | null } | null;
    fundHeads: FundHead[];
    onSuccess: () => void;
}

const emptyRow = (): FundHeadRow => ({ fund_head_id: '', sanction_amount: '' });

const FundHeadSelectModal = ({ isOpen, onClose, project, fundHeads, onSuccess }: Props) => {
    // Existing (read-only) fund head rows
    const [existingRows, setExistingRows] = useState<FundHeadRow[]>([]);
    // New (editable) fund head rows to add
    const [newRows, setNewRows] = useState<FundHeadRow[]>([emptyRow()]);
    // Top-up amounts for existing fund heads: { fund_head_id => top-up string }
    const [topUpAmounts, setTopUpAmounts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Determine if in extension-add mode (project already has fund heads)
    const isExtensionMode = !!project?.fund_head_id && Object.keys(project.fund_head_id).length > 0;

    // Build a map of fund head id → name for display
    const fundHeadMap = Object.fromEntries(fundHeads.map(fh => [fh.id.toString(), fh.name]));

    // Set of already-used fund head ids across all rows (to disable from new selects)
    const usedIds = new Set([
        ...existingRows.map(r => r.fund_head_id),
        ...newRows.map(r => r.fund_head_id).filter(Boolean),
    ]);

    useEffect(() => {
        if (isOpen && project?.fund_head_id && Object.keys(project.fund_head_id).length > 0) {
            // Populate existing read-only rows — sum CSV amounts (e.g. "100000,5000" → 105000)
            setExistingRows(
                Object.entries(project.fund_head_id).map(([id, amt]) => {
                    const total = String(amt).split(',').reduce((s, v) => s + (parseFloat(v) || 0), 0);
                    return { fund_head_id: id, sanction_amount: total.toString() };
                })
            );
            // Always start with one empty new row
            setNewRows([emptyRow()]);
        } else if (isOpen) {
            setExistingRows([]);
            setNewRows([emptyRow()]);
            setTopUpAmounts({});
        }
    }, [isOpen, project]);

    const updateTopUp = (id: string, value: string) =>
        setTopUpAmounts(prev => ({ ...prev, [id]: value }));

    const totalTopUp = Object.entries(topUpAmounts).reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0);

    // --- New rows management ---
    const addRow = () => setNewRows(prev => [...prev, emptyRow()]);
    const removeRow = (i: number) => setNewRows(prev => prev.filter((_, idx) => idx !== i));
    const updateRow = (i: number, field: keyof FundHeadRow, value: string) =>
        setNewRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

    const totalExisting = existingRows.reduce((sum, r) => sum + (parseFloat(r.sanction_amount) || 0), 0);
    const totalNew = newRows.reduce((sum, r) => sum + (parseFloat(r.sanction_amount) || 0), 0);

    const handleSubmit = async () => {
        if (!project) return;

        const validNew = newRows.filter(r => r.fund_head_id && r.sanction_amount);

        // Build top-up rows from existing heads that have an amount entered
        const topUpRows = Object.entries(topUpAmounts)
            .filter(([, v]) => parseFloat(v) > 0)
            .map(([id, v]) => ({ fund_head_id: id, sanction_amount: v }));

        if (isExtensionMode && validNew.length === 0 && topUpRows.length === 0) {
            toast.error('Please add a new fund head or enter a top-up amount.');
            return;
        }

        if (!isExtensionMode) {
            const allRows = [...existingRows, ...validNew];
            if (allRows.length === 0) {
                toast.error('Please add at least one fund head.');
                return;
            }
        }

        const rowsToSubmit = isExtensionMode
            ? [...validNew, ...topUpRows]
            : [...existingRows, ...validNew].filter(r => r.fund_head_id && r.sanction_amount);

        const invalidAmounts = rowsToSubmit.filter(r => parseFloat(r.sanction_amount) <= 0);
        if (invalidAmounts.length > 0) {
            toast.error('All sanction amounts must be greater than zero.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`/projects/${project.id}/select-head`, {
                fund_heads: rowsToSubmit.map(r => ({
                    fund_head_id: parseInt(r.fund_head_id),
                    sanction_amount: parseFloat(r.sanction_amount),
                })),
            });

            toast.success(
                isExtensionMode
                    ? `${validNew.length} new fund head(s) added to the project.`
                    : rowsToSubmit.length > 1
                        ? `${rowsToSubmit.length} fund heads assigned. Approval workflow initialized.`
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
            <DialogContent className="sm:max-w-[580px]">
                <DialogHeader>
                    <DialogTitle>{isExtensionMode ? 'Add Fund Head (Extension)' : 'Select Fund Heads'}</DialogTitle>
                    <DialogDescription>
                        {isExtensionMode
                            ? <>Manage fund heads for <strong>{project.name}</strong>. Existing fund heads are shown below and cannot be modified — add new fund heads in the section below.</>
                            : <>Assign fund heads with sanction amounts for <strong>{project.name}</strong>.</>
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">

                    {/* Existing fund heads — READ-ONLY with optional top-up */}
                    {isExtensionMode && existingRows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Existing Fund Heads</Label>
                                <span className="text-[10px] text-muted-foreground">(enter amount to top-up)</span>
                            </div>
                            <div className="rounded-md border bg-muted/30 divide-y">
                                {existingRows.map((row, i) => (
                                    <div key={i} className="flex items-center px-3 py-2 gap-3">
                                        <span className="text-sm font-medium flex-1 truncate">
                                            {fundHeadMap[row.fund_head_id] || `Fund Head #${row.fund_head_id}`}
                                        </span>
                                        <Badge variant="outline" className="shrink-0 font-mono text-xs">
                                            Rs. {parseFloat(row.sanction_amount).toLocaleString()}
                                        </Badge>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={1000}
                                            placeholder="Top-up"
                                            className="h-8 w-28 text-xs shrink-0"
                                            value={topUpAmounts[row.fund_head_id] || ''}
                                            onChange={(e) => updateTopUp(row.fund_head_id, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-right text-muted-foreground space-y-0.5">
                                <div>Existing Total: <span className="font-semibold">Rs. {totalExisting.toLocaleString()}</span></div>
                                {totalTopUp > 0 && (
                                    <div>Top-up Total: <span className="font-semibold text-blue-600">Rs. {totalTopUp.toLocaleString()}</span></div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* New editable rows */}
                    <div className="space-y-2">
                        {isExtensionMode && (
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Add New Fund Head(s)</Label>
                        )}

                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_7rem_2rem] gap-2 px-1">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Fund Head</Label>
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Sanction Amount</Label>
                            <span />
                        </div>

                        {newRows.map((row, i) => (
                            <div key={i} className="grid grid-cols-[1fr_7rem_2rem] items-center gap-2">
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
                                                disabled={usedIds.has(fh.id.toString()) && row.fund_head_id !== fh.id.toString()}
                                            >
                                                {fh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    placeholder="Amount"
                                    className="h-9 text-sm"
                                    value={row.sanction_amount}
                                    onChange={(e) => updateRow(i, 'sanction_amount', e.target.value)}
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    disabled={newRows.length === 1}
                                    onClick={() => removeRow(i)}
                                    title="Remove"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

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
                </div>

                {/* Total summary */}
                {(newRows.some(r => r.sanction_amount) || existingRows.length > 0) && (
                    <div className="text-sm font-medium text-right text-muted-foreground border-t pt-2 space-y-0.5">
                        {isExtensionMode && totalNew > 0 && (
                            <div>New: <span className="text-foreground font-bold">Rs. {totalNew.toLocaleString()}</span></div>
                        )}
                        {isExtensionMode && totalTopUp > 0 && (
                            <div>Top-ups: <span className="text-blue-600 font-bold">Rs. {totalTopUp.toLocaleString()}</span></div>
                        )}
                        <div>
                            Grand Total: <span className="text-foreground font-bold">Rs. {(totalExisting + totalNew + totalTopUp).toLocaleString()}</span>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : isExtensionMode ? 'Add Fund Head' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FundHeadSelectModal;
