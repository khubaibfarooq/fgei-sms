import React, { useEffect,useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';
import IconPicker from '@/components/ui/icon-picker';
import MultiSelect from '@/components/ui/MultiSelect';
import { toast } from 'sonner';
interface FormProps {
  dashboardCard?: {
    id: number;
    title: string;
    link: string;
        icon: string;

        color: string;
redirectlink:string;
    role_id: string;
  };
  roles: Array<{ id: number; name: string }>;
}

export default function DashboardCardForm({ dashboardCard, roles }: FormProps) {
  const isEdit = !!dashboardCard;
  console.log(dashboardCard);
  const { data, setData, processing, errors, reset } = useForm<{
    id: number | '';
    title: string;
    link: string;
     color: string;
     icon:string | ''
    role_id: string | '';
    redirectlink:string | '';
  }>({
    id:dashboardCard?.id ||'',
    title: dashboardCard?.title || '',
    link: dashboardCard?.link || '',
        color: dashboardCard?.color || '',
      icon: dashboardCard?.icon || '',
    role_id: dashboardCard?.role_id || '',
    redirectlink:dashboardCard?.redirectlink || '',
  });

  useEffect(() => {
    if (dashboardCard) {
      setData((prev) => ({
        ...prev,
        title: dashboardCard.title ?? '',
        link: dashboardCard.link ?? '',
         color: dashboardCard.color ?? '',
            icon: dashboardCard.icon ?? '',
        role_id: dashboardCard.role_id ?? '',
          redirectlink: dashboardCard.redirectlink ?? '',
      }));
    } else {
      setData((prev) => ({
        ...prev,
        title: '',
        link: '',
         color: '',
         icon:'',
        role_id: '',
              redirectlink: '',
      }));
    }
  }, [dashboardCard, setData]);

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const submitData = {
    id:data.id,
         title: data.title ,
        link: data.link ,
         color: data.color ,
            icon: data.icon ,
        role_id:selectedValues.join(','),
          redirectlink: data.redirectlink,
  
    };
  if (isEdit) {
    router.put(`/dashboardcards/${dashboardCard?.id}`, submitData, {
      preserveScroll: true,
      preserveState: true,
      onError: (errors) => console.log(errors), // Log errors for debugging
    });
  } else {
    router.post('/dashboardcards', submitData, {
      onSuccess: () => reset(),
      onError: (errors) => console.log(errors),
    });
  }
};

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Cards', href: '/dashboardcards' },
    { title: isEdit ? 'Edit Dashboard Card' : 'Add Dashboard Card', href: '#' },
  ];
  const options = React.useMemo(() => {
    if (!roles) return [];
    
    if (Array.isArray(roles)) {
      return roles.map(role => ({
        value: role.id.toString(),
        label: role.name
      }));
    }
    
    // Convert object { "1": "Class Room", "2": "Meeting Room" } to options array
    return Object.entries(roles).map(([id, name]) => ({
      value: id,
      label: name as string
    }));
  }, [roles]);
  // Initialize selected values from blockType.room_type_Ids
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
  
    // Parse the room_type_Ids string and set as selected values
    useEffect(() => {
      if (dashboardCard?.role_id) {
        // Convert comma-separated string to array: "1,2,3" -> ["1", "2", "3"]
        const roleIdsArray = dashboardCard.role_id
          .split(',')
          .map(id => id.trim())
          .filter(id => id !== '' && id !== null && id !== undefined);
        
        setSelectedValues(roleIdsArray);
      } else {
        setSelectedValues([]);
      }
    }, [dashboardCard]);
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Dashboard Card' : 'Add Dashboard Card'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Dashboard Card' : 'Add Dashboard Card'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Update card details' : 'Create a new dashboard card'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Enter card title"
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    value={data.link}
                    onChange={(e) => setData('link', e.target.value)}
                    placeholder="Enter card link"
                  />
                  {errors.link && <p className="text-red-500 text-sm">{errors.link}</p>}
                </div>
              </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role */}
              <div className="space-y-2">
                {/* Room Types MultiSelect Field */}
                         
                                <MultiSelect
                                  options={options}
                                  value={selectedValues}
                                  onChange={setSelectedValues}
                                  placeholder="Choose roles ..."
                                  label="Select Roles"
                                />
                                <div className="text-sm text-muted-foreground">
                                  {selectedValues.length > 0 
                                    ? `${selectedValues.length} role  selected: ${selectedValues.map(id => {
                                        const role = options.find(opt => opt.value === id);
                                        return role ? role.label : id;
                                      }).join(', ')}` 
                                    : 'No Role  selected'
                                  }
                                </div>
                                {errors.role_id && (
                                  <p className="text-sm text-red-500">{errors.role_id}</p>
                                )}
{/*                               
                <Label htmlFor="role_id">Role</Label>
                <Select
                  value={data.role_id ? data.role_id.toString() : ''}
                  onValueChange={(value) => setData('role_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                {errors.role_id && <p className="text-red-500 text-sm">{errors.role_id}</p>}
                   <div className="space-y-2">
                                  <Label htmlFor="icon">Icon</Label>
                                  <IconPicker value={data.icon} onChange={(val) => setData('icon', val)} />
                                  {errors.icon && <p className="text-sm text-red-500">{errors.icon}</p>}
                                </div>
           </div>
 <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                type='color'
                    id="color"
                    value={data.color}
                    onChange={(e) => setData('color', e.target.value)}
                  />
                {errors.color && <p className="text-red-500 text-sm">{errors.color}</p>}
                   <Label htmlFor="redirectlink">Redirect Link</Label>
                <Input
               
                    id="redirectlink"
                    value={data.redirectlink}
                    onChange={(e) => setData('redirectlink', e.target.value)}
                  />
                {errors.redirectlink && <p className="text-red-500 text-sm">{errors.redirectlink}</p>}
              </div>
              </div>
              {/* Actions */}
              <div className="flex items-center justify-between pt-6">
                <Link href="/dashboardcards">
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
                    : 'Add Card'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
