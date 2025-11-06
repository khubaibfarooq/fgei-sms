import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  memo,
} from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FundHead { id: number; name: string; }
interface AssetCategory { id: number; name: string; }
interface Block { id: number; name: string; }
interface Room { id: number; name: string; block_id: number; }
interface Asset {
  id: number;
  name: string;
  asset_category_id: number;
  details: string;
  current_qty?: number;
}
interface TransactionRow {
  id: number;
  fundHeadId: string;
  balance: number;
  blockId: string;
  roomId: string;
  assetCategoryId: string;
  assetId: string;
  currentQty: number;
  purchaseQty: string;
  amount: string;
  error?: string;
  isValid: boolean;
}

interface Props {
  fundHeads?: FundHead[];
  assetCategories?: AssetCategory[];
  assets?: Asset[];
  blocks?: Block[];
  institute_id: number;
  user_id: number;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Asset Transactions', href: '/asset-transactions' },
];

const isValidItem = (item: any): item is Asset =>
  item?.id > 0 && typeof item.name === 'string' && item.name.trim() !== '';

const TableRow = memo(({ row, onUpdate, onDelete, onKeyDown, fundHeads, blocks, assetCategories, getRooms, getAssets }: any) => {
  const highlightRoom = () => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`tr[data-row-id="${row.id}"] select[name="roomId"]`) as HTMLSelectElement;
      if (el) {
        el.focus();
        el.classList.add('border-red-500', 'ring-2', 'ring-red-500');
        setTimeout(() => el.classList.remove('border-red-500', 'ring-2', 'ring-red-500'), 2000);
      }
    });
  };

  return (
    <tr data-row-id={row.id} className="hover:bg-gray-50">
      {/* Fund Head */}
      <td className="border p-2">
        <select
          value={row.fundHeadId}
          onChange={e => onUpdate(row.id, 'fundHeadId', e.target.value)}
          onKeyDown={e => onKeyDown(e, row.id)}
          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Fund</option>
          {fundHeads.map((f: any) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </td>

      {/* Balance */}
      <td className="border p-2">
        <input
          type="text"
          value={row.balance > 0 ? `Rs ${row.balance.toLocaleString()}` : '-'}
          disabled
          className="w-full px-2 py-1.5 bg-gray-100 text-sm"
        />
      </td>

      {/* Block */}
      <td className="border p-2">
        <select
          value={row.blockId}
          onChange={e => onUpdate(row.id, 'blockId', e.target.value)}
          onKeyDown={e => onKeyDown(e, row.id)}
          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Block</option>
          {blocks.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </td>

      {/* Room */}
      <td className="border p-2">
        <select
          value={row.roomId}
          onChange={e => onUpdate(row.id, 'roomId', e.target.value)}
          onKeyDown={e => onKeyDown(e, row.id)}
          disabled={!row.blockId}
          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          <option value="">Select Room</option>
          {getRooms(row.blockId).map((r: any) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </td>

      {/* Asset Category */}
      <td className="border p-2">
        <select
          value={row.assetCategoryId}
          onChange={e => {
            if (!row.roomId) {
              toast.error('Select Room first');
              highlightRoom();
              return;
            }
            onUpdate(row.id, 'assetCategoryId', e.target.value);
          }}
          onKeyDown={e => onKeyDown(e, row.id)}
          disabled={!row.roomId}
          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          <option value="">Select Category</option>
          {assetCategories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>

      {/* Asset */}
      <td className="border p-2">
        <select
          value={row.assetId}
          onChange={e => onUpdate(row.id, 'assetId', e.target.value)}
          onKeyDown={e => onKeyDown(e, row.id)}
          disabled={!row.assetCategoryId}
          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          <option value="">Select Asset</option>
          {getAssets(row.assetCategoryId).map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </td>

      {/* Current Qty */}
      <td className="border p-2">
        <input type="text" value={row.currentQty} disabled className="w-full px-2 py-1.5 bg-gray-100 text-sm" />
      </td>

      {/* Purchase Qty */}
      <td className="border p-2">
        <input
          type="number"
          value={row.purchaseQty}
          onChange={e => onUpdate(row.id, 'purchaseQty', e.target.value)}
          onKeyDown={e => onKeyDown(e, row.id)}
          min="1"
          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
        />
      </td>

      {/* Amount */}
      <td className="border p-2">
        <div className="relative">
          <input
            type="number"
            value={row.amount}
            onChange={e => onUpdate(row.id, 'amount', e.target.value)}
            onKeyDown={e => onKeyDown(e, row.id)}
            step="0.01"
            className={`w-full px-2 py-1.5 border rounded-md text-sm focus:ring-2 ${row.error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'}`}
          />
          {row.error && <p className="absolute left-0 -bottom-5 text-xs text-red-600">{row.error}</p>}
        </div>
      </td>

      {/* Delete */}
      <td className="border p-2 text-center">
        <Button variant="destructive" size="sm" onClick={() => onDelete(row.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
});

export default function AssetTransactionCreate({
  fundHeads = [],
  assetCategories = [],
  assets: initialAssets = [],
  blocks = [],
  institute_id,
  user_id,
}: Props) {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [assetsByCategory, setAssetsByCategory] = useState<Record<string, Asset[]>>({});
  const [roomsByBlock, setRoomsByBlock] = useState<Record<string, Room[]>>({});
  const [fundBalances, setFundBalances] = useState<Record<string, number>>({});
  const [billFile, setBillFile] = useState<File | null>(null);

  const fundBalancesRef = useRef(fundBalances);
  fundBalancesRef.current = fundBalances;

  // Initialize assets
  useEffect(() => {
    const grouped = initialAssets
      .filter(isValidItem)
      .reduce((acc, asset) => {
        const catId = asset.asset_category_id.toString();
        acc[catId] = [...(acc[catId] || []), asset];
        return acc;
      }, {} as Record<string, Asset[]>);
    setAssetsByCategory(grouped);
  }, [initialAssets]);

  // Stable updateRow
  const updateRow = useCallback((id: number, field: keyof TransactionRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value, error: '' };

      if (field === 'blockId' || field === 'roomId') {
        updated.assetCategoryId = '';
        updated.assetId = '';
        updated.currentQty = 0;
      }
      if (field === 'assetCategoryId') {
        updated.assetId = '';
        updated.currentQty = 0;
      }

      // Validate amount
      if (field === 'amount' || field === 'fundHeadId') {
        const amt = parseFloat(updated.amount) || 0;
        const fundId = updated.fundHeadId;
        const balance = fundBalancesRef.current[fundId] || 0;
        const otherUsage = prev
          .filter(r => r.id !== id && r.fundHeadId === fundId && r.isValid)
          .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
        if (fundId && amt + otherUsage > balance) {
          updated.error = `Exceeds by Rs ${(amt + otherUsage - balance).toFixed(2)}`;
          updated.isValid = false;
        } else if (updated.amount && !/^\d+(\.\d{1,2})?$/.test(updated.amount)) {
          updated.error = 'Max 2 decimals';
          updated.isValid = false;
        } else {
          updated.error = '';
        }
      }

      updated.isValid = !!(
        updated.fundHeadId &&
        updated.blockId &&
        updated.roomId &&
        updated.assetCategoryId &&
        updated.assetId &&
        parseInt(updated.purchaseQty) > 0 &&
        parseFloat(updated.amount) > 0 &&
        !updated.error
      );

      return updated;
    }));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, {
      id: Date.now(),
      fundHeadId: '', balance: 0, blockId: '', roomId: '', assetCategoryId: '',
      assetId: '', currentQty: 0, purchaseQty: '', amount: '', isValid: false
    }]);
  }, []);

  const deleteRow = useCallback((id: number) => {
    setRows(prev => prev.filter(r => r.id !== id));
    toast.success('Row removed');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      addRow();
    }
  }, [addRow]);

  // Fetch effects
  useEffect(() => {
    rows.forEach(row => {
      if (row.fundHeadId && fundBalancesRef.current[row.fundHeadId] === undefined) {
        fetch(`/asset-trans/getbalance?id=${row.fundHeadId}`)
          .then(r => r.json())
          .then(d => {
            const bal = d.balance || 0;
            setFundBalances(p => ({ ...p, [row.fundHeadId]: bal }));
            setRows(p => p.map(r => r.id === row.id ? { ...r, balance: bal } : r));
          });
      }
      if (row.blockId && !roomsByBlock[row.blockId]) {
        fetch(`/asset-trans/getrooms?block_id=${row.blockId}`)
          .then(r => r.json())
          .then(d => {
            const rooms = (d ?? []).filter((r: any) => r.id && r.name);
            setRoomsByBlock(p => ({ ...p, [row.blockId]: rooms }));
          });
      }
      if (row.assetCategoryId && row.roomId && !assetsByCategory[row.assetCategoryId]) {
        const q = new URLSearchParams({ id: row.assetCategoryId, room_id: row.roomId });
        fetch(`/asset-trans/getassets?${q}`)
          .then(r => r.json())
          .then(d => {
            const assets = (d.assets ?? []).filter(isValidItem);
            setAssetsByCategory(p => ({ ...p, [row.assetCategoryId]: assets }));
          });
      }
    });
  }, [rows]);

  const getRooms = useCallback((blockId: string) => roomsByBlock[blockId] || [], [roomsByBlock]);
  const getAssets = useCallback((catId: string) => assetsByCategory[catId] || [], [assetsByCategory]);

  const totals = useMemo(() => {
    const valid = rows.filter(r => r.isValid);
    return {
      totalItems: valid.length,
      totalPurchaseQty: valid.reduce((s, r) => s + (parseInt(r.purchaseQty) || 0), 0),
      totalAmount: valid.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0),
    };
  }, [rows]);

  const isFormValid = rows.length > 0 && rows.every(r => r.isValid);

  const handleSubmit = () => {
    if (!isFormValid) return toast.error('Fix errors');
    const fd = new FormData();
    fd.append('institute_id', institute_id.toString());
    fd.append('added_by', user_id.toString());
    fd.append('total_amount', totals.totalAmount.toFixed(2));
    if (billFile) fd.append('bill_img', billFile);
    rows.forEach((r, i) => {
      fd.append(`items[${i}][fund_head_id]`, r.fundHeadId);
      fd.append(`items[${i}][block_id]`, r.blockId);
      fd.append(`items[${i}][room_id]`, r.roomId);
      fd.append(`items[${i}][asset_id]`, r.assetId);
      fd.append(`items[${i}][purchase_qty]`, r.purchaseQty);
      fd.append(`items[${i}][amount]`, r.amount);
    });
    router.post('/asset-transactions', fd, { forceFormData: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Asset Transaction" />
      <div className="flex-1 p-3">
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Create Asset Transaction</CardTitle>
              <Button onClick={addRow}><Plus className="w-4 h-4 mr-2" />New Row</Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="py-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bill Image</label>
              <input type="file" accept="image/*" onChange={e => setBillFile(e.target.files?.[0] ?? null)} className="file-input" />
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0b431b] text-white text-sm">
                    <th className="p-2">Fund Head</th>
                    <th className="p-2">Balance</th>
                    <th className="p-2">Block</th>
                    <th className="p-2">Room</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Asset</th>
                    <th className="p-2">Curr Qty</th>
                    <th className="p-2">Pur Qty</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={10} className="text-center p-8 text-gray-500">Click "New Row"</td></tr>
                  ) : (
                    rows.map(row => (
                      <TableRow
                        key={row.id}
                        row={row}
                        onUpdate={updateRow}
                        onDelete={deleteRow}
                        onKeyDown={handleKeyDown}
                        fundHeads={fundHeads}
                        blocks={blocks}
                        assetCategories={assetCategories}
                        getRooms={getRooms}
                        getAssets={getAssets}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {rows.length > 0 && (
              <div className="mt-8 flex justify-end gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valid Items</p>
                  <p className="text-lg font-bold">{totals.totalItems}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Qty</p>
                  <p className="text-lg font-bold">{totals.totalPurchaseQty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    Rs {totals.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={!isFormValid} size="lg">
                Create Transaction
              </Button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              Tip: Press <kbd>Shift</kbd> + <kbd>Enter</kbd> to add row
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}