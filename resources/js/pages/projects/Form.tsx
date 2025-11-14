// resources/js/pages/projects/form.tsx
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { ImagePreview } from '@/components/ui/image-preview';
interface MilestoneRow {
  key: number;                          // For React rendering
  id?: number;                          // Laravel milestone ID
  name: string;
  description: string;
  due_date: string;
  status: 'planned' | 'inprogress' | 'completed';
  completed_date: string | null;
  img: File | null;
  preview?: string;                     // Data URL preview
  existingImg?: string;                 // Path from DB (e.g. "milestones/abc.jpg")
}

interface ProjectFormProps {
  project?: {
    id?: number;
    name: string;
    cost: number;
    project_type_id?: number;
    status: string;
    milestones?: Array<{
      id: number;
      name: string;
      description: string | null;
      due_date: string;
      status: 'planned' | 'inprogress' | 'completed';
      completed_date: string | null;
      img: string | null;
    }>;
  };
  projectTypes: Record<string, string>;
}

export default function ProjectForm({ project, projectTypes }: ProjectFormProps) {
  const isEdit = !!project?.id;

  const [name, setName] = useState(project?.name || '');
  const [cost, setCost] = useState(project?.cost?.toString() || '');
  const [projectTypeId, setProjectTypeId] = useState((project?.project_type_id || '').toString());
  const [status, setStatus] = useState<'planned' | 'inprogress' | 'completed'>(
    (project?.status as any) || 'planned'
  );

  const [milestones, setMilestones] = useState<MilestoneRow[]>(
    project?.milestones?.map((m) => ({
      key: Date.now() + m.id,
      id: m.id,
      name: m.name,
      description: m.description || '',
      due_date: m.due_date,
      status: m.status,
      completed_date: m.completed_date || null,
      img: null,
      existingImg: m.img || undefined,        // ← null → undefined
      preview: m.img ? `${m.img}` : undefined,
    })) || []
  );

  const projectTypesArray = Object.entries(projectTypes).map(([id, name]) => ({
    id: parseInt(id),
    name,
  }));

  const addMilestone = () => {
    setMilestones(prev => [...prev, {
      key: Date.now(),
      name: '',
      description: '',
      due_date: '',
      status: 'planned',
      completed_date: null,
      img: null,
    }]);
  };

  const removeMilestone = (key: number) => {
    setMilestones(prev => prev.filter(m => m.key !== key));
    toast.success('Milestone removed');
  };

  const updateMilestone = (key: number, field: keyof MilestoneRow, value: any) => {
    setMilestones(prev => prev.map(m =>
      m.key === key ? { ...m, [field]: value } : m
    ));
  };

  const handleImageChange = (key: number, file: File | null) => {
    if (!file) {
      updateMilestone(key, 'img', null);
      updateMilestone(key, 'preview', undefined);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateMilestone(key, 'preview', reader.result as string);
    };
    reader.readAsDataURL(file);
    updateMilestone(key, 'img', file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !cost || !projectTypeId) {
      toast.error('Please fill all required project fields');
      return;
    }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('cost', cost);
    fd.append('project_type_id', projectTypeId);
    fd.append('status', status);

    if (isEdit) {
      fd.append('_method', 'PUT');
    }

    milestones.forEach((m, index) => {
      if (m.name.trim() && m.due_date) {
        if (m.id) fd.append(`milestones[${index}][id]`, m.id.toString());
        fd.append(`milestones[${index}][name]`, m.name);
        fd.append(`milestones[${index}][description]`, m.description);
        fd.append(`milestones[${index}][due_date]`, m.due_date);
        fd.append(`milestones[${index}][status]`, m.status);
        if (m.completed_date) fd.append(`milestones[${index}][completed_date]`, m.completed_date);
        if (m.img) fd.append(`milestones[${index}][img]`, m.img);
      }
    });

    const url = isEdit ? `/projects/${project!.id}` : '/projects';

    router.post(url, fd, {
      forceFormData: true,
      onSuccess: () => {
        toast.success(isEdit ? 'Project updated!' : 'Project created!');
      },
      onError: (errors) => {
        console.error(errors);
        toast.error('Please fix the errors');
      },
    });
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: isEdit ? 'Edit Project' : 'Create Project', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Project' : 'Create Project'} />

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEdit ? 'Edit Project' : 'Create New Project'}
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Project Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/50 p-6 rounded-lg">
                <div className="space-y-2">
                  <Label>Project Name <span className="text-red-500">*</span></Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Cost <span className="text-red-500">*</span></Label>
                  <Input type="number" value={cost} onChange={e => setCost(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Project Type <span className="text-red-500">*</span></Label>
                  <Select value={projectTypeId} onValueChange={setProjectTypeId}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {projectTypesArray.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={v => setStatus(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Milestones</h3>
                  <Button type="button" onClick={addMilestone} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Milestone
                  </Button>
                </div>

                {milestones.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                    No milestones yet. Click "Add Milestone" to start.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {milestones.map((m) => (
                      <Card key={m.key} className="p-6 border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                          <div className="space-y-2">
                            <Label>Milestone Name <span className="text-red-500">*</span></Label>
                            <Input
                              value={m.name}
                              onChange={e => updateMilestone(m.key, 'name', e.target.value)}
                              placeholder="e.g. Site Survey"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={m.description}
                              onChange={e => updateMilestone(m.key, 'description', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Due Date <span className="text-red-500">*</span></Label>
                            <Input
                              type="date"
                              value={m.due_date}
                              onChange={e => updateMilestone(m.key, 'due_date', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={m.status} onValueChange={v => updateMilestone(m.key, 'status', v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="inprogress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Completed Date</Label>
                            <Input
                              type="date"
                              value={m.completed_date || ''}
                              onChange={e => updateMilestone(m.key, 'completed_date', e.target.value || null)}
                              disabled={m.status !== 'completed'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Proof Image</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageChange(m.key, e.target.files?.[0] || null)}
                            />
                            {(m.preview || m.existingImg) && (
                                 <ImagePreview dataImg={m.preview || `${m.existingImg}`} />
                             
                              
                            )}
                          </div>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeMilestone(m.key)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-8 border-t">
                <Button type="button" variant="secondary" asChild>
                  <a href="/projects">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </a>
                </Button>
                <Button type="submit" size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}