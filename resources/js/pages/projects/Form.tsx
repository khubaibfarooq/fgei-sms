// resources/js/pages/projects/form.tsx
import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
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
  due_date?: string;                      // Kept for backward compat if any, but adding days
  days: string;
  status: string;
  completed_date: string;
  img: File | null;
  pdf: File | null;                     // Added PDF field
  preview?: string;                     // Data URL preview
  existingImg?: string;
  existingPdf?: string;                 // Added PDF path
}

interface ProjectFormProps {
  project?: {
    id?: number;
    name: string;
    estimated_cost: number;
    actual_cost: number | null;
    pdf: string | null;
    final_comments: string | null;
    project_type_id: number | null;
    description: string | null;
    priority: string | null;
    status: string | null;
    approval_status: string | null;
    milestones?: Array<{
      id: number;
      name: string;
      description: string | null;
      due_date?: string;
      days: number | null;
      img: string | null;
      pdf: string | null;
      status?: string;
      completed_date?: string;
    }>;
  };
  projectTypes: Record<string, string>;
}

export default function ProjectForm({ project, projectTypes }: ProjectFormProps) {
  const isEdit = !!project?.id;

  const [name, setName] = useState(project?.name || '');
  const [estimatedCost, setEstimatedCost] = useState(project?.estimated_cost?.toString() || '');
  const [actualCost, setActualCost] = useState(project?.actual_cost?.toString() || '');
  const [approvalStatus, setApprovalStatus] = useState(project?.approval_status || '');
  const [status, setStatus] = useState(project?.status || '');

  const [finalComments, setFinalComments] = useState(project?.final_comments || '');
  const [projectTypeId, setProjectTypeId] = useState((project?.project_type_id || '').toString());
  const [description, setDescription] = useState(project?.description || '');
  const [priority, setPriority] = useState(project?.priority || 'Medium');
  const [projectPdf, setProjectPdf] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState(project?.pdf || null);


  const [milestones, setMilestones] = useState<MilestoneRow[]>(
    project?.milestones?.map((m) => ({
      key: Date.now() + m.id,
      id: m.id,
      name: m.name,
      description: m.description || '',
      days: (m.days || '').toString(),
      img: null,
      pdf: null,
      existingImg: m.img || undefined,
      existingPdf: m.pdf || undefined,
      preview: m.img ? `${m.img}` : undefined,
      status: m.status || 'pending',
      completed_date: m.completed_date ? m.completed_date.split('T')[0] : '',
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
      days: '',
      img: null,
      pdf: null,
      status: 'pending',
      completed_date: '',
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

    if (!name.trim() || !estimatedCost || !projectTypeId) {

      toast.error('Please fill all required project fields');
      return;
    }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('estimated_cost', estimatedCost);
    fd.append('actual_cost', actualCost);

    fd.append('final_comments', finalComments);
    fd.append('project_type_id', projectTypeId);
    fd.append('description', description);
    fd.append('priority', priority);
    if (projectPdf) {
      fd.append('pdf', projectPdf);
    }

    if (isEdit) {
      fd.append('_method', 'PUT');
    }

    milestones.forEach((m, index) => {
      if (m.name.trim() && m.days) {
        if (m.id) fd.append(`milestones[${index}][id]`, m.id.toString());
        fd.append(`milestones[${index}][name]`, m.name);
        fd.append(`milestones[${index}][description]`, m.description);
        fd.append(`milestones[${index}][days]`, m.days);
        fd.append(`milestones[${index}][status]`, m.status);
        if (m.status === 'completed' && m.completed_date) {
          fd.append(`milestones[${index}][completed_date]`, m.completed_date);
        }
        if (m.img) fd.append(`milestones[${index}][img]`, m.img);
        if (m.pdf) fd.append(`milestones[${index}][pdf]`, m.pdf);
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

      <div className="p-4 md:p-6 w-full mx-auto">
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
                  <Label>Estimated Cost <span className="text-red-500">*</span></Label>
                  <Input type="number" disabled={isEdit} value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} required />
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
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Project PDF Document</Label>
                  {
                    (approvalStatus !== 'approved' || !existingPdf) && (

                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={e => setProjectPdf(e.target.files?.[0] || null)}
                      />

                    )
                  }

                  {existingPdf && !projectPdf && (
                    <a
                      href={`/assets/${existingPdf}`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Current PDF
                    </a>
                  )}
                  {projectPdf && (
                    <p className="text-sm text-green-600">New PDF selected: {projectPdf.name}</p>
                  )}
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
                    {milestones.map((m, index) => (
                      <Card key={m.key} className="p-6 border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">

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
                            <Label>Due (Days) <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              value={m.days}
                              onChange={e => updateMilestone(m.key, 'days', e.target.value)}
                              placeholder="e.g. 30"
                            />
                          </div>

                          {isEdit && (
                            <>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                  value={m.status}
                                  onChange={e => updateMilestone(m.key, 'status', e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="inprogress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>

                              {m.status === 'completed' && (
                                <div className="space-y-2">
                                  <Label>Completed Date</Label>
                                  <Input
                                    type="date"
                                    value={m.completed_date}
                                    onChange={e => updateMilestone(m.key, 'completed_date', e.target.value)}
                                  />
                                </div>
                              )}
                            </>
                          )}
                          {isEdit && (
                            <>
                              {(m.status !== 'completed' || !m.existingPdf) && (
                                <div className="space-y-2">
                                  <Label>Proof Image</Label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleImageChange(m.key, e.target.files?.[0] || null)}
                                  />
                                  {m.existingImg && !m.preview && (
                                    <p className="text-xs text-muted-foreground mt-1">Has existing image</p>
                                  )}
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label>Signed Document (PDF)</Label>
                                {(m.status !== 'completed' || !m.existingPdf) && (
                                  <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => updateMilestone(m.key, 'pdf', e.target.files?.[0] || null)}
                                  />
                                )}
                                {m.existingPdf && (
                                  <a href={`/${m.existingPdf}`} target="_blank" className="text-xs text-blue-500 underline mt-1 block">
                                    View PDF
                                  </a>
                                )}
                              </div>

                              <div className="flex items-end justify-between">
                                <div className="h-10 w-10 overflow-hidden rounded bg-muted border flex items-center justify-center">
                                  {(m.preview || m.existingImg) ? (
                                    <img
                                      src={m.preview || `/${m.existingImg}`}
                                      alt="Preview"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">No image</span>
                                  )}
                                </div>
                                {m.status !== 'completed' && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeMilestone(m.key)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>)}
                              </div>
                            </>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-8 border-t">
                <Button type="button" variant="secondary" asChild>
                  <Link href="/projects">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Link>
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