// Imports updated with new dependencies
import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type BreadcrumbItem } from '@/types';
import { Building, ClipboardCheck, X, CheckCircle2, XCircle, Clock, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/utils/dateFormatter';
import Combobox from '@/components/ui/combobox';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ApprovalModal from '../projects/ApprovalModal'; // Adjust import path if needed
import FundHeadSelectModal from './FundHeadSelectModal';
import { ImagePreview } from '@/components/ui/image-preview2';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Percent } from 'lucide-react';
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Projects', href: '/reports/projects' },
];

// Helper function to format currency amounts
const formatAmount = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)} Mn`;
  }
  return num.toLocaleString();
};

interface ProjectProp {
  id: number;
  name: string;
  description?: string | null;
  estimated_cost: string | number;
  actual_cost: string | number;
  pdf?: string | null;
  status: string;
  approval_status: string;
  priority: string;
  institute?: { id: number; name?: string };
  region?: { id: number; name?: string };
  projecttype?: { id: number; name?: string };
  fund_head_id?: number | string | null;
  current_stage_id?: number;
  current_stage?: {
    id: number;
    level: string;
    stage_name: string;
    users_can_approve: string;
  };
  fundhead?: {
    name: string;
  };
  final_comments?: string;
  completion_per?: number;
}

interface Item {
  id: number;
  name: string;
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
  description: string | null;
  fund_head?: {
    name: string;
  };
}

interface Props {
  projects: {
    data: ProjectProp[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    institute_id?: string;
    region_id?: string;
    project_type_id?: string;
    status?: string;
  };
  institutes: Item[];
  regions: Item[];
  projectTypes: Item[];
  fundHeads: Item[];
}

// Error Boundary (Kept as is)
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    toast.error('An error occurred. Please try again or contact support.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <p className="text-red-600">Error: {this.state.error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Validation
const isValidItem = (item: any): item is Item => {
  const isValid = item != null && typeof item.id === 'number' && item.id > 0 && typeof item.name === 'string' && item.name.trim() !== '';
  if (!isValid) console.warn('Invalid item:', item);
  return isValid;
};

export default function Projects({ projects: initialProjects, institutes, regions, projectTypes, fundHeads, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [projectType, setProjectType] = useState(filters.project_type_id || '');
  const [status, setStatus] = useState(filters.status || '');
  const [projects, setProjects] = useState(initialProjects);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    if (selectedPanelProject) {
      const updated = projects.data.find((p: ProjectProp) => p.id === selectedPanelProject.id);
      if (updated) setSelectedPanelProject(updated);
    }
  }, [projects]);



  const [region, setRegion] = useState(filters.region_id || '');
  const { auth } = usePage<any>().props;
  const user = auth.user;

  const canShowApproveButton = (project: ProjectProp) => {
    const stageLevel = project.current_stage?.level;
    const status = project.approval_status;


    // The user strictly asked for region->region and dte->dte check logic.
    if (!stageLevel) return false;

    // Normalize logic
    const userRole = (user.roles[0].name || '').toLowerCase(); // Assuming type/role property
    const level = stageLevel.toLowerCase();
    const usercanApprove = project.current_stage?.users_can_approve ?? "";
    console.log(usercanApprove);
    console.log(user.id);
    // Specific user requests
    if (level === 'regional' && userRole === 'region' && status !== "approved") return true;
    if (level === 'dte' && (userRole === 'dirhrm' || userRole === 'directorate' || userRole === 'sms_tech_approval') && status !== "approved" && usercanApprove.includes(user.id)) return true;


    return false;
  };


  // Modal and Side Panel State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectProp | null>(null);

  const [fundHeadModalOpen, setFundHeadModalOpen] = useState(false);
  const [selectedProjectForFundHead, setSelectedProjectForFundHead] = useState<ProjectProp | null>(null);

  const [selectedPanelProject, setSelectedPanelProject] = useState<ProjectProp | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectPayments, setProjectPayments] = useState<Payment[]>([]);
  const [loadingPanelData, setLoadingPanelData] = useState(false);

  // Completion Percentage Modal State
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedProjectForCompletion, setSelectedProjectForCompletion] = useState<ProjectProp | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState('');
  const [updatingCompletion, setUpdatingCompletion] = useState(false);

  // Description Modal State
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedDescriptionProject, setSelectedDescriptionProject] = useState<ProjectProp | null>(null);

  // Need Approval Filter State
  const [needApproval, setNeedApproval] = useState(false);

  // Memoized dropdown options
  const memoizedInstitutes = useMemo(() => {
    return Array.isArray(filteredInstitutes) ? filteredInstitutes.filter(isValidItem) : [];
  }, [filteredInstitutes]);

  const memoizedRegions = useMemo(() => {
    return Array.isArray(regions) ? regions.filter(isValidItem) : [];
  }, [regions]);

  const memoizedProjectTypes = useMemo(() => {
    return Array.isArray(projectTypes) ? projectTypes.filter(isValidItem) : [];
  }, [projectTypes]);

  // Filtered projects based on needApproval checkbox
  const filteredProjects = useMemo(() => {
    if (!needApproval) return projects.data;
    return projects.data.filter(project => canShowApproveButton(project));
  }, [projects.data, needApproval, user]);

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

  // Fetch institutes by region
  const fetchInstitutes = async (regionId: string) => {
    if (!regionId || regionId === '0') {
      setFilteredInstitutes(institutes || []);
      if (institute) setInstitute('');
      return;
    }

    try {
      const params = new URLSearchParams({ region_id: regionId }).toString();
      const response = await fetch(`/reports/getInstitutes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch institutes');
      const data = await response.json();
      setFilteredInstitutes(data);
      if (institute && !data.some((i: Item) => i.id.toString() === institute)) {
        setInstitute('');
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to load institutes');
      setFilteredInstitutes([]);
    }
  };

  // Handle region change
  const handleRegionChange = (value: string) => {
    setRegion(value);
    fetchInstitutes(value);
    //debouncedApplyFilters();
  };

  // Handle completion percentage update
  const handleOpenCompletionModal = (project: ProjectProp) => {
    setSelectedProjectForCompletion(project);
    setCompletionPercentage(parseFloat((project.completion_per || 0).toString()).toString());
    setCompletionModalOpen(true);
  };

  const handleUpdateCompletion = async () => {
    if (!selectedProjectForCompletion) return;

    const percentage = parseFloat(completionPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Please enter a valid percentage (0-100)');
      return;
    }

    setUpdatingCompletion(true);
    try {
      const response = await axios.post(`/projects/${selectedProjectForCompletion.id}/update-completion`, {
        completion_per: percentage,
      });
      if (response.data.success) {
        toast.success('Completion percentage updated successfully');
        setCompletionModalOpen(false);
        // Refresh projects
        debouncedApplyFilters();
      } else {
        toast.error(response.data.message || 'Failed to update');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update completion percentage');
    } finally {
      setUpdatingCompletion(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projects');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Cost', key: 'cost', width: 15 },

      { header: 'Status', key: 'status', width: 15 },
      { header: 'Project Type', key: 'project_type', width: 25 },
      { header: 'Institute', key: 'institute', width: 30 },
      { header: 'Region', key: 'region', width: 25 },
    ];

    projects.data.forEach((p) => {
      worksheet.addRow({
        name: p.name,
        estimated_cost: p.estimated_cost,
        actual_cost: p.actual_cost,

        status: p.status,
        project_type: p.projecttype?.name || 'N/A',
        institute: p.institute?.name || 'N/A',
        region: p.region?.name || 'N/A',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, 'Projects_Report.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Projects Report', 14, 15);

    const headers = ['Name', 'Estimated Cost', 'Actual Cost', 'Status', 'Project Type', 'Institute', 'Region'];
    const rows = projects.data.map((p) => [
      p.name,
      p.estimated_cost,
      p.actual_cost,

      p.status,
      p.projecttype?.name || 'N/A',
      p.institute?.name || 'N/A',
      p.region?.name || 'N/A',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });

    doc.save('Projects_Report.pdf');
  };

  // Debounced filter apply
  const debouncedApplyFilters = useMemo(
    () =>
      debounce(() => {
        const params = new URLSearchParams({
          search: search.trim(),
          institute_id: institute || '',
          region_id: region || '',
          project_type_id: projectType || '',
          status: status || '',
        });

        fetch(`/reports/projects/getprojects?${params.toString()}`)
          .then((res) => res.json())
          .then((data) => {
            console.log('Filtered projects:', data);
            setProjects(data);
          })
          .catch((err) => {
            console.error('Fetch error:', err);
            toast.error('Failed to load projects');
          });
      }, 300),
    [search, institute, region, projectType, status]
  );

  return (
    <ErrorBoundary>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Projects Report" />
        <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
          {/* Main Content Area (Filters + Table) */}
          <div className={`flex-1 p-2 md:p-4 overflow-y-auto ${selectedPanelProject ? 'lg:w-2/3' : 'w-full'}`}>
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="p-1.5 pb-0 shrink-0">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-base font-bold">Projects Report</CardTitle>
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedPanelProject ? 'xl:grid-cols-2 2xl:grid-cols-4' : 'lg:grid-cols-4'} gap-1.5`}>
                  {/* Region */}
                  {memoizedRegions.length > 0 && (
                    <div className="w-full">
                      <Combobox
                        entity="region"
                        value={region}
                        onChange={(value) => handleRegionChange(value)}
                        options={memoizedRegions.map((reg) => ({
                          id: reg.id.toString(),
                          name: reg.name.split(' ').pop() || reg.name,
                        }))}
                        includeAllOption={true}
                      />
                    </div>
                  )}
                  {/* Institute */}
                  <div className="w-full">
                    <Combobox
                      entity="institute"
                      value={institute}
                      onChange={setInstitute}
                      options={memoizedInstitutes.map((i) => ({ id: i.id.toString(), name: i.name }))}
                      includeAllOption={false}
                      placeholder="Select Institute"
                    />
                  </div>

                  {/* Project Type */}
                  <div className="w-full">
                    <Select value={projectType} onValueChange={(v) => setProjectType(v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select Project Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All Project Types</SelectItem>
                        {memoizedProjectTypes.map((pt) => (
                          <SelectItem key={pt.id} value={pt.id.toString()}>
                            {pt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="w-full">
                    <Select value={status} onValueChange={(v) => setStatus(v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-between items-center pt-1.5 pb-1.5 border-b">
                  {/* Need Approval Checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={needApproval}
                      onCheckedChange={(checked) => setNeedApproval(checked === true)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground">Need Approval</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    <Button onClick={debouncedApplyFilters} size="sm" className="h-7 text-xs px-2">
                      Apply Filters
                    </Button>
                    <Button onClick={exportToPDF} size="sm" variant="outline" className="h-7 text-xs px-2">
                      PDF
                    </Button>
                    <Button onClick={exportToExcel} size="sm" variant="outline" className="h-7 text-xs px-2">
                      Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-auto bg-muted/5 relative">
                {/* Desktop Table */}
                <div className="hidden md:block h-full">
                  <table className="w-full border-collapse text-sm min-w-[900px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-primary text-white text-center shadow-sm text-xs">
                        <th className="border p-1.5 font-medium">Institute</th>
                        <th className="border p-1.5 font-medium hidden xl:table-cell">Type</th>
                        <th className="border p-1.5 font-medium">Project</th>
                        <th className="border p-1.5 font-medium">Est. Cost</th>
                        <th className="border p-1.5 font-medium">Act. Cost</th>
                        <th className="border p-1.5 font-medium hidden xl:table-cell">Fund Head</th>
                        <th className="border p-1.5 font-medium hidden xl:table-cell">Stage</th>
                        <th className="border p-1.5 font-medium">Approval Status</th>
                        <th className="border p-1.5 font-medium">Project Status</th>
                        <th className="border p-1.5 font-medium">%</th>
                        <th className="border p-1.5 font-medium hidden xl:table-cell">Comments</th>
                        <th className="border p-1.5 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center p-4 text-muted-foreground">
                            No projects found.
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((project) => (
                          <tr
                            key={project.id}
                            className={`hover:bg-primary/10 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b text-xs ${selectedPanelProject?.id === project.id ? 'bg-primary/5 dark:bg-gray-700 border-l-4 border-l-primary' : 'bg-card'}`}
                            onClick={() => setSelectedPanelProject(project)}
                          >
                            <td className="border p-1.5 text-center">{project.institute?.name || '-'}</td>
                            <td className="border p-1.5 text-center hidden xl:table-cell">{project.projecttype?.name || '-'}</td>
                            <td className="border p-1.5 font-medium">
                              <Link
                                href={`/projects/${project.id}/details`}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                {project.name}
                              </Link>
                            </td>
                            <td className="border p-1.5 text-right whitespace-nowrap">{formatAmount(project.estimated_cost)}</td>
                            <td className="border p-1.5 text-right whitespace-nowrap">{formatAmount(project.actual_cost)}</td>
                            <td className="border p-1.5 text-center hidden xl:table-cell">{project.fundhead?.name}</td>
                            <td className="border p-1.5 text-center hidden xl:table-cell">{project.current_stage?.stage_name || 'Request Initiated'}</td>
                            <td className="border p-1.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tight ${project.approval_status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.approval_status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {project.approval_status.charAt(0).toUpperCase() + project.approval_status.slice(1)}
                              </span>
                            </td>
                            <td className="border p-1.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tight ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </span>
                            </td>
                            <td className="border p-1.5 text-center">
                              <span className="text-xs">{project.completion_per ? parseFloat(project.completion_per.toString()) : '-'}</span>
                            </td>
                            <td className="border p-1.5 text-center hidden xl:table-cell">{project.final_comments || '-'}</td>
                            <td className="border p-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                {project.description && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                    title="View Description"
                                    onClick={() => {
                                      setSelectedDescriptionProject(project);
                                      setDescriptionModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {project.pdf && (
                                  <a
                                    href={`/assets/${project.pdf}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700"
                                    title="View PDF"
                                  >
                                    PDF
                                  </a>
                                )}
                                {canShowApproveButton(project) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="View/Approve"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject(project);
                                      setApprovalModalOpen(true);
                                    }}
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                  </Button>
                                )}
                                {user.roles[0]?.name.toLowerCase() === 'region' && !project.fund_head_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Select Fund Head"
                                    className="text-orange-600 hover:text-orange-700 font-bold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProjectForFundHead(project);
                                      setFundHeadModalOpen(true);
                                    }}
                                  >
                                    Select Head
                                  </Button>
                                )}
                                {user.type === 'Regional Office' && project.status === 'inprogress' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={`Update Completion (${project.completion_per || 0}%)`}
                                    className="text-purple-600 hover:text-purple-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCompletionModal(project);
                                    }}
                                  >
                                    <Percent className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-2 p-2 bg-muted/5">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No projects found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredProjects.map((project) => (
                        <div
                          key={project.id}
                          className={`p-2 rounded-lg border bg-card shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedPanelProject?.id === project.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setSelectedPanelProject(project)}
                        >
                          {/* Header */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <Link
                                href={`/projects/${project.id}/details`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <h3 className="font-semibold text-sm">{project.name}</h3>
                              </Link>
                              <p className="text-xs text-muted-foreground">{project.institute?.name || '-'}</p>
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              {project.description && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-600"
                                  onClick={() => {
                                    setSelectedDescriptionProject(project);
                                    setDescriptionModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {project.pdf && (
                                <a
                                  href={`/assets/${project.pdf}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-7 w-7 text-blue-600 hover:text-blue-700"
                                >
                                  PDF
                                </a>
                              )}
                              {canShowApproveButton(project) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-600"
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setApprovalModalOpen(true);
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Cost Row */}
                          <div className="flex gap-4 text-xs mb-2">
                            <div>
                              <span className="text-muted-foreground">Est: </span>
                              <span className="font-medium">{formatAmount(project.estimated_cost)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Act: </span>
                              <span className="font-medium">{formatAmount(project.actual_cost)}</span>
                            </div>
                          </div>

                          {/* Status Row */}
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.approval_status === 'completed' ? 'bg-green-100 text-green-800' :
                              project.approval_status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                              App: {project.approval_status.charAt(0).toUpperCase() + project.approval_status.slice(1)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                              project.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                              Proj: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {project.completion_per ? parseFloat(project.completion_per.toString()) : '-'}%
                            </span>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-2 pt-2 border-t flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {project.projecttype?.name && <span className="bg-muted px-2 py-0.5 rounded">{project.projecttype.name}</span>}
                            {project.fundhead?.name && <span className="bg-muted px-2 py-0.5 rounded">{project.fundhead.name}</span>}
                            <span className="bg-muted px-2 py-0.5 rounded">{project.current_stage?.stage_name || 'Request Initiated'}</span>
                          </div>

                          {/* Action Buttons for Mobile */}
                          <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {user.roles[0]?.name.toLowerCase() === 'region' && !project.fund_head_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] h-6 text-orange-600 border-orange-300 px-2"
                                onClick={() => {
                                  setSelectedProjectForFundHead(project);
                                  setFundHeadModalOpen(true);
                                }}
                              >
                                Select Head
                              </Button>
                            )}
                            {user.type === 'Regional Office' && project.status === 'inprogress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] h-6 text-purple-600 border-purple-300 px-2"
                                onClick={() => handleOpenCompletionModal(project)}
                              >
                                <Percent className="h-3 w-3 mr-1" /> Update
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              {/* Pagination */}
              {projects.links.length > 1 && (
                <div className="p-2 border-t flex justify-center flex-wrap gap-1 shrink-0 bg-background">
                  {projects.links.map((link, i) => (
                    <Button
                      key={i}
                      disabled={!link.url}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs px-2"
                      onClick={() => {
                        if (link.url) {
                          fetch(link.url)
                            .then((response) => response.json())
                            .then((data) => {
                              setProjects(data);
                            })
                            .catch((error) => {
                              console.error('Error:', error);
                            });
                        }
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: link.label }} />
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Side Panel */}
          {selectedPanelProject && (
            <div className="w-2/3  lg:w-1/3 border-l bg-background p-3 sm:p-4 md:p-6 shadow-xl overflow-y-auto flex flex-col transition-all duration-300 ease-in-out z-20 fixed lg:relative inset-0 lg:inset-auto h-full lg:h-auto rounded-none lg:rounded-l-lg">
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
                                  {record.action_date ? new Date(record.action_date).toLocaleString() : ""}
                                </div>
                                <div className="text-[10px]">
                                  <span className="font-medium text-muted-foreground">Appr: </span>
                                  {record.approver?.name}
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
                                  </a>
                                )}
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
                            className="border shadow-sm overflow-hidden"
                          >
                            <div className="flex items-start">
                              {milestone.img && (
                                <div className="w-16 h-full shrink-0">
                                  <ImagePreview
                                    dataImg={milestone.img}
                                    size="h-full w-full"
                                    className="h-full w-full object-cover rounded-none"
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
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}

        </div>
        <ApprovalModal
          isOpen={approvalModalOpen}
          onClose={() => setApprovalModalOpen(false)}
          project={selectedProject as any}
          onSuccess={() => {
            debouncedApplyFilters();
          }}
        />

        <FundHeadSelectModal
          isOpen={fundHeadModalOpen}
          onClose={() => setFundHeadModalOpen(false)}
          project={selectedProjectForFundHead}
          fundHeads={fundHeads}
          onSuccess={() => {
            debouncedApplyFilters();
          }}
        />

        {/* Completion Percentage Modal */}
        <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Update Completion Percentage</DialogTitle>
              <DialogDescription>
                Update the completion percentage for <strong>{selectedProjectForCompletion?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="completion_per" className="text-right">
                  Percentage
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="completion_per"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0-100"
                    className="flex-1"
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(e.target.value)}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              {(parseFloat(completionPercentage) < 0 || parseFloat(completionPercentage) > 100) && (
                <div className="text-red-500 text-sm text-center">
                  Percentage must be between 0 and 100
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCompletionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCompletion}
                disabled={updatingCompletion || parseFloat(completionPercentage) < 0 || parseFloat(completionPercentage) > 100}
              >
                {updatingCompletion ? 'Updating...' : 'Save'}
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

        {
          selectedPanelProject && (
            <div
              className="fixed inset-0 bg-black/20 lg:hidden z-10"
              onClick={() => setSelectedPanelProject(null)}
            />
          )
        }
      </AppLayout >
    </ErrorBoundary >
  );
}