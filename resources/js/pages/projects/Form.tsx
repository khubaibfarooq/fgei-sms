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

interface ProjectFormProps {
  project?: {
    id: number;
    name: string;
    cost: number;
    institute_id: number;
    project_type_id?: number;
    status:string;
  };
  projectTypes: Record<string, string>; // Changed from Array to Record (object)
}

export default function ProjectForm({ project, projectTypes }: ProjectFormProps) {
  const isEdit = !!project;
  
  console.log('projectTypes:', projectTypes);

  // Convert projectTypes object to array format for the Select component
  const projectTypesArray = React.useMemo(() => {
    if (!projectTypes) return [];
    
    // If projectTypes is already an array, use it directly
    if (Array.isArray(projectTypes)) {
      return projectTypes;
    }
    
    // Convert object { "1": "Administration", "2": "Academic" } to array format
    return Object.entries(projectTypes).map(([id, name]) => ({
      id: parseInt(id),
      name: name as string
    }));
  }, [projectTypes]);

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    cost: number;
    institute_id: number;
    project_type_id: number;
       status:string;
  }>({
    name: project?.name || '',
    cost: project?.cost || 0,
    institute_id: project?.institute_id || 0,
    project_type_id: project?.project_type_id || 0,
       status:project?.status || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      router.put(`/projects/${project.id}`, data, {
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      router.post('/projects', data);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: isEdit ? 'Edit Project' : 'Add Project', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Project' : 'Add Project'} />

      <div className="flex-1 p-4 md:p-6 w-[70vw] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEdit ? 'Edit Project' : 'Add Project'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Edit project details' : 'Create a new project'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={data.cost}
                    onChange={(e) => setData('cost', Number(e.target.value))}
                    placeholder="Enter cost"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project_type_id">Project Type</Label>
                  <Select
                    value={data.project_type_id.toString()}
                    onValueChange={(value) => setData('project_type_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypesArray.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="Status">Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      
                        <SelectItem key='completed' value='completed'>
                          Completed
                        </SelectItem>
                         <SelectItem key='planned ' value='planned '>
                          Planned 
                        </SelectItem>
                         <SelectItem key='inprogress' value='inprogress'>
                          In Progress
                        </SelectItem>
                    </SelectContent>
                  </Select>
                  
                </div>
              </div>

             

              <div className="flex items-center justify-between pt-6">
                <Link href="/projects">
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
                    : 'Add Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}