import React,{useEffect,useState} from 'react';
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

interface RoomTypeFormProps {
  roomType?: {
    id: number;
    name: string;
    assets_id:string;
  };
   assets: Record<string, string>; 
}

export default function RoomTypeForm({ roomType,assets }: RoomTypeFormProps) {
  const isEdit = !!roomType;

  console.log(roomType);
 const options = React.useMemo(() => {
    if (!assets) return [];
    
    if (Array.isArray(assets)) {
      return assets.map(asset => ({
        value: asset.id.toString(),
        label: asset.name
      }));
    } return Object.entries(assets).map(([id, name]) => ({
      value: id,
      label: name as string
    }));
  }, [assets]);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
  // Parse the room_type_Ids string and set as selected values
    useEffect(() => {
      if (roomType?.assets_id) {
        // Convert comma-separated string to array: "1,2,3" -> ["1", "2", "3"]
        const assetsArray = roomType.assets_id
          .split(',')
          .map(id => id.trim())
          .filter(id => id !== '' && id !== null && id !== undefined);
        
        setSelectedValues(assetsArray);
      } else {
        setSelectedValues([]);
      }
    }, [roomType]);
  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    assets_id:string;
  }>({
    name: roomType?.name || '',
    assets_id:roomType?.assets_id|| '',
  });
  useEffect(() => {
    const assetsidString = selectedValues.join(',');
    setData('assets_id', assetsidString);
  }, [selectedValues, setData]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/room-types/${roomType.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/room-types', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Room Types', href: '/room-types' },
    { title: isEdit ? 'Edit Room Type' : 'Add Room Type', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Room Type' : 'Add Room Type'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Room Type' : 'Add Room Type'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit room type details' : 'Create a new room type'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Room Type Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter room type name"
                />
                
               
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
                {errors.assets_id && (
                  <p className="text-sm text-red-500">{errors.assets_id}</p>
                )}
             
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link href="/room-types">
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
                    : 'Add Room Type'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}