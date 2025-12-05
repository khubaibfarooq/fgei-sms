import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import Combobox from '@/components/ui//combobox';

interface AssetRow {
  id: string;
  asset_id: number | '';
  current_qty: number | '';
  details: string;
}

interface InstituteAssetFormProps {
  instituteAsset?: {
    id: number;
    current_qty: number;
    details: string;
    added_date: string;
    room_id: number;
    asset_id: number;
    institute_id: number;
    asset?: {
      id: number;
      name: string;
      category?: {
        id: number;
        name: string;
      };
    };
  };

  assets: Array<{
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  }>;
  rooms: Array<{
    id: number;
    name: string;
    block?: {
      id: number;
      name: string;
    };
    type?: {
      id: number;
      name: string;
    };
  }>;

}

export default function InstituteAssetForm({ instituteAsset, assets, rooms }: InstituteAssetFormProps) {
  const isEdit = !!instituteAsset;

  // State for room and date (shared across all assets)
  const [roomId, setRoomId] = useState<number | ''>(instituteAsset?.room_id || '');
  const [addedDate, setAddedDate] = useState<string>(
    instituteAsset?.added_date || new Date().toISOString().split('T')[0]
  );

  // State for dynamic asset rows
  const [assetRows, setAssetRows] = useState<AssetRow[]>(
    isEdit
      ? [{
        id: '1',
        asset_id: instituteAsset.asset_id,
        current_qty: instituteAsset.current_qty,
        details: instituteAsset.details,
      }]
      : []
  );

  const { processing, setData, post, put } = useForm<{
    room_id: number | '';
    added_date: string;
    assets: Array<{
      asset_id: number | '';
      current_qty: number | '';
      details: string;
    }>;
  }>({
    room_id: roomId,
    added_date: addedDate,
    assets: [],
  });

  const [errors, setErrors] = useState<{
    room_id?: string;
    added_date?: string;
    assets?: string;
    [key: string]: string | undefined;
  }>({});

  // Ref to track newly added row ID for auto-focus
  const newlyAddedRowIdRef = useRef<string | null>(null);

  // Add a new empty row
  const handleAddRow = () => {
    const newRowId = Date.now().toString();
    const newRow: AssetRow = {
      id: newRowId,
      asset_id: '',
      current_qty: '',
      details: '',
    };
    setAssetRows([...assetRows, newRow]);
    newlyAddedRowIdRef.current = newRowId;
  };

  // Focus on the asset combobox when a new row is added
  useEffect(() => {
    if (newlyAddedRowIdRef.current) {
      // Small timeout to ensure the DOM is updated
      setTimeout(() => {
        const assetButton = document.querySelector(
          `[data-row-id="${newlyAddedRowIdRef.current}"] button[role="combobox"]`
        ) as HTMLButtonElement;
        if (assetButton) {
          assetButton.click();
        }
        newlyAddedRowIdRef.current = null;
      }, 50);
    }
  }, [assetRows]);

  // Delete a row
  const handleDeleteRow = (id: string) => {
    setAssetRows(assetRows.filter((row) => row.id !== id));
  };

  // Update a specific row field
  const handleRowChange = (id: string, field: keyof AssetRow, value: any) => {
    setAssetRows(
      assetRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // Handle Shift+Enter keyboard shortcut to add a new row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleAddRow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [assetRows]); // Include assetRows as dependency since handleAddRow uses it

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: typeof errors = {};

    if (!roomId) {
      newErrors.room_id = 'Room is required';
    }

    if (!addedDate) {
      newErrors.added_date = 'Date is required';
    }

    if (assetRows.length === 0) {
      newErrors.assets = 'Please add at least one asset';
    }

    // Validate each row
    assetRows.forEach((row, index) => {
      if (!row.asset_id) {
        newErrors[`assets.${index}.asset_id`] = 'Asset is required';
      }
      if (!row.current_qty) {
        newErrors[`assets.${index}.current_qty`] = 'Quantity is required';
      }
      if (!row.details) {
        newErrors[`assets.${index}.details`] = 'Description is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const formData = {
      room_id: roomId,
      added_date: addedDate,
      assets: assetRows.map(({ id, ...rest }) => rest),
    };

    if (isEdit) {
      router.put(`/institute-assets/${instituteAsset.id}`, {
        ...formData,
        // For edit, send only the first asset (single record)
        asset_id: assetRows[0].asset_id,
        current_qty: assetRows[0].current_qty,
        details: assetRows[0].details,
      }, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/institute-assets', formData, {
        onSuccess: () => {
          // Reset form
          setAssetRows([]);
          setErrors({});
        },
        onError: (errors) => {
          setErrors(errors as typeof errors);
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institute Assets', href: '/institute-assets' },
    { title: isEdit ? 'Edit Asset' : 'Add Asset', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Institute Asset' : 'Add Institute Asset'} />

      <div className="flex-1 p-4 md:p-6 w-[90vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Institute Asset' : 'Add Institute Asset'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit institute asset details' : 'Add new assets to institute inventory'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Row: Room and Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="room_id">Room</Label>
                  <Combobox
                    entity="room"
                    value={roomId.toString()}
                    onChange={(value) => setRoomId(value ? parseInt(value) : '')}
                    options={rooms.map((room) => ({
                      id: room.id.toString(),
                      name: room.name + (room.block ? ` (${room.block.name})` : '') + (room.type ? ` - ${room.type.name}` : ''),
                    }))}
                    includeAllOption={false}
                  />
                  {errors.room_id && (
                    <p className="text-sm text-destructive">{errors.room_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="added_date">Added Date</Label>
                  <Input
                    id="added_date"
                    type="date"
                    value={addedDate}
                    onChange={(e) => setAddedDate(e.target.value)}
                  />
                  {errors.added_date && (
                    <p className="text-sm text-destructive">{errors.added_date}</p>
                  )}
                </div>

                <div>
                  <Button type="button" onClick={handleAddRow} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                  </Button>
                </div>
              </div>

              {errors.assets && (
                <p className="text-sm text-destructive">{errors.assets}</p>
              )}

              {/* Asset Table */}
              {assetRows.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="p-3 text-left font-medium">Asset</th>
                        <th className="p-3 text-left font-medium w-32">Quantity</th>
                        <th className="p-3 text-left font-medium">Description</th>
                        <th className="p-3 text-center font-medium w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetRows.map((row, index) => (
                        <tr key={row.id} data-row-id={row.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            <Combobox
                              entity="asset"
                              value={row.asset_id.toString()}
                              onChange={(value) =>
                                handleRowChange(row.id, 'asset_id', value ? parseInt(value) : '')
                              }
                              options={assets.map((asset) => ({
                                id: asset.id.toString(),
                                name: asset.name + (asset.category ? ` (${asset.category.name})` : ''),
                              }))}
                              includeAllOption={false}
                            />
                            {errors[`assets.${index}.asset_id`] && (
                              <p className="text-sm text-destructive mt-1">
                                {errors[`assets.${index}.asset_id`]}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              value={row.current_qty}
                              onChange={(e) =>
                                handleRowChange(
                                  row.id,
                                  'current_qty',
                                  e.target.value ? parseInt(e.target.value) : ''
                                )
                              }
                              placeholder="Qty"
                            />
                            {errors[`assets.${index}.current_qty`] && (
                              <p className="text-sm text-destructive mt-1">
                                {errors[`assets.${index}.current_qty`]}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              type="text"
                              value={row.details}
                              onChange={(e) =>
                                handleRowChange(row.id, 'details', e.target.value)
                              }
                              placeholder="Enter description"
                            />
                            {errors[`assets.${index}.details`] && (
                              <p className="text-sm text-destructive mt-1">
                                {errors[`assets.${index}.details`]}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {assetRows.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <p>No assets added yet. Click "Add Row" to start adding assets.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                <Link href="/institute-assets">
                  <Button type="button" variant="secondary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <Button type="submit" disabled={processing || assetRows.length === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  {processing
                    ? 'Saving...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Save Assets'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}