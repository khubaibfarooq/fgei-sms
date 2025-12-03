import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface TypeFormProps {
  type?: {
    id: number;
    name: string;
    module: string;
    parent_id?: string;
    isblock?: boolean;
    isroom?: boolean;
    isasset?: boolean;
  };
  types?: Record<string, string>;
}

export default function TypeForm({ type, types }: TypeFormProps) {
  const isEdit = !!type;

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    module: string;
    parent_id: string;
    isblock: boolean;
    isroom: boolean;
    isasset: boolean;
  }>({
    name: type?.name || '',
    parent_id: type?.parent_id || 'none',
    module: type?.module || '',
    isblock: type?.isblock || false,
    isroom: type?.isroom || false,
    isasset: type?.isasset || false,
  });

  const typesArray = React.useMemo(() => {
    if (!types) return [];

    // If types is already an array, use it directly
    if (Array.isArray(types)) {
      return types;
    }

    // Convert object { "1": "Type Name", "2": "Another Type" } to array format
    return Object.entries(types).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [types]);

  // Cascading checkbox handlers
  const handleBlockChange = (checked: boolean) => {
    setData('isblock', checked);
    // If unchecking block, also uncheck room and asset
    if (!checked) {
      setData('isroom', false);
      setData('isasset', false);
    }
  };

  const handleRoomChange = (checked: boolean) => {
    setData('isroom', checked);
    // If checking room, also check block
    if (checked) {
      setData('isblock', true);
    }
    // If unchecking room, also uncheck asset
    if (!checked) {
      setData('isasset', false);
    }
  };

  const handleAssetChange = (checked: boolean) => {
    setData('isasset', checked);
    // If checking asset, also check room and block
    if (checked) {
      setData('isroom', true);
      setData('isblock', true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data, converting 'none' to null for parent_id
    const submitData = {
      ...data,
      parent_id: data.parent_id === 'none' ? null : data.parent_id,
    };

    if (isEdit) {
      router.put(`/types/${type.id}`, submitData, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          router.get('/types');
        },
      });
    } else {
      router.post('/types', submitData, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Types', href: '/types' },
    { title: isEdit ? 'Edit Type' : 'Add Type', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Type' : 'Add Type'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Type' : 'Add Type'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Type details' : 'Create a new Type'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Type Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter Type name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}

                <Label htmlFor="module">Module (Table Name)</Label>
                <Input
                  id="module"
                  value={data.module}
                  onChange={(e) => setData('module', e.target.value)}
                  placeholder="Enter module/table name"
                />
                {errors.module && (
                  <p className="text-sm text-red-600">{errors.module}</p>
                )}

                <Label htmlFor="parent_id">Parent Type</Label>
                <Select
                  value={data.parent_id.toString()}
                  onValueChange={(value) => setData('parent_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parent Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {typesArray.map((typeItem) => (
                      <SelectItem key={typeItem.id} value={typeItem.id.toString()}>
                        {typeItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parent_id && (
                  <p className="text-sm text-red-600">{errors.parent_id}</p>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-base font-semibold">Include Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isblock"
                      checked={data.isblock}
                      onCheckedChange={(checked) => handleBlockChange(checked as boolean)}
                    />
                    <Label
                      htmlFor="isblock"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Block Included
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isroom"
                      checked={data.isroom}
                      onCheckedChange={(checked) => handleRoomChange(checked as boolean)}
                    />
                    <Label
                      htmlFor="isroom"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Room Included
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isasset"
                      checked={data.isasset}
                      onCheckedChange={(checked) => handleAssetChange(checked as boolean)}
                    />
                    <Label
                      htmlFor="isasset"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Asset Included
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/types">
                  <Button type="button" variant="secondary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <Button type="submit" disabled={processing}>
                  <Save className="mr-2 h-4 w-4" />
                  {processing
                    ? isEdit
                      ? 'Saving...'
                      : 'Adding...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Add Type'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}