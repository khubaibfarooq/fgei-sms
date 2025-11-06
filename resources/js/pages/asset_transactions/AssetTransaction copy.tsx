import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface FundHead {
  id: number;
  name: string;
}


interface AssetCategory {
  id: number;
  name: string;
}



interface AssetTransactionItem {
  id: number;
  asset_id: number;
  asset_name: string;
  current_qty: number;
  remaining_qty: number;
  new_qty: number;
  amount: number;
}
interface Asset {
  id: number;
  name: string;
}

interface Props {
  fundHeads?: FundHead[];
  assetCategories?: AssetCategory[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Asset Transactions', href: '/asset-transactions' },
];
  // Validation function for items
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
}: Props) {
  const [selectedFundHead, setSelectedFundHead] = useState<string>('');
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<string>('');
  const [searchAsset, setSearchAsset] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [newQty, setNewQty] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
    const [balance, setBalance] = useState<number>(0);
  const [assets, setAssets] = useState<Asset[] | null>(null);

  const [transactionItems, setTransactionItems] = useState<AssetTransactionItem[]>([]);

// fund selection change 

  useEffect(() => {
    if (selectedFundHead) {
      
      fetch(`/asset-trans/getbalance?id=${selectedFundHead}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched data:', data);

       setBalance(data.balance);
        })
        .catch((error) => {
          console.error('Error fetching :', error);
          toast.error('Failed to fetch ');
           setBalance(0);
        })
        
    
    } else {
   
    }
  }, [selectedFundHead]);


  useEffect(() => {
    if (selectedAssetCategory) {
      
      fetch(`/asset-trans/getbalance?id=${selectedAssetCategory}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched data:', data);

       setBalance(data.balance);
        })
        .catch((error) => {
          console.error('Error fetching :', error);
          toast.error('Failed to fetch ');
           setBalance(0);
        })
        
    
    } else {
   
    }
  }, [selectedAssetCategory]);


  // Handle asset selection
  const handleAssetSelect = (assetId: string) => {
    const asset = assets.find(a => a.id.toString() === assetId);
    setSelectedAsset(asset);
    if (asset) {
      setNewQty('');
      setAmount('');
    }
  };

  // Handle Enter key press to add asset to table
  const handleAssetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedAsset) {
      addAssetToTable();
    }
  };

  // Add asset to transaction table
  const addAssetToTable = () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    if (!newQty || isNaN(parseInt(newQty)) || parseInt(newQty) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const existingItemIndex = transactionItems.findIndex(
      item => item.asset_id === selectedAsset.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedItems = [...transactionItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        new_qty: parseInt(newQty),
        amount: parseFloat(amount),
      };
      setTransactionItems(updatedItems);
      toast.success('Asset quantity updated');
    } else {
      // Add new item
      const newItem: AssetTransactionItem = {
        id: Date.now(), // Temporary ID
        asset_id: selectedAsset.id,
        asset_name: selectedAsset.name,
        current_qty: selectedAsset.current_qty || 0,
        remaining_qty: (selectedAsset.current_qty || 0) - parseInt(newQty),
        new_qty: parseInt(newQty),
        amount: parseFloat(amount),
      };
      setTransactionItems([...transactionItems, newItem]);
      toast.success('Asset added to transaction');
    }

    // Reset form
    setSelectedAsset(null);
    setSearchAsset('');
    setNewQty('');
    setAmount('');
  };

  // Remove asset from transaction table
  const removeAssetFromTable = (id: number) => {
    setTransactionItems(transactionItems.filter(item => item.id !== id));
    toast.success('Asset removed from transaction');
  };

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return transactionItems.reduce((sum, item) => sum + item.amount, 0);
  }, [transactionItems]);

  // Check if fund balance is sufficient
  const isBalanceSufficient = useMemo(() => {
    if (balance === 0) return true;
    const totalFundBalance = balance;
    return totalAmount <= totalFundBalance;
  }, [balance, totalAmount]);

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedFundHead) {
      toast.error('Please select a fund head');
      return;
    }

    if (transactionItems.length === 0) {
      toast.error('Please add at least one asset');
      return;
    }

    if (!isBalanceSufficient) {
      toast.error('Insufficient fund balance');
      return;
    }

    // Prepare data for submission
    const transactionData = {
      fund_head_id: parseInt(selectedFundHead),
      items: transactionItems.map(item => ({
        asset_id: item.asset_id,
        new_qty: item.new_qty,
        amount: item.amount,
      })),
      total_amount: totalAmount,
    };

    console.log('Transaction Data:', transactionData);
    // Here you would typically send the data to your backend using router.post()
    
    toast.success('Asset transaction created successfully!');
    
    // Reset form
    setSelectedFundHead('');
    setSelectedAssetCategory('');
    setSearchAsset('');
    setSelectedAsset(null);
    setNewQty('');
    setAmount('');
    setTransactionItems([]);
  };

  // Clear asset selection when category or search changes significantly
  useEffect(() => {
    if (selectedAsset && !filteredAssets.find(a => a.id === selectedAsset.id)) {
      setSelectedAsset(null);
      setNewQty('');
      setAmount('');
    }
  }, [filteredAssets, selectedAsset]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Asset Transaction" />
      <div className="flex-1 p-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Create Asset Transaction</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="py-6 space-y-6">
            {/* Fund Head Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fund-head">Fund Head *</Label>
                <Select value={selectedFundHead} onValueChange={setSelectedFundHead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Fund Head" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundHeads.map((fundHead) => (
                      <SelectItem key={fundHead.id} value={fundHead.id.toString()}>
                        {fundHead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fund Helds Display */}
              <div className="space-y-2">
                <Label>Available Funds</Label>
                <div className="p-3 border rounded-md bg-muted/50 min-h-[42px]">
                  {balance != 0 ? (
                    <div className="space-y-1">
                  
                        <div  className="flex justify-between text-sm">
                         
                          <span className="font-medium">RS {balance.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}</span>
                        </div>
                   
                      {totalAmount > 0 && (
                        <div className="border-t pt-1 mt-1">
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Total Required:</span>
                            <span className={isBalanceSufficient ? "text-green-600" : "text-red-600"}>
                              ${totalAmount.toLocaleString()}
                            </span>
                          </div>
                          {!isBalanceSufficient && (
                            <div className="text-xs text-red-600 mt-1">
                              Insufficient balance
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {selectedFundHead ? 'No funds available' : 'Select a fund head to view funds'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Asset Selection Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Assets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Asset Category */}
                <div className="space-y-2">
                  <Label htmlFor="asset-category">Asset Category</Label>
                  <Select 
                    value={selectedAssetCategory} 
                    onValueChange={(value) => {
                      setSelectedAssetCategory(value);
                      setSelectedAsset(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Categories</SelectItem>
                      {assetCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
  {/* Asset Selection */}
                <div className="space-y-2">
                  <Label htmlFor="asset-select">Select Asset *</Label>
                  <Select 
                    value={selectedAsset?.id.toString() || ''} 
                    onValueChange={handleAssetSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={filteredAssets.length > 0 ? "Choose asset" : "No assets found"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{asset.name}</span>
                              {asset.details && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {asset.details}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">
                          {searchAsset || selectedAssetCategory !== '0' ? 'No assets found' : 'No assets available'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Asset Search */}
                <div className="space-y-2">
                  <Label htmlFor="asset-search">Search Asset</Label>
                  <Input
                    id="asset-search"
                    type="text"
                    placeholder="Search by name or details..."
                    value={searchAsset}
                    onChange={(e) => {
                      setSearchAsset(e.target.value);
                      if (selectedAsset && !e.target.value) {
                        setSelectedAsset(null);
                      }
                    }}
                  />
                </div>

              
              </div>

              {/* Quantity and Amount Inputs */}
              {selectedAsset && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="current-qty">Current Quantity</Label>
                    <Input
                      id="current-qty"
                      type="text"
                      value={selectedAsset.current_qty || 0}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-qty">New Quantity *</Label>
                    <Input
                      id="new-qty"
                      type="number"
                      placeholder="Enter quantity"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      onKeyPress={handleAssetKeyPress}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyPress={handleAssetKeyPress}
                      min="0.01"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={addAssetToTable}
                      className="w-full"
                      disabled={!newQty || !amount}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to List
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Items Table */}
            {transactionItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Transaction Items ({transactionItems.length})</h3>
                  <div className="text-lg font-bold">
                    Total: ${totalAmount.toLocaleString()}
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b431b] dark:bg-gray-800">
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                          Asset
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                          Current Qty
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                          Remaining Qty
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                          New Qty
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                          Amount
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-white dark:text-gray-200">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.asset_name}
                          </td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.current_qty}
                          </td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.remaining_qty}
                          </td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.new_qty}
                          </td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                            ${item.amount.toLocaleString()}
                          </td>
                          <td className="border p-2 text-sm text-gray-900 dark:text-gray-100">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeAssetFromTable(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmit} 
                    size="lg"
                    disabled={!isBalanceSufficient}
                  >
                    Create Transaction
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}