import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FundHead {
  id: number;
  name: string;
}

interface AssetCategory {
  id: number;
  name: string;
}

interface Block {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  block_id: number;
}
interface Type {
  id: number;
  name: string;
  module: string;
  parent_id: number;
  isblock: boolean;
  isroom: boolean;
  isasset: boolean;

}
interface Asset {
  id: number;
  name: string;
  asset_category_id: number;
  details: string;
  current_qty?: number;
  created_at: string;
  updated_at: string;
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
  types?: Type[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Asset Transactions', href: '/asset-transactions' },
];

const isValidItem = (item: any): item is Asset => {
  const isValid = (
    item != null &&
    typeof item.id === 'number' &&
    item.id > 0 &&
    typeof item.name === 'string' &&
    item.name.trim() !== ''
  );
  if (!isValid) {
    console.warn('Invalid item detected:', item);
  }
  return isValid;
};

export default function AssetTransactionCreate({
  fundHeads = [],
  assetCategories = [],
  assets: initialAssets = [],
  blocks = [],
  types = [],
}: Props) {
  const [billFile, setBillFile] = useState<File | null>(null);
  const [transactionType, setTransactionType] = useState<string>(''); // Type ID
  const [transactionSubType, setTransactionSubType] = useState<string>(''); // SubType ID
  const [description, setDescription] = useState<string>(''); // Description
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [assetsByCategory, setAssetsByCategory] = useState<Record<string, Asset[]>>(
    initialAssets
      .filter(isValidItem)
      .reduce((acc, asset) => {
        const catId = asset.asset_category_id.toString();
        acc[catId] = [...(acc[catId] || []), asset];
        return acc;
      }, {} as Record<string, Asset[]>)
  );
  const [roomsByBlock, setRoomsByBlock] = useState<Record<string, Room[]>>({});
  const [fundBalances, setFundBalances] = useState<Record<string, number>>({});

  // Compute total spent per fund head (only valid rows)
  const fundUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    rows.forEach(row => {
      if (row.fundHeadId && row.amount && row.isValid) {
        const amt = parseFloat(row.amount) || 0;
        usage[row.fundHeadId] = (usage[row.fundHeadId] || 0) + amt;
      }
    });
    return usage;
  }, [rows]);

  // Calculate totals (only valid rows)
  const totals = useMemo(() => {
    const totalItems = rows.filter(r => r.isValid).length;
    const totalPurchaseQty = rows.reduce((sum, row) => {
      if (!row.isValid) return sum;
      const qty = parseInt(row.purchaseQty) || 0;
      return sum + qty;
    }, 0);
    const totalAmount = rows.reduce((sum, row) => {
      if (!row.isValid) return sum;
      const amt = parseFloat(row.amount) || 0;
      return sum + amt;
    }, 0);
    return { totalItems, totalPurchaseQty, totalAmount };
  }, [rows]);

  // Form is valid only if all rows are valid
  const isFormValid = useMemo(() => {
    return rows.length > 0 && rows.every(row => row.isValid);
  }, [rows]);

  // Get the selected type configuration (subtype takes precedence if selected)
  const selectedTypeConfig = useMemo(() => {
    const typeId = transactionSubType || transactionType;
    if (!typeId) return null;
    return types.find(t => t.id.toString() === typeId) || null;
  }, [transactionType, transactionSubType, types]);

  // Check if selected type has subtypes
  const hasSubTypes = useMemo(() => {
    if (!transactionType) return false;
    return types.some(t => t.parent_id && t.parent_id.toString() === transactionType);
  }, [transactionType, types]);

  // Determine which columns to show based on type configuration
  const showBlock = selectedTypeConfig?.isblock || false;
  const showRoom = selectedTypeConfig?.isroom || false;
  const showAsset = selectedTypeConfig?.isasset || false;

  // Add new row
  const addNewRow = () => {
    // Prevent adding row if type has subtypes but none is selected
    if (hasSubTypes && !transactionSubType) {
      toast.error('Please select a sub type before adding rows');
      return;
    }

    // Prevent adding row if no type is selected
    if (!transactionType) {
      toast.error('Please select a transaction type first');
      return;
    }

    const newRow: TransactionRow = {
      id: Date.now(),
      fundHeadId: '',
      balance: 0,
      blockId: '',
      roomId: '',
      assetCategoryId: '',
      assetId: '',
      currentQty: 0,
      purchaseQty: '',
      amount: '',
      error: '',
      isValid: false,
    };
    setRows([...rows, newRow]);
  };

  // Delete row
  const deleteRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id));
    toast.success('Row removed');
  };

  // Fetch balance
  const fetchBalance = (rowId: number, fundHeadId: string) => {
    if (!fundHeadId) {
      updateRow(rowId, 'balance', 0);
      return;
    }

    fetch(`/asset-trans/getbalance?id=${fundHeadId}`)
      .then(response => response.json())
      .then(data => {
        const balance = data.balance || 0;
        setFundBalances(prev => ({ ...prev, [fundHeadId]: balance }));
        updateRow(rowId, 'balance', balance);
      })
      .catch(error => {
        console.error('Error fetching balance:', error);
        toast.error('Failed to fetch balance');
        updateRow(rowId, 'balance', 0);
      });
  };

  // Fetch rooms when block changes
  const fetchRooms = (rowId: number, blockId: string) => {
    if (!blockId) {
      updateRow(rowId, 'roomId', '');
      return;
    }

    if (roomsByBlock[blockId]) {
      updateRow(rowId, 'roomId', '');
      return;
    }

    fetch(`/asset-trans/getrooms?block_id=${blockId}`)
      .then(res => res.json())
      .then(data => {
        const validRooms = (data ?? []).filter((r: any) => r.id && r.name);
        console.log('Fetched rooms for block', blockId, validRooms);
        setRoomsByBlock(prev => ({
          ...prev,
          [blockId]: validRooms,
        }));
        updateRow(rowId, 'roomId', '');
      })
      .catch(err => {
        console.error('Error fetching rooms:', err);
        toast.error('Failed to load rooms');
        setRoomsByBlock(prev => ({ ...prev, [blockId]: [] }));
      });
  };

  const highlightRoomSelect = (rowId: number) => {
    // The DOM element is created dynamically, so we use a timeout to let React finish the render
    requestAnimationFrame(() => {
      const select = document.querySelector(
        `tr[data-row-id="${rowId}"] select[name="roomId"]`
      ) as HTMLSelectElement | null;
      if (select) {
        select.focus();
        select.classList.add('border-red-500', 'ring-2', 'ring-red-500');
        setTimeout(() => {
          select.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
        }, 2000);
      }
    });
  };
  // Fetch assets for a category – now also sends the selected roomId
  const fetchAssets = (rowId: number, categoryId: string) => {
    if (!categoryId) {
      updateRow(rowId, 'assetId', '');
      updateRow(rowId, 'currentQty', 0);
      return;
    }

    // ---- 2a. If we already cached the list for this category → just reset ----
    if (assetsByCategory[categoryId]) {
      updateRow(rowId, 'assetId', '');
      updateRow(rowId, 'currentQty', 0);
      return;
    }

    // ---- 2b. Find the current row to read its roomId ----
    const currentRow = rows.find(r => r.id === rowId);
    const roomId = currentRow?.roomId ?? '';

    // ---- 2c. NO ROOM SELECTED → block the request & highlight the dropdown ----
    if (!roomId) {
      toast.error('Please select a Room before choosing an Asset Category.');
      highlightRoomSelect(rowId);
      return;                     // ← abort the fetch
    }

    // ---- 2d. Build query string (category id + room id) ----
    const query = new URLSearchParams({
      id: categoryId,
      room_id: roomId,
    });

    // ---- 2e. Perform the fetch ----
    fetch(`/asset-trans/getassets?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        const validAssets = (data.assets ?? []).filter(isValidItem);
        setAssetsByCategory(prev => ({
          ...prev,
          [categoryId]: validAssets,
        }));
        // Reset asset selection & current qty for the row
        updateRow(rowId, 'assetId', '');
        updateRow(rowId, 'currentQty', 0);
      })
      .catch(err => {
        console.error('Error fetching assets:', err);
        toast.error('Failed to load assets');
        setAssetsByCategory(prev => ({ ...prev, [categoryId]: [] }));
      });
  };

  // Update row field
  const updateRow = (id: number, field: keyof TransactionRow, value: any) => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.id !== id) return row;

        const updated = { ...row, [field]: value, error: '' };

        if (field === 'blockId' || field === 'roomId') {
          updated.assetCategoryId = '';
          updated.assetId = '';
          updated.currentQty = 0;
          // Optionally: clear fetched assets for old category
          // (not required – they stay in cache)
        }

        // Block changed → fetch rooms
        if (field === 'blockId' && value !== row.blockId) {
          fetchRooms(id, value);
          updated.roomId = '';
        }

        // Fund Head changed
        if (field === 'fundHeadId' && value !== row.fundHeadId) {
          fetchBalance(id, value);
        }

        // Category changed
        if (field === 'assetCategoryId') {
          fetchAssets(id, value);
          updated.assetId = '';
          updated.currentQty = 0;
        }

        // Asset selected
        if (field === 'assetId' && value) {
          const assets = assetsByCategory[row.assetCategoryId] || [];
          const asset = assets.find(a => a.id.toString() === value);
          if (asset) {
            updated.currentQty = asset.current_qty ?? 0;
          }
        }
        // === VALIDATE AMOUNT ===
        if (field === 'amount' || field === 'fundHeadId') {
          const amountStr = updated.amount;
          const fundId = updated.fundHeadId;

          // Parse amount safely
          const amountFloat = parseFloat(amountStr) || 0;
          const amountCents = Math.round(amountFloat * 100); // e.g. 19999.11 → 1999911

          updated.isValid = true;
          updated.error = '';

          if (fundId && amountCents > 0) {
            const balance = fundBalances[fundId] || 0;
            const balanceCents = Math.round(balance * 100); // 15000 → 1500000

            // Calculate usage from OTHER rows (in cents)
            const otherRowsUsageCents = rows
              .filter(r => r.id !== row.id && r.fundHeadId === fundId && r.isValid)
              .reduce((sum, r) => {
                const qty = parseFloat(r.amount) || 0;
                return sum + Math.round(qty * 100);
              }, 0);

            const totalUsageCents = otherRowsUsageCents + amountCents;

            if (totalUsageCents > balanceCents) {
              const excessCents = totalUsageCents - balanceCents;
              const excessAmount = (excessCents / 100).toFixed(2);
              updated.error = `Exceeds by Rs ${parseFloat(excessAmount).toLocaleString()}`;
              updated.isValid = false;
              const fundName = fundHeads.find(f => f.id.toString() === fundId)?.name || 'Fund';
            }
          }

          // Also validate that amount is a valid number with up to 2 decimals
          if (amountStr && !/^\d+(\.\d{1,2})?$/.test(amountStr)) {
            updated.error = 'Max 2 decimal places';
            updated.isValid = false;
          }
        }

        // Final validity - only validate fields that are shown based on type config
        const blockValid = !showBlock || !!updated.blockId;
        const roomValid = !showRoom || !!updated.roomId;
        const assetValid = !showAsset || (
          !!updated.assetCategoryId &&
          !!updated.assetId &&
          parseInt(updated.purchaseQty) > 0
        );

        updated.isValid = !!(
          updated.fundHeadId &&
          blockValid &&
          roomValid &&
          assetValid &&
          parseFloat(updated.amount) > 0 &&
          !updated.error
        );

        return updated;
      })
    );
  };

  // Keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent, rowId: number) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      addNewRow();
    }
  };

  // Get assets for row's category
  const getFilteredAssets = (categoryId: string) => {
    return categoryId ? assetsByCategory[categoryId] || [] : [];
  };

  // Get rooms for row's block
  const getFilteredRooms = (blockId: string) => {
    return blockId ? roomsByBlock[blockId] || [] : [];
  };

  // Submit
  const handleSubmit = () => {
    if (!isFormValid) return toast.error('Fix errors');
    const fd = new FormData();

    fd.append('total_amount', totals.totalAmount.toFixed(2));
    if (billFile) fd.append('bill_img', billFile);
    if (transactionType == null || transactionType == '') {
      return toast.error('Please select Transaction Type');
    }
    fd.append('type', transactionType);
    if (transactionSubType) fd.append('sub_type', transactionSubType);
    if (description) fd.append('description', description);
    rows.forEach((r, i) => {
      fd.append(`items[${i}][fund_head_id]`, r.fundHeadId);
      fd.append(`items[${i}][block_id]`, r.blockId);
      fd.append(`items[${i}][room_id]`, r.roomId);
      fd.append(`items[${i}][asset_id]`, r.assetId);
      fd.append(`items[${i}][purchase_qty]`, r.purchaseQty);
      fd.append(`items[${i}][amount]`, r.amount);
    });
    router.post('/asset-transactions', fd, {
      forceFormData: true,
      onSuccess: () => {
        // Reset all form state
        setRows([]);
        setBillFile(null);
        setTransactionType('');
        setTransactionSubType('');
        setDescription('');
        setFundBalances({});
        setRoomsByBlock({});
        setAssetsByCategory({});
        toast.success('Transaction created successfully!');
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
        toast.error('Please fix the highlighted errors.');
      },
    });
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Asset Transaction" />
      <div className="flex-1 p-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Create Asset Transaction</CardTitle>
              <Button onClick={addNewRow}>
                <Plus className="w-4 h-4 mr-2" />
                New Row
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionType}
                  onChange={(e) => {
                    setTransactionType(e.target.value);
                    setTransactionSubType(''); // Reset subtype when type changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Type</option>
                  {types.filter(t => !t.parent_id).map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Transaction Sub Type
                </label>
                <select
                  value={transactionSubType}
                  onChange={(e) => setTransactionSubType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  disabled={!transactionType}
                >
                  <option value="">Select Sub Type (Optional)</option>
                  {types
                    .filter(t => t.parent_id && t.parent_id.toString() === transactionType)
                    .map(subType => (
                      <option key={subType.id} value={subType.id}>
                        {subType.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter transaction description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bill Image</label>
              <input type="file" accept="image/*" onChange={e => setBillFile(e.target.files?.[0] ?? null)} className="file-input" />
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0b431b] dark:bg-gray-800">
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[150px]">
                      Fund Head
                    </th>
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[100px]">
                      Balance
                    </th>
                    {showBlock && (
                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[120px]">
                        Block
                      </th>
                    )}
                    {showRoom && (
                      <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[120px]">
                        Room
                      </th>
                    )}
                    {showAsset && (
                      <>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[140px]">
                          Asset Category
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[160px]">
                          Asset
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[90px]">
                          Current Qty
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[100px]">
                          Purchase Qty
                        </th>
                      </>
                    )}
                    <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200 w-[110px]">
                      Amount
                    </th>
                    <th className="border p-2 text-center text-sm font-medium text-white dark:text-gray-200 w-[70px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={20} className="border p-12 text-center text-gray-500 dark:text-gray-400">
                        No transactions added. Click "New Row" to start.
                      </td>
                    </tr>
                  ) : (
                    rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* Fund Head */}
                        <td className="border p-2">
                          <select
                            value={row.fundHeadId}
                            onChange={e => updateRow(row.id, 'fundHeadId', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, row.id)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          >
                            <option value="">Select Fund</option>
                            {fundHeads.map(fund => (
                              <option key={fund.id} value={fund.id}>
                                {fund.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Balance */}
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.balance > 0 ? `Rs ${row.balance.toLocaleString()}` : '-'}
                            disabled
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                          />
                        </td>

                        {/* Block */}
                        {showBlock && (
                          <td className="border p-2">
                            <select
                              value={row.blockId}
                              onChange={e => updateRow(row.id, 'blockId', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, row.id)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            >
                              <option value="">Select Block</option>
                              {blocks.map(block => (
                                <option key={block.id} value={block.id}>
                                  {block.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* Room */}
                        {showRoom && (
                          <td className="border p-2">
                            <select
                              value={row.roomId}
                              onChange={e => updateRow(row.id, 'roomId', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, row.id)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                              disabled={!row.blockId}
                            >
                              <option value="">Select Room</option>
                              {getFilteredRooms(row.blockId).map(room => (
                                <option key={room.id} value={room.id}>
                                  {room.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        {/* Asset Category, Asset, Current Qty, Purchase Qty */}
                        {showAsset && (
                          <>
                            {/* Asset Category */}
                            <td className="border p-2">
                              <select
                                value={row.assetCategoryId}
                                onChange={e => updateRow(row.id, 'assetCategoryId', e.target.value)}
                                onKeyDown={e => handleKeyDown(e, row.id)}
                                disabled={showRoom && !row.roomId}
                                className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${(showRoom && !row.roomId) ? 'border-gray-300' : 'border-gray-300 focus:ring-green-500'
                                  }`}
                              >
                                <option value="">Select Category</option>
                                {assetCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* Asset */}
                            <td className="border p-2">
                              <select
                                value={row.assetId}
                                onChange={e => updateRow(row.id, 'assetId', e.target.value)}
                                onKeyDown={e => handleKeyDown(e, row.id)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                                disabled={!row.assetCategoryId}
                              >
                                <option value="">Select Asset</option>
                                {getFilteredAssets(row.assetCategoryId).map(asset => (
                                  <option key={asset.id} value={asset.id}>
                                    {asset.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Current Qty */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={row.currentQty}
                                disabled
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                              />
                            </td>

                            {/* Purchase Qty */}
                            <td className="border p-2">
                              <input
                                type="number"
                                value={row.purchaseQty}
                                onChange={e => updateRow(row.id, 'purchaseQty', e.target.value)}
                                onKeyDown={e => handleKeyDown(e, row.id)}
                                placeholder="0"
                                min="0"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              />
                            </td>
                          </>
                        )}


                        {/* Amount */}
                        <td className="border p-2">
                          <div className="relative">
                            <input
                              type="number"
                              value={row.amount}
                              onChange={e => updateRow(row.id, 'amount', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, row.id)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white ${row.error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-green-500'
                                }`}
                            />
                            {row.error && (
                              <p className="absolute left-0 -bottom-5 text-xs text-red-600 font-medium">
                                {row.error}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Delete */}
                        <td className="border p-2 text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRow(row.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {rows.length > 0 && (
              <div className="mt-10 space-y-4">
                <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-lg">
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
                      Rs {totals.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={!isFormValid}
                    className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Create Transaction
                  </Button>
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Tip: Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-xs">Shift</kbd> +{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-xs">Enter</kbd> to add a new row
              </p>
            </div>
          </CardContent>
        </Card >
      </div >
    </AppLayout >
  );
}