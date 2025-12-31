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
import { Save, ArrowLeft, Plus, Trash2, Building } from 'lucide-react';
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

      <div className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
              {isEdit ? 'Modify Asset' : 'Register Assets'}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">
              {isEdit ? 'Update existing inventory record' : 'Batch add new assets to institute rooms'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Header Section: Room and Date */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end bg-muted/20 p-4 md:p-6 rounded-2xl border border-primary/5">
                <div className="space-y-2 md:col-span-5">
                  <Label htmlFor="room_id" className="text-[10px] uppercase font-black tracking-widest text-primary/70 ml-1">Location / Room</Label>
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
                    <p className="text-[10px] font-bold text-destructive italic">{errors.room_id}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-4">
                  <Label htmlFor="added_date" className="text-[10px] uppercase font-black tracking-widest text-primary/70 ml-1">Registration Date</Label>
                  <Input
                    id="added_date"
                    type="date"
                    value={addedDate}
                    onChange={(e) => setAddedDate(e.target.value)}
                    className="bg-background font-bold h-10"
                  />
                  {errors.added_date && (
                    <p className="text-[10px] font-bold text-destructive italic">{errors.added_date}</p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <Button
                    type="button"
                    onClick={handleAddRow}
                    className="w-full h-10 font-black uppercase text-[10px] tracking-widest shadow-sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Row (Shift+Enter)
                  </Button>
                </div>
              </div>

              {errors.assets && (
                <p className="text-sm font-bold text-destructive text-center bg-destructive/5 py-2 rounded-md border border-destructive/10 animate-pulse">{errors.assets}</p>
              )}

              {/* Assets Section */}
              <div className="space-y-4">
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                  <div className="col-span-12 lg:col-span-5">Asset Details</div>
                  <div className="col-span-12 lg:col-span-2">Quantity</div>
                  <div className="col-span-12 lg:col-span-4">Description / Condition</div>
                  <div className="col-span-12 lg:col-span-1 text-center">Action</div>
                </div>

                <div className="space-y-4 md:space-y-1">
                  {assetRows.length > 0 ? (
                    assetRows.map((row, index) => (
                      <div
                        key={row.id}
                        data-row-id={row.id}
                        className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 bg-card md:bg-transparent p-5 md:p-3 rounded-2xl md:rounded-none border md:border-0 md:border-b last:border-0 hover:bg-primary/[0.02] transition-colors shadow-sm md:shadow-none"
                      >
                        {/* Asset Column */}
                        <div className="space-y-1 md:col-span-12 lg:col-span-5">
                          <Label className="md:hidden text-[9px] uppercase font-black text-primary/50 mb-1 block tracking-widest">Select Asset</Label>
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
                            <p className="text-[10px] font-bold text-destructive italic mt-1">
                              {errors[`assets.${index}.asset_id`]}
                            </p>
                          )}
                        </div>

                        {/* Qty Column */}
                        <div className="space-y-1 md:col-span-12 lg:col-span-2">
                          <Label className="md:hidden text-[9px] uppercase font-black text-primary/50 mb-1 block tracking-widest">Current Qty</Label>
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
                            className="font-bold h-10 md:h-9"
                          />
                          {errors[`assets.${index}.current_qty`] && (
                            <p className="text-[10px] font-bold text-destructive italic mt-1">
                              {errors[`assets.${index}.current_qty`]}
                            </p>
                          )}
                        </div>

                        {/* Details Column */}
                        <div className="space-y-1 md:col-span-12 lg:col-span-4">
                          <Label className="md:hidden text-[9px] uppercase font-black text-primary/50 mb-1 block tracking-widest">Description</Label>
                          <Input
                            type="text"
                            value={row.details}
                            onChange={(e) =>
                              handleRowChange(row.id, 'details', e.target.value)
                            }
                            placeholder="Condition, batch, etc."
                            className="font-medium h-10 md:h-9"
                          />
                          {errors[`assets.${index}.details`] && (
                            <p className="text-[10px] font-bold text-destructive italic mt-1">
                              {errors[`assets.${index}.details`]}
                            </p>
                          )}
                        </div>

                        {/* Actions Column */}
                        <div className="md:col-span-12 lg:col-span-1 flex items-center justify-end md:justify-center pt-2 md:pt-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full md:w-auto font-black text-[10px] uppercase tracking-widest h-9"
                          >
                            <Trash2 className="h-4 w-4 mr-2 md:mr-0" />
                            <span className="md:hidden">Remove Asset</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
                        <Building className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <div className="max-w-[280px]">
                        <p className="font-bold text-sm text-foreground/70 uppercase tracking-tight">Empty Inventory Batch</p>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-1">
                          Use the button above to add assets to this room. You can add multiple assets at once.
                        </p>
                      </div>
                      <Button type="button" size="sm" onClick={handleAddRow} variant="outline" className="font-black text-[10px] uppercase tracking-widest mt-2 h-9">
                        <Plus className="mr-2 h-4 w-4" /> Start Adding
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t">
                <Link href="/institute-assets" className="w-full md:w-auto order-2 md:order-1">
                  <Button type="button" variant="ghost" className="w-full font-black uppercase text-[10px] tracking-widest h-12 md:h-10">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                  </Button>
                </Link>
                <div className="flex w-full md:w-auto gap-3 order-1 md:order-2">
                  <Button
                    type="submit"
                    className="flex-1 md:flex-none w-full md:w-48 h-12 md:h-10 font-black uppercase text-[10px] tracking-[0.1em] shadow-lg shadow-primary/20"
                    disabled={processing || assetRows.length === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? 'Saving...' : isEdit ? 'Update Record' : 'Commit Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}