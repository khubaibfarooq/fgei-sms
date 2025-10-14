import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import MultiSelect from '@/components/ui/MultiSelect';

interface BlockTypeFormProps {
  blockType?: {
    id: number;
    name: string;
    room_type_Ids: string; // This contains the pre-selected IDs like "1,2,3"
  };
  roomTypes: Record<string, string>; // { "1": "Class Room", "2": "Meeting Room" }
}

export default function BlockTypeForm({ blockType, roomTypes }: BlockTypeFormProps) {
  const isEdit = !!blockType;
  
  // Convert roomTypes object to MultiSelect options format
  const options = React.useMemo(() => {
    if (!roomTypes) return [];
    
    if (Array.isArray(roomTypes)) {
      return roomTypes.map(roomType => ({
        value: roomType.id.toString(),
        label: roomType.name
      }));
    }
    
    // Convert object { "1": "Class Room", "2": "Meeting Room" } to options array
    return Object.entries(roomTypes).map(([id, name]) => ({
      value: id,
      label: name as string
    }));
  }, [roomTypes]);

  // Initialize selected values from blockType.room_type_Ids
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Parse the room_type_Ids string and set as selected values
  useEffect(() => {
    if (blockType?.room_type_Ids) {
      // Convert comma-separated string to array: "1,2,3" -> ["1", "2", "3"]
      const roomIdsArray = blockType.room_type_Ids
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '' && id !== null && id !== undefined);
      
      console.log('Parsed room_type_Ids:', roomIdsArray);
      setSelectedValues(roomIdsArray);
    } else {
      setSelectedValues([]);
    }
  }, [blockType]);

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    room_type_Ids: string;
  }>({
    name: blockType?.name || '',
    room_type_Ids: blockType?.room_type_Ids || '',
  });

  // Update form data when selectedValues change
  useEffect(() => {
    const roomTypeIdsString = selectedValues.join(',');
    setData('room_type_Ids', roomTypeIdsString);
  }, [selectedValues, setData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      name: data.name,
      room_type_Ids: selectedValues.join(','),
    };

    console.log('Submitting data:', submitData);

    if (isEdit) {
      router.put(`/block-types/${blockType.id}`, submitData, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          console.log('Block type updated successfully');
        },
        onError: (errors) => {
          console.log('Errors:', errors);
        }
      });
    } else {
      router.post('/block-types', submitData, {
        onSuccess: () => {
          console.log('Block type created successfully');
        },
        onError: (errors) => {
          console.log('Errors:', errors);
        }
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Block Types', href: '/block-types' },
    { title: isEdit ? 'Edit Block Type' : 'Add Block Type', href: '#' },
  ];

 

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Block Type' : 'Add Block Type'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Block Type' : 'Add Block Type'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit Block type details' : 'Create a new Block type'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Block Type Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Block Type Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter Block type name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Room Types MultiSelect Field */}
              <div className="space-y-2">
               
                <MultiSelect
                  options={options}
                  value={selectedValues}
                  onChange={setSelectedValues}
                  placeholder="Choose room types..."
                  label="Select Room Types"
                />
                <div className="text-sm text-muted-foreground">
                  {selectedValues.length > 0 
                    ? `${selectedValues.length} room type(s) selected: ${selectedValues.map(id => {
                        const roomType = options.find(opt => opt.value === id);
                        return roomType ? roomType.label : id;
                      }).join(', ')}` 
                    : 'No room types selected'
                  }
                </div>
                {errors.room_type_Ids && (
                  <p className="text-sm text-red-500">{errors.room_type_Ids}</p>
                )}
              </div>

             

              <div className="flex items-center justify-between pt-6">
                <Link href="/block-types">
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
                    : 'Add Block Type'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}