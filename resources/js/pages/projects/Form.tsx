// resources/js/pages/projects/form.tsx
import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { AmountInput } from '@/components/ui/amount-input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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

interface FundHeadRow {
  key: number;
  fund_head_id: string;
  sanction_amount: string;
}

interface Contractor {
  id: number;
  name: string;
}

interface ProjectFormProps {
  project?: {
    id?: number;
    name: string;
    estimated_cost: number;
    actual_cost: number | null;
    pdf: string | null;
    structural_plan: string | null;
    final_comments: string | null;
    project_type_id: number | null;
    description: string | null;
    priority: string | null;
    status: string | null;
    approval_status: string | null;
    fund_head_id: number | null;
    contractor_id: number | null;
    commence_date?: string | null;
    est_completion_date?: string | null;
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
  contractors: Contractor[];
  companies: Array<{ id: number; name: string }>;
  hasApprovals?: boolean;
  fundHeads: Array<{ id: number; name: string }>;
}

export default function ProjectForm({ project, projectTypes, contractors: initialContractors, companies: propsCompanies, hasApprovals, fundHeads }: ProjectFormProps) {
  const isEdit = !!project?.id;

  const [name, setName] = useState(project?.name || '');
  const [estimatedCost, setEstimatedCost] = useState(project?.estimated_cost?.toString() || '');
  const [actualCost, setActualCost] = useState(project?.actual_cost?.toString() || '');
  const [approvalStatus, setApprovalStatus] = useState(project?.approval_status || '');
  const [status, setStatus] = useState(project?.status || '');
  // 'initiate' | 'planned' | 'completed' | ''
  const deriveMode = () => {
    if (project?.status === 'planned') return 'planned';
    if (project?.status === 'completed') return 'completed';
    if (project?.status === 'waiting') return 'initiate';
    return '';
  };
  const [projectStatusMode, setProjectStatusMode] = useState<'initiate' | 'planned' | 'completed' | ''>(deriveMode);

  const [finalComments, setFinalComments] = useState(project?.final_comments || '');
  const [projectTypeId, setProjectTypeId] = useState((project?.project_type_id || '').toString());
  const [description, setDescription] = useState(project?.description || '');
  const [priority, setPriority] = useState(project?.priority || 'Medium');
  const [projectPdf, setProjectPdf] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState(project?.pdf || null);

  const [contractorId, setContractorId] = useState(project?.contractor_id?.toString() || '');
  const [structuralPlan, setStructuralPlan] = useState<File | null>(null);
  const [existingPlan, setExistingPlan] = useState(project?.structural_plan || null);

  const [commenceDate, setCommenceDate] = useState(project?.commence_date || '');
  const [estCompletionDate, setEstCompletionDate] = useState(project?.est_completion_date || '');
  const showDateFields = projectStatusMode === 'completed' || (isEdit && (!project?.commence_date || !project?.est_completion_date));


  // Quick Add Contractor State
  const [contractors, setContractors] = useState<Contractor[]>(initialContractors);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [newContractor, setNewContractor] = useState({
    company_id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
  });
  const [creatingContractor, setCreatingContractor] = useState(false);

  // Quick Add Company State
  const [companies, setCompanies] = useState(initialContractors.length >= 0 ? propsCompanies : []); // Need to fix destructuring to rename companies prop to propsCompanies
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    contact: '',
    address: '',
  });
  const [creatingCompany, setCreatingCompany] = useState(false);


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

  // Fund head rows for "completed" project creation
  const [fundHeadRows, setFundHeadRows] = useState<FundHeadRow[]>([{ key: Date.now(), fund_head_id: '', sanction_amount: '' }]);

  const addFundHeadRow = () => setFundHeadRows(prev => [...prev, { key: Date.now(), fund_head_id: '', sanction_amount: '' }]);
  const removeFundHeadRow = (key: number) => setFundHeadRows(prev => prev.filter(r => r.key !== key));
  const updateFundHeadRow = (key: number, field: keyof FundHeadRow, value: string) =>
    setFundHeadRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));

  const usedFundHeadIds = new Set(fundHeadRows.map(r => r.fund_head_id).filter(Boolean));
  const fundHeadTotal = fundHeadRows.reduce((sum, r) => sum + (parseFloat(r.sanction_amount) || 0), 0);

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

  const handleAddContractor = async () => {
    if (!newContractor.name || !newContractor.company_id) {
      toast.error("Name and Company are required");
      return;
    }

    setCreatingContractor(true);
    try {
      const res = await axios.post('/contractor', newContractor);
      // Assuming the response returns the created contractor or we can construct it
      // Ideally the backend should return the created object.
      // If the backend returns a redirect, we might need to adjust.
      // But for resource controllers typically store returns redirect.
      // We might want to check if request expects json in controller, or just assume we reload list.
      // For now let's hope we can get the ID. If not, we might need to fetch all again.

      // Actually simpler: let's fetch all contractors again to be safe and get the new ID
      const contractorsRes = await axios.get(route('contractor.index'), {
        params: { json: true } // We might need to adjust endpoint to return JSON list if not standard
      }).catch(() => null);

      // Alternative since we can't easily change backend return type of store without affecting other flows:
      // We will optimistically add if we had the ID, but we don't.
      // Let's rely on standard Inertia reload? No, we want partial.

      // Let's TRY to just manually add it if we can't get it back.
      // But wait, the previous tool confirmed standard resource controller.

      // Best bet: Fetch all contractors after add.
      // Or better: Update the store method to return JSON if wantsJson().
      // For now, let's assume we can fetch the updated list or just add it to state if we don't care about ID (but we do).

      // Standard Laravel Inertia Store returns redirect. 
      // We can make a specific endpoint or just accept that we might need to reload.
      // Let's try to just use valid data and push to list with a fake ID if needed? No must be real DB ID.

      // Real solution:
      // We will fetch all contractors again.
      // NOTE: This assumes there is an API endpoint or we can use Inertia to reload just that prop?
      // router.reload({ only: ['contractors'] }) would work!

      // Use Inertia reload
      router.reload({
        only: ['contractors'],
        onSuccess: (page) => {
          // The props will be updated automatically
          // But we need to select the new one.
          // We'll need to find the one with the name we just added?
          // Or just let user select it.
          toast.success("Contractor added");
          setIsContractorModalOpen(false);
          setNewContractor({
            company_id: '',
            name: '',
            email: '',
            phone: '',
            address: '',
            specialization: '',
          });
          // We can't easily auto-select without knowing the new ID.
          // Unless we sort by ID desc.
        }
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to add contractor");
    } finally {
      setCreatingContractor(false);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.name) {
      toast.error("Company Name is required");
      return;
    }

    setCreatingCompany(true);
    try {
      await axios.post('/company', newCompany);

      // Refresh companies list
      router.reload({
        only: ['companies'],
        onSuccess: () => {
          toast.success("Company added");
          setIsCompanyModalOpen(false);
          setNewCompany({
            name: '',
            email: '',
            contact: '',
            address: '',
          });
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add company");
    } finally {
      setCreatingCompany(false);
    }
  };

  // Custom helper to manualy refresh contractors if router.reload is tricky within the same component state context for 'contractors' variable 
  // actually 'contractors' prop will update, but our local state 'contractors' initialized from props won't automatically sync unless we use useEffect.
  // Re-sync local state when prop changes
  React.useEffect(() => {
    setContractors(initialContractors);
  }, [initialContractors]);

  React.useEffect(() => {
    setCompanies(propsCompanies);
  }, [propsCompanies]);

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
    if (contractorId) {
      fd.append('contractor_id', contractorId);
    }
    if (projectPdf) {
      fd.append('pdf', projectPdf);
    }
    if (structuralPlan) {
      fd.append('structural_plan', structuralPlan);
    }
    if (showDateFields && commenceDate) {
      fd.append('commence_date', commenceDate);
    }
    if (showDateFields && estCompletionDate) {
      fd.append('est_completion_date', estCompletionDate);
    }

    // Send status/approval_status based on projectStatusMode dropdown
    if (projectStatusMode === 'initiate') {
      fd.append('status', 'waiting');
      fd.append('approval_status', 'inprogress');
    } else if (projectStatusMode === 'planned') {
      fd.append('status', 'planned');
      fd.append('approval_status', 'waiting');
    } else if (projectStatusMode === 'completed') {
      fd.append('status', 'completed');
      fd.append('approval_status', 'approved');
    } else if (isEdit && project?.status === 'planned') {
      // fallback: if no mode chosen on edit and was planned, keep planned
      fd.append('status', 'planned');
    }

    if (isEdit) {
      fd.append('_method', 'PUT');
    }

    // Append fund_heads for completed projects
    if (projectStatusMode === 'completed') {
      fundHeadRows
        .filter(r => r.fund_head_id && r.sanction_amount)
        .forEach((r, index) => {
          fd.append(`fund_heads[${index}][fund_head_id]`, r.fund_head_id);
          fd.append(`fund_heads[${index}][sanction_amount]`, r.sanction_amount);
        });
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

      <div className="p-2 md:p-4 w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {isEdit ? 'Edit Project' : 'Create New Project'}
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Project Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/50 p-4 rounded-lg">
                <div className="space-y-1">
                  <Label>Project Name <span className="text-red-500">*</span></Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Estimated Cost <span className="text-red-500">*</span></Label>
                  <AmountInput
                    value={estimatedCost}
                    onChange={(v) => setEstimatedCost(String(v))}
                    disabled={isEdit}
                    required
                    placeholder="Enter estimated cost"
                  />
                </div>

                {projectStatusMode === 'completed' && (
                  <div className="space-y-1">
                    <Label>Actual Cost <span className="text-red-500">*</span></Label>
                    <AmountInput
                      value={actualCost}
                      onChange={(v) => setActualCost(String(v))}
                      min={0}
                      placeholder="Enter actual cost"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
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

                <div className="space-y-1">
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
                <div className="space-y-1">
                  <Label>Contractor</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={contractorId} onValueChange={setContractorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contractor" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractors.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsContractorModalOpen(true)} title="Add New Contractor">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showDateFields && (
                  <>
                    <div className="space-y-1">
                      <Label>Commence Date</Label>
                      <Input
                        type="date"
                        value={commenceDate}
                        onChange={e => setCommenceDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Est. Completion Date</Label>
                      <Input
                        type="date"
                        value={estCompletionDate}
                        onChange={e => setEstCompletionDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1 md:col-span-2">
                  <Label>Description</Label>
                  <div className="bg-white rounded-md">
                    <ReactQuill
                      theme="snow"
                      value={description}
                      onChange={setDescription}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          [{ color: [] }, { background: [] }],
                          ['clean'],
                        ],
                      }}
                    />
                  </div>
                </div>


                <div className="space-y-1">
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
                <div className="space-y-1">
                  <Label>Structural Plan (PDF)</Label>
                  {
                    (approvalStatus !== 'approved' || !existingPlan) && (
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={e => setStructuralPlan(e.target.files?.[0] || null)}
                      />
                    )
                  }

                  {existingPlan && !structuralPlan && (
                    <a
                      href={`/assets/${existingPlan}`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Current Structural Plan
                    </a>
                  )}
                  {structuralPlan && (
                    <p className="text-sm text-green-600">New Plan selected: {structuralPlan.name}</p>
                  )}
                </div>

                {/* Project Status Dropdown */}
                {(!isEdit || project?.status === 'planned' || project?.status === 'completed' || (project?.status === 'waiting' && !project?.fund_head_id && !hasApprovals)) && (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Project Status <span className="text-red-500">*</span></Label>
                    <Select value={projectStatusMode} onValueChange={(val) => setProjectStatusMode(val as 'initiate' | 'planned' | 'completed')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initiate">Initiate</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {projectStatusMode === 'initiate' && 'Status → Waiting | Approval → In Progress'}
                      {projectStatusMode === 'planned' && 'Status → Planned | Approval → Waiting'}
                      {projectStatusMode === 'completed' && 'Status → Completed | Approval → Approved'}
                    </p>
                  </div>
                )}

                {/* Final Comments — required when Completed */}
                {projectStatusMode === 'completed' && (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Final Comments <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={finalComments}
                      onChange={e => setFinalComments(e.target.value)}
                      placeholder="Enter final comments for the completed project..."
                      rows={3}
                      required
                    />
                  </div>
                )}

              </div>

              {/* Fund Heads — only shown when status is Completed */}
              {projectStatusMode === 'completed' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Fund Heads</h3>
                    <Button type="button" onClick={addFundHeadRow} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" /> Add Fund Head
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/30 divide-y">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_10rem_2.5rem] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span>Fund Head</span>
                      <span>Sanction Amount</span>
                      <span />
                    </div>

                    {fundHeadRows.map((row) => (
                      <div key={row.key} className="grid grid-cols-[1fr_10rem_2.5rem] items-center gap-3 px-4 py-2">
                        <Select
                          value={row.fund_head_id}
                          onValueChange={(val) => updateFundHeadRow(row.key, 'fund_head_id', val)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select fund head" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundHeads.map(fh => (
                              <SelectItem
                                key={fh.id}
                                value={fh.id.toString()}
                                disabled={usedFundHeadIds.has(fh.id.toString()) && row.fund_head_id !== fh.id.toString()}
                              >
                                {fh.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <AmountInput
                          value={row.sanction_amount}
                          onChange={(v) => updateFundHeadRow(row.key, 'sanction_amount', String(v))}
                          min={0}
                          placeholder="Amount"
                          inputClassName="h-9 text-sm"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={fundHeadRows.length === 1}
                          onClick={() => removeFundHeadRow(row.key)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {fundHeadTotal > 0 && (
                    <p className="text-sm text-right font-medium text-muted-foreground">
                      Grand Total: <span className="text-foreground font-bold">Rs. {fundHeadTotal.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Milestones */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Milestones</h3>
                  <Button type="button" onClick={addMilestone} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Milestone
                  </Button>
                </div>

                {milestones.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg text-sm">
                    No milestones yet. Click "Add Milestone" to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((m, index) => (
                      <Card key={m.key} className="p-3 border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

                          <div className="space-y-1">
                            <Label>Milestone Name <span className="text-red-500">*</span></Label>
                            <Input
                              value={m.name}
                              onChange={e => updateMilestone(m.key, 'name', e.target.value)}
                              placeholder="e.g. Site Survey"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>Description</Label>
                            <Input
                              value={m.description}
                              onChange={e => updateMilestone(m.key, 'description', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>Due (Days) <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              value={m.days}
                              onChange={e => updateMilestone(m.key, 'days', e.target.value)}
                              placeholder="e.g. 30"
                            />
                          </div>

                          {/* Status / completed-date fields: shown on edit always, OR on create when projectStatusMode === 'completed' */}
                          {(isEdit || projectStatusMode === 'completed') && (
                            <>
                              <div className="space-y-1">
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
                                <div className="space-y-1">
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
                          {/* Proof image / PDF fields: shown on edit always, OR on create when projectStatusMode === 'completed' */}
                          {(isEdit || projectStatusMode === 'completed') && (
                            <>
                              {(m.status !== 'completed' || !m.existingPdf) && (
                                <div className="space-y-1">
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
                              <div className="space-y-1">
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

              <div className="flex justify-between pt-4 border-t">
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

      {/* Quick Add Contractor Modal */}
      <Dialog open={isContractorModalOpen} onOpenChange={setIsContractorModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Contractor</DialogTitle>
            <DialogDescription>
              Create a new contractor to assign to this project immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={newContractor.company_id}
                    onValueChange={(val) => setNewContractor({ ...newContractor, company_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setIsCompanyModalOpen(true)} title="Add New Company">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contractor Name <span className="text-red-500">*</span></Label>
              <Input
                value={newContractor.name}
                onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                placeholder="Enter contractor name"
              />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input
                value={newContractor.specialization}
                onChange={(e) => setNewContractor({ ...newContractor, specialization: e.target.value })}
                placeholder="e.g. Electrical, Civil"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newContractor.email}
                  onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newContractor.phone}
                  onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={newContractor.address}
                onChange={(e) => setNewContractor({ ...newContractor, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContractorModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddContractor} disabled={creatingContractor}>
              {creatingContractor ? 'Creating...' : 'Create Contractor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Company Modal */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Create a new company to assign to the contractor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company Name <span className="text-red-500">*</span></Label>
              <Input
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newCompany.email}
                onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                value={newCompany.contact}
                onChange={(e) => setNewCompany({ ...newCompany, contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={newCompany.address}
                onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCompany} disabled={creatingCompany}>
              {creatingCompany ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}