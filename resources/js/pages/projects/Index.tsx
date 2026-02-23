import React, { useState, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Building, ClipboardCheck, X, CheckCircle2, XCircle, Clock, Eye, FileText, Camera, Upload } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ApprovalModal from './ApprovalModal';
import { ImagePreview } from '@/components/ui/image-preview2';


interface Project {
  id: number;
  name: string;
  description?: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  pdf: string | null;
  final_comments: string | null;
  status: string;
  approval_status: string;
  priority: string;
  institute_id: number;
  institute: {
    name: string;
  };
  fund_head?: {
    name: string;
  }
  projecttype?: {
    name: string;
  }
  rooms_count?: number;
  current_stage_id?: number;
  current_stage?: {
    stage_name: string;
    level?: string;
    can_change_cost?: boolean;
    is_last?: boolean;
  };
}


interface ApprovalHistory {
  id: number;
  status: string;
  comments: string;
  action_date: string;
  approver: { name: string };
  stage: { stage_name: string };
  pdf: string | null;
  img: string | null;
}

interface Milestone {
  id: number;
  name: string;
  description: string | null;
  days: number;
  status: string;
  completed_date: string | null;
  img: string | null;
  pdf: string | null;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  added_date: string;
  img: string | null;

  description: string | null;
  fund_head?: {
    name: string;
  };
}

interface ProjectImage {
  id: number;
  project_id: number;
  desc: string | null;
  date: string | null;
  image: string;
}

interface Props {
  projects: {
    data: Project[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    status: string;
  };
  permissions: {
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Projects', href: '/projects' },
];

export default function ProjectIndex({ projects, filters, permissions }: Props) {
  const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

  // Show server flash messages (e.g. delete blocked by guard)
  useEffect(() => {
    if (props.flash?.success) toast.success(props.flash.success);
    if (props.flash?.error) toast.error(props.flash.error);
  }, [props.flash]);

  // Side Panel State
  const [selectedPanelProject, setSelectedPanelProject] = useState<Project | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectPayments, setProjectPayments] = useState<Payment[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [loadingPanelData, setLoadingPanelData] = useState(false);

  // Image Upload State
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [imageForm, setImageForm] = useState({ desc: '', date: '', image: null as File | null });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<Project | null>(null);

  // Actual Cost Modal State
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [selectedProjectForCost, setSelectedProjectForCost] = useState<Project | null>(null);
  const [updatingCost, setUpdatingCost] = useState(false);
  const [actualCostForm, setActualCostForm] = useState({
    actual_cost: '',
  });
  const [showCostHigherWarning, setShowCostHigherWarning] = useState(false);

  // Payment Request Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    stage_name: '',
    amount: '',
  });
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Description Modal State
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedDescriptionProject, setSelectedDescriptionProject] = useState<Project | null>(null);

  const canShowInstitutionalApprove = (project: Project) => {
    return project.current_stage?.level?.toLowerCase() === 'institutional' && project.status !== 'completed';
  };


  // Milestone Edit State
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    days: 0,
    status: '',
    completed_date: '',
    img: null as File | null,
    pdf: null as File | null,
  });
  const [savingMilestone, setSavingMilestone] = useState(false);

  const handleMilestoneClick = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      name: milestone.name,
      description: milestone.description || '',
      days: milestone.days || 0,
      status: milestone.status,
      completed_date: milestone.completed_date ? milestone.completed_date.split('T')[0] : '',
      img: null as File | null,
      pdf: null as File | null,
    });
  };

  const handleMilestoneUpdate = async () => {
    if (!editingMilestone) return;
    setSavingMilestone(true);

    const formData = new FormData();
    formData.append('_method', 'PUT'); // Method spoofing for Laravel
    formData.append('name', milestoneForm.name);
    formData.append('days', milestoneForm.days.toString());
    formData.append('status', milestoneForm.status);
    formData.append('description', milestoneForm.description);

    if (milestoneForm.status === 'completed' && milestoneForm.completed_date) {
      formData.append('completed_date', milestoneForm.completed_date);
    } else {
      formData.append('completed_date', '');
    }

    if (milestoneForm.img) {
      formData.append('img', milestoneForm.img);
    }
    if (milestoneForm.pdf) {
      formData.append('pdf', milestoneForm.pdf);
    }

    try {
      await axios.post(`/milestones/${editingMilestone.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Milestone updated successfully");
      setEditingMilestone(null);
      // Refresh milestones
      if (selectedPanelProject) {
        const res = await axios.get(`/projects/${selectedPanelProject.id}/milestones`);
        setProjectMilestones(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update milestone");
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDelete = (id: number) => {
    router.delete(`/projects/${id}`, {
      onSuccess: () => toast.success('Project deleted successfully'),
      onError: () => toast.error('Failed to delete project'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/projects', { ...filters, search }, { preserveScroll: true });
    }
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value); // reset room when block changes
    updateFilters({ search: search, status: value });
  };
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    router.get(
      '/projects',
      { ...filters, ...newFilters },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        only: ['projects', 'filters'],
      }
    );
  };

  // Fetch Panel Data
  useEffect(() => {
    if (selectedPanelProject) {
      setLoadingPanelData(true);
      const fetchDetails = async () => {
        try {
          const [historyRes, milestonesRes, paymentsRes, imagesRes] = await Promise.all([
            axios.get(`/projects/${selectedPanelProject.id}/history`),
            axios.get(`/projects/${selectedPanelProject.id}/milestones`),
            axios.get(`/projects/${selectedPanelProject.id}/payments`),
            axios.get(`/projects/${selectedPanelProject.id}/images`)
          ]);
          setApprovalHistory(historyRes.data);
          setProjectMilestones(milestonesRes.data);
          setProjectPayments(paymentsRes.data.payments);
          setProjectImages(imagesRes.data);
        } catch (error) {
          console.error("Failed to fetch project details", error);
          toast.error("Failed to load project details.");
        } finally {
          setLoadingPanelData(false);
        }
      };
      fetchDetails();
    } else {
      setApprovalHistory([]);
      setProjectMilestones([]);
      setProjectPayments([]);
      setProjectImages([]);
    }
  }, [selectedPanelProject]);

  const handleCostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForCost) return;

    const actualCost = parseFloat(actualCostForm.actual_cost);
    const estimatedCost = selectedProjectForCost.estimated_cost;

    if (actualCost > estimatedCost) {
      setShowCostHigherWarning(true);
      return;
    }

    proceedWithCostUpdate();
  };

  const proceedWithCostUpdate = () => {
    if (!selectedProjectForCost) return;
    setUpdatingCost(true);

    router.post(`/projects/${selectedProjectForCost.id}/update-cost`, actual_cost_form_data(), {
      onSuccess: () => {
        toast.success("Actual cost updated successfully");
        setCostModalOpen(false);
        setShowCostHigherWarning(false);
        setUpdatingCost(false);
      },
      onError: (errors) => {
        toast.error("Failed to update cost");
        setUpdatingCost(false);
      }
    });
  };

  const actual_cost_form_data = () => {
    return {
      actual_cost: actualCostForm.actual_cost,
    };
  };

  const handleOpenPaymentModal = () => {
    if (!selectedPanelProject) return;

    // Calculate remaining amount - properly parse values
    const actualCost = parseFloat(selectedPanelProject.actual_cost?.toString() || '0') || 0;
    const totalPaid = projectPayments
      .filter(p => p.status === 'Approved')
      .reduce((sum, p) => sum + (parseFloat(p.amount?.toString() || '0') || 0), 0);
    const remaining = actualCost - totalPaid;

    setRemainingAmount(remaining);
    setPaymentForm({ stage_name: '', amount: '' });
    setPaymentModalOpen(true);
  };

  const handleRequestPayment = async () => {
    if (!selectedPanelProject) return;

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > remainingAmount) {
      toast.error(`Amount cannot exceed remaining amount (${remainingAmount.toLocaleString()})`);
      return;
    }

    if (!paymentForm.stage_name.trim()) {
      toast.error('Please enter a stage name');
      return;
    }

    setRequestingPayment(true);
    try {
      const response = await axios.post(`/projects/${selectedPanelProject.id}/request-payment`, {
        stage_name: paymentForm.stage_name,
        amount: amount,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setPaymentModalOpen(false);
        // Refresh payments
        const res = await axios.get(`/projects/${selectedPanelProject.id}/payments`);
        setProjectPayments(res.data.payments);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request payment");
    } finally {
      setRequestingPayment(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Project Management" />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
        {/* Main List Area */}
        <div className={`flex-1 p-2 md:p-4 lg:p-6 overflow-y-auto ${selectedPanelProject ? 'lg:w-2/3' : 'w-full'}`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="p-3 pb-2 md:pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
              <div>
                <CardTitle className="text-2xl font-bold">Projects</CardTitle>
                <p className="text-muted-foreground text-sm md:text-md lg:text-lg">Manage institutional projects</p>
              </div>
              {permissions.can_add &&
                <Link href="/projects/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </Link>
              }
            </CardHeader>

            <Separator />

            <CardContent className="p-2 pt-4 md:pt-6 space-y-4 md:space-y-6 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col md:flex-row md:items-center gap-4 shrink-0">
                <Input
                  type="text"
                  placeholder="Search projects... (press Enter)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKey}
                />
                <select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    All
                  </option>
                  <option value="inprogress">
                    InProgress
                  </option><option value="completed">
                    Completed
                  </option><option value="planned">
                    Planned
                  </option>
                  <option value="waiting">
                    Waiting
                  </option>
                </select>
                <Button onClick={() => updateFilters({ search, status: selectedStatus })}>
                  Fetch
                </Button>
              </div>

              <div className="space-y-3 flex-1 overflow-auto">
                <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-primary dark:bg-gray-800 text-center" >
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Project</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Type</th>

                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20 hidden lg:table-cell">Fund Head</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Est. Cost</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Act. Cost</th>


                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Priority</th>

                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Status</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20 hidden sm:table-cell">Approval</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20 hidden md:table-cell">Current Stage</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20 hidden lg:table-cell">Comment</th>
                      <th className="border p-2 text-xs md:text-sm font-medium text-white dark:text-gray-200 whitespace-nowrap sticky top-0 bg-primary dark:bg-gray-800 z-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-muted-foreground text-center p-4">No projects found.</td>
                      </tr>
                    ) : (
                      projects.data.map((project) => (
                        <tr
                          key={project.id}
                          className={`hover:bg-primary/10 dark:hover:bg-gray-700 text-center cursor-pointer transition-colors ${selectedPanelProject?.id === project.id ? 'bg-primary/5 dark:bg-gray-700 border-l-4 border-l-primary' : ''}`}
                          onClick={() => setSelectedPanelProject(project)}
                        >

                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap text-left">
                            <Link
                              href={`/projects/${project.id}/details`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.name}
                            </Link>
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-center">{project.projecttype?.name || '-'}</td>


                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                            {project.fund_head?.name}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100">
                            {project.estimated_cost}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex items-center justify-center gap-1">
                              {project.actual_cost || ''}
                              {project.current_stage?.can_change_cost && !project.actual_cost && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-blue-600 hover:text-blue-700"
                                  title="Add/Update Actual Cost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProjectForCost(project);
                                    setActualCostForm({ actual_cost: (project.actual_cost || '').toString() });
                                    setCostModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>


                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {project.priority || '-'}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {project.status}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 capitalize hidden sm:table-cell">
                            {project.approval_status}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 hidden md:table-cell">
                            {/* Pending Stage Logic Placeholder */}
                            {project.current_stage?.stage_name || 'Held with Regional Office'}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell truncate max-w-[150px]" title={project.final_comments || ''}>
                            {project.final_comments || '-'}
                          </td>
                          <td className="border p-2 text-xs md:text-sm text-gray-900 dark:text-gray-100" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  setImageForm({ desc: '', date: new Date().toISOString().split('T')[0], image: null });
                                  setImageUploadModalOpen(true);
                                }}
                              >
                                <Camera className="h-3 w-3 mr-1" />
                              </Button>
                              {project.pdf ? (
                                <a
                                  href={`/assets/${project.pdf}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700"
                                  title="View PDF"
                                >
                                  PDF
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                              {project.description ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-600 hover:text-blue-700"
                                  title="View Description"
                                  onClick={() => {
                                    setSelectedDescriptionProject(project);
                                    setDescriptionModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                              {permissions.can_edit &&
                                <Link href={`/projects/${project.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </Link>
                              }
                              {permissions.can_delete &&
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600 h-6 w-6">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Project <strong>{project.name}</strong> will be permanently deleted.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleDelete(project.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              }

                              {canShowInstitutionalApprove(project) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View/Approve"
                                  className="text-blue-600 hover:text-blue-700 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProjectForApproval(project);
                                    setApprovalModalOpen(true);
                                  }}
                                >
                                  <ClipboardCheck className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>

                        </tr>

                      ))
                    )}
                  </tbody></table>
              </div>

              {projects.links.length > 1 && (
                <div className="flex justify-center pt-6 flex-wrap gap-2 shrink-0">
                  {projects.links.map((link, i) => (
                    <Button
                      key={i}
                      disabled={!link.url}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                    >
                      <span dangerouslySetInnerHTML={{ __html: link.label }} />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side Panel */}
        {selectedPanelProject && (
          <div className="w-full lg:w-1/3 border-l bg-background p-4 md:p-6 shadow-xl overflow-y-auto flex flex-col h-full transition-all duration-300 ease-in-out z-20 absolute lg:relative right-0 top-0 lg:top-auto bottom-0 lg:bottom-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedPanelProject.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedPanelProject.institute?.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPanelProject(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Tabs defaultValue="approvals" className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="images"><Camera className="h-3 w-3 mr-1" />Images</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 px-1">
                <TabsContent value="approvals" className="space-y-4 m-0 h-full">
                  {loadingPanelData ? (
                    <div className="flex justify-center py-8 text-muted-foreground">Loading history...</div>
                  ) : approvalHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      No approval history found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {approvalHistory.map((record) => (
                        <Card key={record.id} className="overflow-hidden border shadow-sm">
                          <CardHeader className="p-2 bg-muted/30 pb-1 border-b">
                            <div className="flex justify-between items-center">
                              <div className="font-semibold text-xs">{record.stage?.stage_name || 'Stage'}</div>
                              {record.status === 'approved' ? (
                                <Badge variant="outline" className="h-4 border-green-500 text-green-600 bg-green-50 gap-1 px-1 py-0 text-[10px]">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                                </Badge>
                              ) : record.status === 'rejected' ? (
                                <Badge variant="outline" className="h-4 border-red-500 text-red-600 bg-red-50 gap-1 px-1 py-0 text-[10px]">
                                  <XCircle className="w-2.5 h-2.5" /> Rejected
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="h-4 border-yellow-500 text-yellow-600 bg-yellow-50 gap-1 px-1 py-0 text-[10px]">
                                  <Clock className="w-2.5 h-2.5" /> Pending
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <div className="text-[10px] text-muted-foreground flex items-center">
                                <Clock className="w-2.5 h-2.5 mr-1" />
                                {record.action_date ? new Date(record.action_date).toLocaleString() : "-"}
                              </div>
                              <div className="text-[10px]">
                                <span className="font-medium text-muted-foreground">Approved by: </span>
                                <span className="font-medium">{record.approver?.name}</span>
                              </div>
                            </div>
                            {record.comments && (
                              <div className="bg-muted/50 px-2 py-1 rounded text-[10px] italic border mt-1 line-clamp-2">
                                "{record.comments}"
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {record.pdf && (
                                <a
                                  href={`/${record.pdf}`}
                                  target="_blank"
                                  className="text-blue-600 hover:underline text-[10px] flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" /> PDF
                                </a>)}
                              {record.img && (
                                <div className="flex items-center gap-1">
                                  <ImagePreview
                                    dataImg={record.img}
                                    size="h-4 w-4"
                                    className="rounded border object-cover"
                                  />
                                  <span className="text-[10px] text-muted-foreground">Image</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="milestones" className="space-y-4 m-0 h-full">
                  {loadingPanelData ? (
                    <div className="flex justify-center py-8 text-muted-foreground">Loading milestones...</div>
                  ) : projectMilestones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      No milestones found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectMilestones.map((milestone) => (
                        <Card
                          key={milestone.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border shadow-sm overflow-hidden"
                          onClick={() => handleMilestoneClick(milestone)}
                        >
                          <div className="flex items-start">
                            {milestone.img && (
                              <div className="w-16 h-16 shrink-0">
                                <ImagePreview
                                  dataImg={milestone.img}
                                  size="h-16 w-16"
                                  className="h-16 w-16 object-cover rounded-none"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <CardHeader className="p-2 py-1.5 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
                                <div className="font-semibold text-xs truncate pr-2">{milestone.name}</div>
                                <Badge variant={
                                  milestone.status === 'completed' ? 'default' :
                                    milestone.status === 'inprogress' ? 'secondary' : 'outline'
                                } className="capitalize text-[10px] px-1 py-0 h-4 shrink-0">
                                  {milestone.status}
                                </Badge>
                              </CardHeader>
                              <CardContent className="p-2 text-xs space-y-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>Due: {milestone.days} days</span>
                                  {milestone.completed_date && (
                                    <span className="text-green-600 dark:text-green-400">Done: {new Date(milestone.completed_date).toLocaleDateString()}</span>
                                  )}
                                </div>
                                {milestone.description && (
                                  <p className="text-muted-foreground text-[10px] line-clamp-1">
                                    {milestone.description}
                                  </p>
                                )}    {milestone.pdf && (
                                  <a
                                    href={`/assets/${milestone.pdf}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-600 hover:underline text-[10px] flex items-center gap-1 mt-0.5"
                                  >
                                    <FileText className="h-3 w-3" /> View PDF
                                  </a>
                                )}
                              </CardContent>
                            </div>
                          </div>
                        </Card>
                      ))}

                    </div>
                  )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-4 m-0 h-full">
                  {loadingPanelData ? (
                    <div className="flex justify-center py-8 text-muted-foreground">Loading payments...</div>
                  ) : projectPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      No payments found.
                      {selectedPanelProject.actual_cost &&
                        selectedPanelProject.approval_status === 'approved' && (
                          <div className="pt-2">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              onClick={handleOpenPaymentModal}
                            >
                              Request Payment
                            </Button>
                          </div>
                        )}
                    </div>

                  ) : (
                    <div className="space-y-4">
                      {projectPayments.map((payment) => (
                        <Card key={payment.id} className="border shadow-sm">
                          <CardHeader className="p-2 py-1.5 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
                            <div className="font-semibold text-xs">Rs. {payment.amount.toLocaleString()}</div>
                            <Badge variant="outline" className={`capitalize text-[10px] px-1 py-0 h-4 ${payment.status === 'Approved' ? 'border-green-500 text-green-600 bg-green-50' :
                              payment.status === 'Rejected' ? 'border-red-500 text-red-600 bg-red-50' :
                                'border-yellow-500 text-yellow-600 bg-yellow-50'
                              }`}>
                              {payment.status}
                            </Badge>
                          </CardHeader>
                          <CardContent className="p-2 text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <div className="text-muted-foreground font-medium truncate max-w-[150px]" title={payment.fund_head?.name || 'General Fund'}>
                                {payment.fund_head?.name || 'General Fund'}
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(payment.added_date).toLocaleDateString()}
                              </div>
                            </div>
                            {payment.description && (
                              <p className="text-muted-foreground text-[10px] italic bg-muted/30 px-1.5 py-0.5 rounded truncate">
                                "{payment.description}"
                              </p>
                            )}

                            {payment.img && (
                              <div className="mt-1">
                                <ImagePreview
                                  dataImg={payment.img}
                                  size="h-12"
                                  className="rounded border"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {(() => {
                        const actualCost = parseFloat(selectedPanelProject.actual_cost?.toString() || '0') || 0;
                        const totalPaid = projectPayments
                          .filter(p => p.status === 'Approved')
                          .reduce((sum, p) => sum + (parseFloat(p.amount?.toString() || '0') || 0), 0);
                        const remaining = actualCost - totalPaid;

                        return (selectedPanelProject.actual_cost &&
                          projectPayments[projectPayments.length - 1]?.status === 'Approved' &&
                          remaining > 0 &&
                          (projectPayments.length === 1 || projectPayments.length === 2 || projectPayments.length === 3 || projectPayments.length === 4 || selectedPanelProject.current_stage?.is_last)) ? (
                          <div className="pt-2">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              onClick={handleOpenPaymentModal}
                            >
                              Request  Payment
                            </Button>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="images" className="space-y-4 m-0 h-full">
                  {loadingPanelData ? (
                    <div className="flex justify-center py-8 text-muted-foreground">Loading images...</div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setImageForm({ desc: '', date: new Date().toISOString().split('T')[0], image: null });
                          setImageUploadModalOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" /> Upload Image
                      </Button>

                      {projectImages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                          No images found.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {projectImages.map((img) => (
                            <Card key={img.id} className="overflow-hidden border shadow-sm">
                              <div className="relative">
                                <ImagePreview
                                  dataImg={`assets/${img.image}`}

                                  size="w-full h-28 object-cover"
                                />

                              </div>
                              <CardContent className="p-1.5">
                                {img.desc && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-2" title={img.desc}>{img.desc}</p>
                                )}
                                {img.date && (
                                  <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(img.date).toLocaleDateString()}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs >
          </div >
        )
        }
      </div >

      {selectedPanelProject && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden z-10"
          onClick={() => setSelectedPanelProject(null)}
        />
      )}

      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update the details of the milestone. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={milestoneForm.name}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <select
                id="status"
                value={milestoneForm.status}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right">
                Days
              </Label>
              <Input
                id="days"
                type="number"
                value={milestoneForm.days}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, days: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>

            {milestoneForm.status === 'completed' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="completed_date" className="text-right">
                  Completed Date
                </Label>
                <Input
                  id="completed_date"
                  type="date"
                  value={milestoneForm.completed_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, completed_date: e.target.value })}
                  className="col-span-3"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="img" className="text-right">
                Image
              </Label>
              <Input
                id="img"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMilestoneForm({ ...milestoneForm, img: e.target.files[0] });
                  }
                }}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pdf" className="text-right">
                PDF
              </Label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMilestoneForm({ ...milestoneForm, pdf: e.target.files[0] });
                  }
                }}
                className="col-span-3"
              />
            </div>


            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingMilestone(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleMilestoneUpdate} disabled={savingMilestone}>
              {savingMilestone ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        project={selectedProjectForApproval as any}
        onSuccess={() => {
          router.reload({ only: ['projects'] });
        }}
      />

      <Dialog open={costModalOpen} onOpenChange={setCostModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Actual Cost</DialogTitle>
            <DialogDescription>
              Enter the actual cost for <strong>{selectedProjectForCost?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCostUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actual_cost" className="text-right">
                  Cost
                </Label>
                <Input
                  id="actual_cost"
                  type="number"
                  step="0.01"
                  className="col-span-3"
                  value={actualCostForm.actual_cost}
                  onChange={(e) => setActualCostForm({ actual_cost: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updatingCost}>
                {updatingCost ? 'Updating...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCostHigherWarning} onOpenChange={setShowCostHigherWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Actual Cost Higher than Estimated</AlertDialogTitle>
            <AlertDialogDescription>
              The actual cost you entered (<strong>{actualCostForm.actual_cost}</strong>) is higher than the estimated cost (<strong>{selectedProjectForCost?.estimated_cost}</strong>).
              <br /><br />
              Are you sure you want to proceed with this then  project will be marked as waiting and project submit to Regional Head for approval ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCostHigherWarning(false)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithCostUpdate}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Request Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
            <DialogDescription>
              Enter the stage name and amount for the payment request.
              <br />
              <span className="text-sm font-medium mt-2 inline-block">
                Remaining Amount: <span className="text-green-600 font-bold">{remainingAmount.toLocaleString()}</span>
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage_name" className="text-right">
                Stage Name
              </Label>
              <Input
                id="stage_name"
                placeholder="e.g., Foundation Work"
                className="col-span-3"
                value={paymentForm.stage_name}
                onChange={(e) => setPaymentForm({ ...paymentForm, stage_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_amount" className="text-right">
                Amount
              </Label>
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                max={remainingAmount}
                placeholder={`Max: ${remainingAmount.toLocaleString()}`}
                className="col-span-3"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            {parseFloat(paymentForm.amount) > remainingAmount && (
              <div className="text-red-500 text-sm text-center">
                Amount exceeds remaining balance!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayment}
              disabled={requestingPayment || !paymentForm.stage_name || !paymentForm.amount || parseFloat(paymentForm.amount) > remainingAmount}
            >
              {requestingPayment ? 'Requesting...' : 'Confirm Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Description Modal */}
      <Dialog open={descriptionModalOpen} onOpenChange={setDescriptionModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Description</DialogTitle>
            <DialogDescription>
              {selectedDescriptionProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/30 p-4 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
              {selectedDescriptionProject?.description || 'No description available.'}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDescriptionModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Modal */}
      <Dialog open={imageUploadModalOpen} onOpenChange={setImageUploadModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Upload Project Image</DialogTitle>
            <DialogDescription>
              Add a new image for <strong>{selectedPanelProject?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="img_file" className="text-right">Image</Label>
              <Input
                id="img_file"
                type="file"
                accept="image/*"
                className="col-span-3"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageForm({ ...imageForm, image: e.target.files[0] });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="img_desc" className="text-right">Description</Label>
              <Textarea
                id="img_desc"
                placeholder="Describe the image..."
                className="col-span-3"
                value={imageForm.desc}
                onChange={(e) => setImageForm({ ...imageForm, desc: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="img_date" className="text-right">Date</Label>
              <Input
                id="img_date"
                type="date"
                className="col-span-3"
                value={imageForm.date}
                onChange={(e) => setImageForm({ ...imageForm, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setImageUploadModalOpen(false)}>Cancel</Button>
            <Button
              disabled={uploadingImage || !imageForm.image}
              onClick={async () => {
                if (!selectedPanelProject || !imageForm.image) return;
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('image', imageForm.image);
                if (imageForm.desc) formData.append('desc', imageForm.desc);
                if (imageForm.date) formData.append('date', imageForm.date);
                try {
                  await axios.post(`/projects/${selectedPanelProject.id}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  toast.success('Image uploaded successfully');
                  setImageUploadModalOpen(false);
                  const res = await axios.get(`/projects/${selectedPanelProject.id}/images`);
                  setProjectImages(res.data);
                } catch {
                  toast.error('Failed to upload image');
                } finally {
                  setUploadingImage(false);
                }
              }}
            >
              {uploadingImage ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout >

  );
}