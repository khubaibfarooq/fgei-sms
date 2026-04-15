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
import { Save, ArrowLeft, Plus, Trash2, Building2, DoorOpen, Package, ChevronDown, ChevronUp } from 'lucide-react';
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

// ---- Effects interfaces ----
interface EffectRoomAsset {
  key: number;
  asset_id: string;
  qty: string;
  details: string;
}

interface EffectRoomRow {
  key: number;
  name: string;
  room_type_id: string;
  area: string;
  assets?: EffectRoomAsset[];
}

interface EffectRow {
  key: number;
  id?: number;           // DB effect id (for edit)
  effect_type: 'block' | 'room' | 'asset';
  collapsed?: boolean;
  // Block fields
  block_name?: string;
  block_type_id?: string;
  block_area?: string;
  nested_rooms?: EffectRoomRow[];
  // Room-in-existing-block fields
  room_name?: string;
  room_type_id?: string;
  room_area?: string;
  room_block_id?: string;
  room_assets?: EffectRoomAsset[];
  // Asset-in-room fields
  asset_id?: string;
  asset_qty?: string;
  asset_room_id?: string;
  asset_details?: string;
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
    effects?: Array<{
      id: number;
      effect_type: string;
      effect_data: Record<string, any>;
      applied: boolean;
    }>;
  };
  projectTypes: Record<string, string>;
  contractors: Contractor[];
  companies: Array<{ id: number; name: string }>;
  hasApprovals?: boolean;
  fundHeads: Array<{ id: number; name: string }>;
  // Effects lookup data
  blockTypes: Record<string, string>;
  roomTypes: Record<string, string>;
  allAssets: Array<{ id: number; name: string }>;
  existingBlocks: Array<{ id: number; name: string }>;
  existingRooms: Array<{ id: number; name: string; block_id: number; block?: { id: number; name: string } }>;
}

export default function ProjectForm({ project, projectTypes, contractors: initialContractors, companies: propsCompanies, hasApprovals, fundHeads, blockTypes, roomTypes, allAssets, existingBlocks, existingRooms }: ProjectFormProps) {
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

  // ---- Effects state ----
  const blockTypesArray = Object.entries(blockTypes ?? {}).map(([id, name]) => ({ id, name }));
  const roomTypesArray = Object.entries(roomTypes ?? {}).map(([id, name]) => ({ id, name }));

  const hydrateExistingEffects = (): EffectRow[] => {
    return (project?.effects ?? []).map((e) => {
      const d = e.effect_data ?? {};
      const base: EffectRow = { key: Date.now() + e.id, id: e.id, effect_type: e.effect_type as any };
      if (e.effect_type === 'block') {
        return {
          ...base,
          block_name: d.name ?? '',
          block_type_id: d.block_type_id?.toString() ?? '',
          block_area: d.area?.toString() ?? '',
          nested_rooms: (d.rooms ?? []).map((r: any, i: number) => ({
            key: Date.now() + i,
            name: r.name ?? '',
            room_type_id: r.room_type_id?.toString() ?? '',
            area: r.area?.toString() ?? '',
            assets: (r.assets ?? []).map((a: any, j: number) => ({
              key: Date.now() + i * 1000 + j,
              asset_id: a.asset_id?.toString() ?? '',
              qty: a.qty?.toString() ?? '',
              details: a.details ?? '',
            }))
          })),
        };
      }
      if (e.effect_type === 'room') {
        return {
          ...base,
          room_name: d.name ?? '',
          room_type_id: d.room_type_id?.toString() ?? '',
          room_area: d.area?.toString() ?? '',
          room_block_id: d.block_id?.toString() ?? '',
          room_assets: (d.assets ?? []).map((a: any, i: number) => ({
            key: Date.now() + i,
            asset_id: a.asset_id?.toString() ?? '',
            qty: a.qty?.toString() ?? '',
            details: a.details ?? '',
          })),
        };
      }
      // asset
      return {
        ...base,
        asset_id: d.asset_id?.toString() ?? '',
        asset_qty: d.qty?.toString() ?? '',
        asset_room_id: d.room_id?.toString() ?? '',
        asset_details: d.details ?? '',
      };
    });
  };

  const [effects, setEffects] = useState<EffectRow[]>(hydrateExistingEffects);

  const addEffect = (type: 'block' | 'room' | 'asset') => {
    const base: EffectRow = { key: Date.now(), effect_type: type };
    if (type === 'block') {
      setEffects(prev => [...prev, { ...base, block_name: '', block_type_id: '', block_area: '', nested_rooms: [] }]);
    } else if (type === 'room') {
      setEffects(prev => [...prev, { ...base, room_name: '', room_type_id: '', room_area: '', room_block_id: '', room_assets: [] }]);
    } else {
      setEffects(prev => [...prev, { ...base, asset_id: '', asset_qty: '', asset_room_id: '', asset_details: '' }]);
    }
  };

  const removeEffect = (key: number) => {
    setEffects(prev => prev.filter(e => e.key !== key));
    toast.success('Effect removed');
  };

  const updateEffect = (key: number, patch: Partial<EffectRow>) => {
    setEffects(prev => prev.map(e => e.key === key ? { ...e, ...patch } : e));
  };

  const toggleEffectCollapse = (key: number) => {
    setEffects(prev => prev.map(e => e.key === key ? { ...e, collapsed: !e.collapsed } : e));
  };

  // Nested room helpers for block effects
  const addNestedRoom = (effectKey: number) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? { ...e, nested_rooms: [...(e.nested_rooms ?? []), { key: Date.now(), name: '', room_type_id: '', area: '', assets: [] }] }
        : e
    ));
  };

  const removeNestedRoom = (effectKey: number, roomKey: number) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? { ...e, nested_rooms: (e.nested_rooms ?? []).filter(r => r.key !== roomKey) }
        : e
    ));
  };

  const updateNestedRoom = (effectKey: number, roomKey: number, patch: Partial<EffectRoomRow>) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? { ...e, nested_rooms: (e.nested_rooms ?? []).map(r => r.key === roomKey ? { ...r, ...patch } : r) }
        : e
    ));
  };

  const addNestedRoomAsset = (effectKey: number, roomKey: number) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? {
          ...e,
          nested_rooms: (e.nested_rooms ?? []).map(r =>
            r.key === roomKey
              ? { ...r, assets: [...(r.assets ?? []), { key: Date.now(), asset_id: '', qty: '', details: '' }] }
              : r
          )
        }
        : e
    ));
  };

  const removeNestedRoomAsset = (effectKey: number, roomKey: number, assetKey: number) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? {
          ...e,
          nested_rooms: (e.nested_rooms ?? []).map(r =>
            r.key === roomKey
              ? { ...r, assets: (r.assets ?? []).filter(a => a.key !== assetKey) }
              : r
          )
        }
        : e
    ));
  };

  const updateNestedRoomAsset = (effectKey: number, roomKey: number, assetKey: number, patch: Partial<EffectRoomAsset>) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? {
          ...e,
          nested_rooms: (e.nested_rooms ?? []).map(r =>
            r.key === roomKey
              ? {
                ...r,
                assets: (r.assets ?? []).map(a =>
                  a.key === assetKey ? { ...a, ...patch } : a
                )
              }
              : r
          )
        }
        : e
    ));
  };

  const addRoomEffectAsset = (effectKey: number) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? { ...e, room_assets: [...(e.room_assets ?? []), { key: Date.now(), asset_id: '', qty: '', details: '' }] }
        : e
    ));
  };

  const removeRoomEffectAsset = (effectKey: number, assetKey: number) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? { ...e, room_assets: (e.room_assets ?? []).filter(a => a.key !== assetKey) }
        : e
    ));
  };

  const updateRoomEffectAsset = (effectKey: number, assetKey: number, patch: Partial<EffectRoomAsset>) => {
    setEffects(prev => prev.map(e =>
      e.key === effectKey
        ? { ...e, room_assets: (e.room_assets ?? []).map(a => a.key === assetKey ? { ...a, ...patch } : a) }
        : e
    ));
  };


  // Serialise one effect into effect_data JSON string
  const serializeEffect = (e: EffectRow): string => {
    if (e.effect_type === 'block') {
      return JSON.stringify({
        name: e.block_name,
        block_type_id: e.block_type_id,
        area: e.block_area,
        rooms: (e.nested_rooms ?? []).map(r => ({
          name: r.name,
          room_type_id: r.room_type_id,
          area: r.area,
          assets: (r.assets ?? []).map(a => ({ asset_id: a.asset_id, qty: a.qty, details: a.details }))
        })),
      });
    }
    if (e.effect_type === 'room') {
      return JSON.stringify({
        name: e.room_name,
        room_type_id: e.room_type_id,
        area: e.room_area,
        block_id: e.room_block_id,
        assets: (e.room_assets ?? []).map(a => ({ asset_id: a.asset_id, qty: a.qty, details: a.details }))
      });
    }
    // asset
    return JSON.stringify({ asset_id: e.asset_id, qty: e.asset_qty, room_id: e.asset_room_id, details: e.asset_details });
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

    // Append effects
    effects.forEach((e, index) => {
      fd.append(`effects[${index}][effect_type]`, e.effect_type);
      fd.append(`effects[${index}][effect_data]`, serializeEffect(e));
      if (e.id) fd.append(`effects[${index}][id]`, e.id.toString());
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
                    {isEdit && project?.status === 'completed' && (
                      <p className="text-sm text-green-600">Project is completed</p>
                    )}
                    <Select value={projectStatusMode} disabled={isEdit && project?.status === 'completed'} onValueChange={(val) => setProjectStatusMode(val as 'initiate' | 'planned' | 'completed')}>
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
              {projectStatusMode === 'completed' && !isEdit && (
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

              {/* ============================================================
                  Completion Effects Section
                  ============================================================ */}
              {project?.status !== 'completed' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Completion Effects</h3>
                      <p className="text-xs text-muted-foreground">These blocks, rooms, or assets will be automatically created when this project is completed.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => addEffect('block')} title="Add new block (with optional rooms)">
                        <Building2 className="w-3.5 h-3.5 mr-1" /> New Block
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => addEffect('room')} title="Add room in an existing block">
                        <DoorOpen className="w-3.5 h-3.5 mr-1" /> New Room
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => addEffect('asset')} title="Add assets to an existing room">
                        <Package className="w-3.5 h-3.5 mr-1" /> New Assets
                      </Button>
                    </div>
                  </div>

                  {effects.length === 0 ? (
                    <div className="text-center py-5 text-muted-foreground border-2 border-dashed rounded-lg text-sm">
                      No effects defined. Click "New Block", "New Room", or "New Assets" to add one.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {effects.map((effect) => (
                        <Card key={effect.key} className={`border-l-4 ${effect.effect_type === 'block' ? 'border-l-blue-500'
                          : effect.effect_type === 'room' ? 'border-l-green-500'
                            : 'border-l-orange-500'
                          }`}>
                          {/* Card Header */}
                          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              {effect.effect_type === 'block' && <Building2 className="w-4 h-4 text-blue-500" />}
                              {effect.effect_type === 'room' && <DoorOpen className="w-4 h-4 text-green-500" />}
                              {effect.effect_type === 'asset' && <Package className="w-4 h-4 text-orange-500" />}
                              <span className="text-sm font-medium capitalize">
                                {effect.effect_type === 'block' ? 'New Block (with rooms)'
                                  : effect.effect_type === 'room' ? 'New Room in Existing Block'
                                    : 'New Assets in Existing Room'}
                              </span>
                              {effect.id && (
                                <span className="text-xs text-muted-foreground">(saved)</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => toggleEffectCollapse(effect.key)}>
                                {effect.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </Button>
                              <Button type="button" variant="ghost" size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeEffect(effect.key)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!effect.collapsed && (
                            <CardContent className="pt-3 pb-3">

                              {/* ---- BLOCK effect ---- */}
                              {effect.effect_type === 'block' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label>Block Name <span className="text-red-500">*</span></Label>
                                      <Input
                                        value={effect.block_name ?? ''}
                                        onChange={e => updateEffect(effect.key, { block_name: e.target.value })}
                                        placeholder="e.g. Science Block"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Block Type <span className="text-red-500">*</span></Label>
                                      <Select
                                        value={effect.block_type_id ?? ''}
                                        onValueChange={v => updateEffect(effect.key, { block_type_id: v })}
                                      >
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                          {blockTypesArray.map(bt => (
                                            <SelectItem key={bt.id} value={bt.id}>{bt.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Area (sqft)</Label>
                                      <Input
                                        type="number"
                                        value={effect.block_area ?? ''}
                                        onChange={e => updateEffect(effect.key, { block_area: e.target.value })}
                                        placeholder="e.g. 5000"
                                      />
                                    </div>
                                  </div>

                                  {/* Nested rooms for this block */}
                                  <div className="pl-3 border-l-2 border-muted space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rooms in this block</span>
                                      <Button type="button" size="sm" variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => addNestedRoom(effect.key)}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Room
                                      </Button>
                                    </div>
                                    {(effect.nested_rooms ?? []).length === 0 && (
                                      <p className="text-xs text-muted-foreground italic">No rooms defined. Block will be created empty.</p>
                                    )}
                                    {(effect.nested_rooms ?? []).map((nr) => (
                                      <div key={nr.key} className="space-y-2 p-2 border rounded-md">
                                        <div className="grid grid-cols-[1fr_1fr_6rem_2rem] gap-2 items-end">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Room Name</Label>
                                            <Input
                                              className="h-8 text-sm"
                                              value={nr.name}
                                              onChange={e => updateNestedRoom(effect.key, nr.key, { name: e.target.value })}
                                              placeholder="e.g. Lab 1"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Room Type</Label>
                                            <Select
                                              value={nr.room_type_id}
                                              onValueChange={v => updateNestedRoom(effect.key, nr.key, { room_type_id: v })}
                                            >
                                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                              <SelectContent>
                                                {roomTypesArray.map(rt => (
                                                  <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Area</Label>
                                            <Input
                                              className="h-8 text-sm"
                                              type="number"
                                              value={nr.area}
                                              onChange={e => updateNestedRoom(effect.key, nr.key, { area: e.target.value })}
                                              placeholder="sqft"
                                            />
                                          </div>
                                          <Button type="button" variant="ghost" size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive self-end"
                                            onClick={() => removeNestedRoom(effect.key, nr.key)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>

                                        {/* Assets for this room */}
                                        <div className="pl-3 border-l-[1px] border-dashed border-gray-300 ml-1 space-y-2 pb-1">
                                          <div className="flex justify-between items-center bg-gray-50/50 p-1 rounded-sm">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Assets in this room</span>
                                            <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => addNestedRoomAsset(effect.key, nr.key)}>
                                              <Plus className="w-3 h-3 mr-1" /> Add Asset
                                            </Button>
                                          </div>
                                          {(nr.assets ?? []).map((ast) => (
                                            <div key={ast.key} className="grid grid-cols-[1fr_4rem_1fr_2rem] gap-2 items-end pl-1">
                                              <div className="space-y-1">
                                                <Select value={ast.asset_id} onValueChange={v => updateNestedRoomAsset(effect.key, nr.key, ast.key, { asset_id: v })}>
                                                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Asset" /></SelectTrigger>
                                                  <SelectContent>
                                                    {(allAssets ?? []).map(a => (
                                                      <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="space-y-1">
                                                <Input className="h-7 text-xs" type="number" placeholder="Qty" value={ast.qty} onChange={e => updateNestedRoomAsset(effect.key, nr.key, ast.key, { qty: e.target.value })} />
                                              </div>
                                              <div className="space-y-1">
                                                <Input className="h-7 text-xs" type="text" placeholder="Details" value={ast.details} onChange={e => updateNestedRoomAsset(effect.key, nr.key, ast.key, { details: e.target.value })} />
                                              </div>
                                              <Button type="button" variant="ghost" size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive self-end"
                                                onClick={() => removeNestedRoomAsset(effect.key, nr.key, ast.key)}>
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ---- ROOM effect (in existing block) ---- */}
                              {effect.effect_type === 'room' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <Label>Room Name <span className="text-red-500">*</span></Label>
                                      <Input
                                        value={effect.room_name ?? ''}
                                        onChange={e => updateEffect(effect.key, { room_name: e.target.value })}
                                        placeholder="e.g. Computer Lab"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Room Type <span className="text-red-500">*</span></Label>
                                      <Select
                                        value={effect.room_type_id ?? ''}
                                        onValueChange={v => updateEffect(effect.key, { room_type_id: v })}
                                      >
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                          {roomTypesArray.map(rt => (
                                            <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Existing Block <span className="text-red-500">*</span></Label>
                                      <Select
                                        value={effect.room_block_id ?? ''}
                                        onValueChange={v => updateEffect(effect.key, { room_block_id: v })}
                                      >
                                        <SelectTrigger><SelectValue placeholder="Select block" /></SelectTrigger>
                                        <SelectContent>
                                          {existingBlocks.map(b => (
                                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Area (sqft)</Label>
                                      <Input
                                        type="number"
                                        value={effect.room_area ?? ''}
                                        onChange={e => updateEffect(effect.key, { room_area: e.target.value })}
                                        placeholder="e.g. 400"
                                      />
                                    </div>
                                  </div>

                                  {/* Assets for this room */}
                                  <div className="pl-3 border-l-[1px] border-dashed border-gray-300 ml-1 space-y-2 pb-1">
                                    <div className="flex justify-between items-center bg-gray-50/50 p-1 rounded-sm">
                                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Assets in this room</span>
                                      <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => addRoomEffectAsset(effect.key)}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Asset
                                      </Button>
                                    </div>
                                    {(effect.room_assets ?? []).map((ast) => (
                                      <div key={ast.key} className="grid grid-cols-[1fr_4rem_1fr_2rem] gap-2 items-end pl-1">
                                        <div className="space-y-1">
                                          <Select value={ast.asset_id} onValueChange={v => updateRoomEffectAsset(effect.key, ast.key, { asset_id: v })}>
                                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Asset" /></SelectTrigger>
                                            <SelectContent>
                                              {(allAssets ?? []).map(a => (
                                                <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Input className="h-7 text-xs" type="number" placeholder="Qty" value={ast.qty} onChange={e => updateRoomEffectAsset(effect.key, ast.key, { qty: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                          <Input className="h-7 text-xs" type="text" placeholder="Details" value={ast.details} onChange={e => updateRoomEffectAsset(effect.key, ast.key, { details: e.target.value })} />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon"
                                          className="h-7 w-7 text-destructive hover:text-destructive self-end"
                                          onClick={() => removeRoomEffectAsset(effect.key, ast.key)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ---- ASSET effect (in existing room) ---- */}
                              {effect.effect_type === 'asset' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <Label>Asset <span className="text-red-500">*</span></Label>
                                    <Select
                                      value={effect.asset_id ?? ''}
                                      onValueChange={v => updateEffect(effect.key, { asset_id: v })}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                                      <SelectContent>
                                        {(allAssets ?? []).map(a => (
                                          <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Quantity <span className="text-red-500">*</span></Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={effect.asset_qty ?? ''}
                                      onChange={e => updateEffect(effect.key, { asset_qty: e.target.value })}
                                      placeholder="e.g. 20"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Existing Room <span className="text-red-500">*</span></Label>
                                    <Select
                                      value={effect.asset_room_id ?? ''}
                                      onValueChange={v => updateEffect(effect.key, { asset_room_id: v })}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                                      <SelectContent>
                                        {(existingRooms ?? []).map(r => (
                                          <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.block?.name ?? 'Block'})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Details</Label>
                                    <Input
                                      value={effect.asset_details ?? ''}
                                      onChange={e => updateEffect(effect.key, { asset_details: e.target.value })}
                                      placeholder="e.g. New desks"
                                    />
                                  </div>
                                </div>
                              )}

                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

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