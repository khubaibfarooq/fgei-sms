import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Building, ClipboardCheck, X, CheckCircle2, XCircle, Clock } from 'lucide-react';

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


interface Project {
  id: number;
  name: string;
  estimated_cost: number;
  actual_cost: number | null;

  status: string;
  overall_status: string;
  priority: string;
  institute_id: number;
  institute: {
    name: string;
  };
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
  due_date: string;
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
  description: string | null;
  fund_head?: {
    name: string;
  };
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
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  // Side Panel State
  const [selectedPanelProject, setSelectedPanelProject] = useState<Project | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectPayments, setProjectPayments] = useState<Payment[]>([]);
  const [loadingPanelData, setLoadingPanelData] = useState(false);

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

  const canShowInstitutionalApprove = (project: Project) => {
    return project.current_stage?.level?.toLowerCase() === 'institutional' && project.overall_status !== 'approved';
  };


  // Milestone Edit State
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    due_date: '',
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
      due_date: milestone.due_date ? milestone.due_date.split('T')[0] : '',
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
    formData.append('due_date', milestoneForm.due_date);
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
          const [historyRes, milestonesRes, paymentsRes] = await Promise.all([
            axios.get(`/projects/${selectedPanelProject.id}/history`),
            axios.get(`/projects/${selectedPanelProject.id}/milestones`),
            axios.get(`/projects/${selectedPanelProject.id}/payments`)
          ]);
          setApprovalHistory(historyRes.data);
          setProjectMilestones(milestonesRes.data);
          setProjectPayments(paymentsRes.data.payments);
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
    }
  }, [selectedPanelProject]);

  const handleCostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForCost) return;
    setUpdatingCost(true);

    router.post(`/projects/${selectedProjectForCost.id}/update-cost`, actual_cost_form_data(), {
      onSuccess: () => {
        toast.success("Actual cost updated successfully");
        setCostModalOpen(false);
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

  const handleRequestPayment = async () => {
    if (!selectedPanelProject) return;
    try {
      const response = await axios.post(`/projects/${selectedPanelProject.id}/request-payment`);
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh payments
        const res = await axios.get(`/projects/${selectedPanelProject.id}/payments`);
        setProjectPayments(res.data.payments);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request payment");
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Project Management" />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
        {/* Main List Area */}
        <div className={`flex-1 p-4 md:p-6 overflow-y-auto ${selectedPanelProject ? 'lg:w-2/3' : 'w-full'}`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
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

            <CardContent className="pt-6 space-y-6 flex-1 flex flex-col min-h-0">
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
              </div>

              <div className="space-y-3 flex-1 overflow-auto">
                <table className="w-full border-collapse border-1 rounded-md overflow-hidden shadow-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-primary dark:bg-gray-800 text-center" >
                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Name</th>
                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Estimated Cost</th>
                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Actual Cost</th>

                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Priority</th>

                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Overall Status</th>
                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Approval Status</th>
                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Current Stage</th>
                      <th className="border p-2 text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Action</th>
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

                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            {project.name}
                          </td>
                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            {project.estimated_cost}
                          </td>
                          <td className="border text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            <div className="flex items-center justify-center gap-2">
                              {project.actual_cost || '-'}
                              {project.current_stage?.can_change_cost && !project.actual_cost && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-600 hover:text-blue-700"
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

                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            {project.priority || '-'}
                          </td>
                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            {project.status}
                          </td>
                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            {project.overall_status}
                          </td>
                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                            {/* Pending Stage Logic Placeholder */}
                            {project.current_stage?.stage_name || 'Waiting'}
                          </td>
                          <td className="border text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100" onClick={(e) => e.stopPropagation()}>
                            {permissions.can_edit &&
                              <Link href={`/projects/${project.id}/edit`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            }
                            {permissions.can_delete &&
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
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
                                className="text-blue-600 hover:text-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProjectForApproval(project);
                                  setApprovalModalOpen(true);
                                }}
                              >
                                <ClipboardCheck className="h-4 w-4" />
                              </Button>
                            )}

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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
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
                        <Card key={record.id} className="overflow-hidden">
                          <CardHeader className="p-3 bg-muted/50 pb-2">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-sm">{record.stage?.stage_name || 'Stage'}</div>
                              {record.status === 'approved' ? (
                                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Approved
                                </Badge>
                              ) : record.status === 'rejected' ? (
                                <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 gap-1">
                                  <XCircle className="w-3 h-3" /> Rejected
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 text-sm">
                            <div className="flex items-center text-xs text-muted-foreground mb-2">
                              <Clock className="w-3 h-3 mr-1" />
                              {record.action_date ? new Date(record.action_date).toLocaleString() : ""}
                            </div>
                            <div className="mb-2">
                              <span className="font-medium text-xs">Approver: </span>
                              {record.approver?.name}
                            </div>
                            {record.comments && (
                              <div className="bg-muted/30 p-2 rounded text-xs italic border">
                                "{record.comments}"
                              </div>
                            )}
                            {record.pdf && (
                              <a
                                href={`/${record.pdf}`}
                                target="_blank"
                                className="mt-1 text-blue-600 underline text-xs flex items-center gap-1"
                              >
                                View PDF
                              </a>)}
                            {record.img && (
                              <div className="mt-2">
                                <img
                                  src={`/${record.img}`}
                                  alt="Evidence"
                                  className="h-20 w-auto rounded border"
                                />
                              </div>
                            )}
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
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleMilestoneClick(milestone)}
                        >
                          <CardHeader className="p-3 pb-1">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-sm">{milestone.name}</div>
                              <Badge variant={
                                milestone.status === 'completed' ? 'default' :
                                  milestone.status === 'inprogress' ? 'secondary' : 'outline'
                              } className="capitalize text-xs">
                                {milestone.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 text-sm space-y-2">
                            {milestone.img && (
                              <div className="mb-2">
                                <img
                                  src={`/${milestone.img}`}
                                  alt={milestone.name}
                                  className="w-full h-32 object-cover rounded-md"
                                />
                              </div>
                            )}
                            {milestone.pdf && (
                              <a
                                href={`/${milestone.pdf}`}
                                target="_blank"
                                className="mb-2 text-blue-600 underline text-xs flex items-center gap-1"
                              >
                                View Document (PDF)
                              </a>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Due: </span>
                                {new Date(milestone.due_date).toLocaleDateString()}
                              </div>
                              {milestone.completed_date && (
                                <div>
                                  <span className="text-muted-foreground">Completed: </span>
                                  <span className="text-green-600 dark:text-green-400">{new Date(milestone.completed_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            {milestone.description && (
                              <p className="text-muted-foreground text-xs mt-1">
                                {milestone.description}
                              </p>
                            )}
                          </CardContent>
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectPayments.map((payment) => (
                        <Card key={payment.id}>
                          <CardHeader className="p-3 pb-1">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-sm">Amount: {payment.amount}</div>
                              <Badge variant="outline" className={`capitalize text-xs ${payment.status === 'Approved' ? 'border-green-500 text-green-600 bg-green-50' :
                                payment.status === 'Rejected' ? 'border-red-500 text-red-600 bg-red-50' :
                                  'border-yellow-500 text-yellow-600 bg-yellow-50'
                                }`}>
                                {payment.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 text-sm space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {payment.fund_head?.name || 'General Fund'}
                            </div>
                            <div className="text-xs">
                              {new Date(payment.added_date).toLocaleDateString()}
                            </div>
                            {payment.description && (
                              <p className="text-muted-foreground text-xs italic">
                                "{payment.description}"
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {selectedPanelProject.actual_cost &&
                        projectPayments.length > 0 &&
                        projectPayments[projectPayments.length - 1].status === 'Approved' &&
                        ((projectPayments.length === 1) ||
                          (projectPayments.length === 2) ||
                          (projectPayments.length === 3 && selectedPanelProject.current_stage?.is_last)) && (
                          <div className="pt-2">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              onClick={handleRequestPayment}
                            >
                              Request Next Payment
                            </Button>
                          </div>
                        )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>

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
              <Label htmlFor="due_date" className="text-right">
                Due Date
              </Label>
              <Input
                id="due_date"
                type="date"
                value={milestoneForm.due_date}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                className="col-span-3"
              />
            </div>

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

            {milestoneForm.status === 'completed' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="completed_date" className="text-right">
                  Completed
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
    </AppLayout>

  );
}