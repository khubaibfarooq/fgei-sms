import React, { useCallback, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft, Plus, Trash2, Keyboard, TrendingUp, TrendingDown } from 'lucide-react';
import { AmountInput } from '@/components/ui/amount-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';

interface FundHead {
  id: number;
  name: string;
  balance: number;
}

interface HeadRow {
  fund_head_id: number | '';
  amount: number | '';
  description: string;
  [key: string]: FormDataConvertible;
}

interface FundFormProps {
  fund?: {
    id: number;
    balance: number;
    institute_id: number;
    fund_head_id?: number;
    description?: string;
    transaction_type?: string;
    added_date?: string;
    status?: string;
  };
  fundHeads: FundHead[];
}

const emptyRow = (): HeadRow => ({ fund_head_id: '', amount: '', description: '' });

export default function FundForm({ fund, fundHeads }: FundFormProps) {
  const isEdit = !!fund;
  const fundHeadsArray: FundHead[] = Array.isArray(fundHeads) ? fundHeads : [];

  /* ------------------------------------------------------------------ */
  /* Inertia form — flat shared fields only (no nested arrays)           */
  /* ------------------------------------------------------------------ */
  const { data, setData, processing } = useForm({
    transaction_type: fund?.transaction_type ?? '',
    date: fund?.added_date ?? new Date().toISOString().split('T')[0],
    // edit-only fields
    amount: fund?.balance ?? 0,
    fund_head_id: fund?.fund_head_id ?? 0,
    description: fund?.description ?? '',
  });

  /* ------------------------------------------------------------------ */
  /* Multi-head rows — plain useState to avoid Inertia type constraints  */
  /* ------------------------------------------------------------------ */
  const [heads, setHeads] = React.useState<HeadRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = React.useState(false);

  /* ------------------------------------------------------------------ */
  /* Row helpers                                                          */
  /* ------------------------------------------------------------------ */
  const addRow = useCallback(() => {
    setHeads((prev) => [...prev, emptyRow()]);
  }, []);

  const removeRow = (index: number) => {
    if (heads.length === 1) return;
    setHeads((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = <K extends keyof HeadRow>(index: number, key: K, value: HeadRow[K]) => {
    setHeads((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  /* ------------------------------------------------------------------ */
  /* Keyboard shortcut: Ctrl + Shift + A → add row                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        addRow();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addRow]);

  /* ------------------------------------------------------------------ */
  /* Grand total                                                          */
  /* ------------------------------------------------------------------ */
  const grandTotal = heads.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  /* ------------------------------------------------------------------ */
  /* Submit                                                               */
  /* ------------------------------------------------------------------ */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      router.put(
        `/funds/${fund.id}`,
        {
          amount: data.amount,
          fund_head_id: data.fund_head_id,
          description: data.description,
          type: data.transaction_type,
        },
        { preserveScroll: true, preserveState: true },
      );
      return;
    }

    const validHeads = heads.filter(
      (h) => h.fund_head_id !== '' && Number(h.amount) > 0,
    );
    if (validHeads.length === 0) {
      alert('Please add at least one head with a valid amount.');
      return;
    }

    setSubmitting(true);
    router.post(
      '/funds',
      {
        transaction_type: data.transaction_type,
        date: data.date,
        heads: validHeads,
      },
      { onFinish: () => setSubmitting(false) },
    );
  };

  /* ------------------------------------------------------------------ */
  /* Breadcrumbs                                                          */
  /* ------------------------------------------------------------------ */
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Funds', href: '/funds' },
    { title: isEdit ? 'Edit Fund' : 'Add Fund', href: '#' },
  ];

  const isBusy = processing || submitting;

  /* ================================================================== */
  /* Render                                                               */
  /* ================================================================== */
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Fund' : 'Add Fund'} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-5xl mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-xl font-bold">
                  {isEdit ? 'Edit Fund Transaction' : 'Add Fund Transaction'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isEdit
                    ? 'Update the fund transaction details below.'
                    : 'Select a transaction type, add fund heads and save.'}
                </p>
              </div>
              {!isEdit && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 py-1">
                  <Keyboard className="h-3.5 w-3.5" />
                  <kbd className="font-mono font-semibold">Ctrl</kbd>+
                  <kbd className="font-mono font-semibold">Shift</kbd>+
                  <kbd className="font-mono font-semibold">A</kbd>
                  &nbsp;to add a row
                </span>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── Transaction Type (create mode only) ── */}
              {!isEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Transaction Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="transaction_type" className="text-sm font-semibold">
                    Transaction Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    required
                    value={data.transaction_type}
                    onValueChange={(v) => setData('transaction_type', v)}
                  >
                    <SelectTrigger id="transaction_type" className="w-full">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          Income
                        </span>
                      </SelectItem>
                      <SelectItem value="out">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-rose-500" />
                          Expense
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {data.transaction_type && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                        data.transaction_type === 'in'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}
                    >
                      {data.transaction_type === 'in' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {data.transaction_type === 'in' ? 'Income' : 'Expense'}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-sm font-semibold">
                    Transaction Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    required
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                  />
                </div>
              </div>
              )}

              {/* ── Edit mode: fund head + amount only ──────────────── */}
              {isEdit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_fund_head">Fund Head</Label>
                    <Input
                      id="edit_fund_head"
                      readOnly
                      value={fundHeadsArray.find((h) => h.id === data.fund_head_id)?.name ?? '—'}
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_amount">Amount</Label>
                    <AmountInput
                      id="edit_amount"
                      value={data.amount}
                      onChange={(v) => setData('amount', Number(v))}
                      min={0}
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {/* ── Create mode: multi-head table ────────────────────── */}
              {!isEdit && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Fund Heads</h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addRow}
                      className="gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Head
                    </Button>
                  </div>

                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-6">#</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground min-w-[180px]">
                            Fund Head <span className="text-destructive">*</span>
                          </th>
                          <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground min-w-[140px]">
                            Amount <span className="text-destructive">*</span>
                          </th>
                          <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground min-w-[200px]">
                            Description
                          </th>
                          <th className="px-3 py-2.5 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {heads.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-3 py-2 text-muted-foreground text-xs font-mono">
                              {idx + 1}
                            </td>

                            <td className="px-3 py-2">
                              <Select
                                value={row.fund_head_id ? row.fund_head_id.toString() : ''}
                                onValueChange={(v) => updateRow(idx, 'fund_head_id', parseInt(v))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select head…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fundHeadsArray.map((h) => (
                                    <SelectItem key={h.id} value={h.id.toString()}>
                                      {h.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            <td className="px-3 py-2">
                              <AmountInput
                                value={row.amount === '' ? '' : row.amount}
                                onChange={(v) =>
                                  updateRow(
                                    idx,
                                    'amount',
                                    v === '' ? '' : Number(v),
                                  )
                                }
                                placeholder="0.00"
                                min={0}
                                step="0.01"
                                inputClassName="h-8 text-sm"
                              />
                            </td>

                            <td className="px-3 py-2">
                              <Input
                                type="text"
                                value={row.description}
                                onChange={(e) => updateRow(idx, 'description', e.target.value)}
                                placeholder="Optional note…"
                                className="h-8 text-sm"
                              />
                            </td>

                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                disabled={heads.length === 1}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Remove row"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Grand Total */}
                      <tfoot>
                        <tr className="border-t bg-muted/40">
                          <td colSpan={2} className="px-3 py-2.5 text-right text-sm font-bold text-foreground">
                            Grand Total
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                data.transaction_type === 'in'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : data.transaction_type === 'out'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-foreground'
                              }`}
                            >
                              {grandTotal.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {heads.length} row{heads.length !== 1 ? 's' : ''} · Press{' '}
                    <kbd className="font-mono font-semibold border rounded px-1 py-0.5 text-[10px]">Ctrl</kbd>
                    +<kbd className="font-mono font-semibold border rounded px-1 py-0.5 text-[10px]">Shift</kbd>
                    +<kbd className="font-mono font-semibold border rounded px-1 py-0.5 text-[10px]">A</kbd>{' '}
                    to quickly add another row
                  </p>
                </div>
              )}

              {/* ── Actions ─────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Link href="/funds">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </Link>
                  <Button
                  type="submit"
                  disabled={isBusy || (!isEdit && !data.transaction_type)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isBusy
                    ? isEdit ? 'Saving…' : 'Adding…'
                    : isEdit
                    ? 'Save Changes'
                    : `Save Transaction${!isEdit && heads.length > 1 ? ` (${heads.length} heads)` : ''}`}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}