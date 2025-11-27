import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';

interface BlockFormProps {
  block?: {
    id: number;
    name: string;
    area: number;
    img:string | null;
    institute_id: number;
    block_type_id?: number;
    establish_date?: string;
  };
  blockTypes: Record<string, string>; // Changed from Array to Record (object)
}

export default function BlockForm({ block, blockTypes }: BlockFormProps) {
  const isEdit = !!block;
  
  console.log('blockTypes:', blockTypes);

  // Convert blockTypes object to array format for the Select component
  const blockTypesArray = React.useMemo(() => {
    if (!blockTypes) return [];
    
    // If blockTypes is already an array, use it directly
    if (Array.isArray(blockTypes)) {
      return blockTypes;
    }
    
    // Convert object { "1": "Administration", "2": "Academic" } to array format
    return Object.entries(blockTypes).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [blockTypes]);

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    area: number;
    institute_id: number;
    block_type_id: number;
    img:string |File | null;
    establish_date?: string;
  }>({
    name: block?.name || '',
    area: block?.area || 0,
    institute_id: block?.institute_id || 0,
    block_type_id: block?.block_type_id || 0,
    img: block?.img || null,
    establish_date: block?.establish_date || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
       const formData = new FormData();
    (Object.keys(data) as Array<keyof typeof data>).forEach(key => {
      // Skip null or empty values
  
      if (data[key] === null || data[key] === '') {
        return;
      }
      // Handle file uploads separately
      if (key === 'img') {
        if (data[key] instanceof File) {
          formData.append(key, data[key] as File);
        }
        return;
      }

     

      // Handle all other values
      formData.append(key, data[key] as string);
    });
    if (isEdit) {
         formData.append('_method', 'PUT');
      router.post(`/blocks/${block.id}`, formData, {
                forceFormData: true,
        preserveScroll: true,
        preserveState: true,
          onSuccess: () => {
           router.get('/blocks'); 
        },
      });
    } else {
      router.post('/blocks', formData, {
        onSuccess: () => {
          reset(); // Clear form data on successful POST
        },
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blocks', href: '/blocks' },
    { title: isEdit ? 'Edit Block' : 'Add Block', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Block' : 'Add Block'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Block' : 'Add Block'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit block details' : 'Create a new block'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6" encType='multipart/form-data'>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Block Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter block name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={data.area}
                    onChange={(e) => setData('area', Number(e.target.value))}
                    placeholder="Enter area"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="block_type_id">Block Type</Label>
                  <Select
                    value={data.block_type_id.toString()}
                    onValueChange={(value) => setData('block_type_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select block type" />
                    </SelectTrigger>
                    <SelectContent>
                      {blockTypesArray.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establish_date">Establish Date</Label>
                  <Input
                    id="establish_date"
                    type="date"
                    value={data.establish_date || ''}
                    onChange={(e) => setData('establish_date', e.target.value)}
                    placeholder="Select establish date"
                  />
                </div>
                  <div className="space-y-2">
            
                                    <Label htmlFor="img">Image</Label>
                                    <Input
                                      id="img"
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => setData('img', e.target.files?.[0] || null)}
                                    />
                                  
                               
                              </div>
                              <div className="space-y-2">
                                    <Label>Image Preview</Label>
                                    <ImagePreview dataImg={data.img} /> 
                                    </div>
              </div>

             

              <div className="flex items-center justify-between pt-6">
                <Link href="/blocks">
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
                    : 'Add Block'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function ImagePreview({ dataImg }: { dataImg: string | File | null }) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(() => {
    if (!dataImg) return null;
    return typeof dataImg === 'string' ? `/assets/${dataImg}` : null;
  });

  React.useEffect(() => {
    if (dataImg instanceof File) {
      const url = URL.createObjectURL(dataImg);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof dataImg === 'string' && dataImg) {
      setPreviewUrl(`/assets/${dataImg}`);
    } else {
      setPreviewUrl(null);
    }
  }, [dataImg]);

  if (!previewUrl) {
    return <p className="text-sm text-muted-foreground">No image uploaded.</p>;
  }

  return (
    <img
      src={previewUrl}
      alt="Layout"
      className="w-full h-48 object-cover rounded"
    />
  );
}