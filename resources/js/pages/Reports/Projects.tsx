// Imports updated with new dependencies
import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

    // Specific user requests
    if (level === 'regional' && userRole === 'region' && status !== "approved") return true;
    if (level === 'dte' && (userRole === 'dirhrm' || userRole === 'directorate') && status !== "approved") return true;


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
            <div className="flex flex-col gap-3 h-full">

              {/* Only Filter Card Area */}
              <Card className="shrink-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-4">
                  <div className="flex flex-col md:flex-row gap-2">
                    {/* Region */}
                    {memoizedRegions.length > 0 && (
                      <div className="w-full md:w-1/4">
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
                    <div className="w-full md:w-1/4">
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
                    <div className="w-full md:w-1/4">
                      <Select value={projectType} onValueChange={(v) => setProjectType(v)}>
                        <SelectTrigger>
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
                    <div className="w-full md:w-1/4">
                      <Select value={status} onValueChange={(v) => setStatus(v)}>
                        <SelectTrigger>
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

                  <div className="flex gap-2 justify-end">
                    <Button onClick={debouncedApplyFilters} size="sm">
                      Apply Filters
                    </Button>
                    <Button onClick={exportToPDF} size="sm" variant="outline">
                      Export PDF
                    </Button>
                    <Button onClick={exportToExcel} size="sm" variant="outline">
                      Export Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table Area */}
              <Card className="flex-1 min-h-0 flex flex-col">
                <CardContent className="p-0 flex-1 overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-primary text-white text-center">
                        <th className="border p-2 font-medium">Institute</th>

                        <th className="border p-2 font-medium">Type</th>
                        <th className="border p-2 font-medium">Project</th>
                        <th className="border p-2 font-medium">Description</th>
                        <th className="border p-2 font-medium">Estimated Cost</th>
                        <th className="border p-2 font-medium">Actual Cost</th>
                        <th className="border p-2 font-medium">PDF</th>
                        <th className="border p-2 font-medium">Fund Head</th>
                        <th className="border p-2 font-medium">Current Stage</th>

                        <th className="border p-2 font-medium">Approval Status</th>


                        <th className="border p-2 font-medium">Completion %</th>
                        <th className="border p-2 font-medium">Project Status</th>
                        <th className="border p-2 font-medium">Final Comments</th>
                        <th className="border p-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.data.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-4 text-muted-foreground">
                            No projects found.
                          </td>
                        </tr>
                      ) : (
                        projects.data.map((project) => (
                          <tr
                            key={project.id}
                            className={`hover:bg-primary/10 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedPanelProject?.id === project.id ? 'bg-primary/5 dark:bg-gray-700 border-l-4 border-l-primary' : ''}`}
                            onClick={() => setSelectedPanelProject(project)}
                          >
                            <td className="border p-2">{project.institute?.name || '-'}</td>

                            <td className="border p-2 text-center">{project.projecttype?.name || '-'}</td>
                            <td className="border p-2 font-medium">{project.name}</td>
                            <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {project.description ? (
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
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>

                            <td className="border p-2 text-right">{project.estimated_cost}</td>
                            <td className="border p-2 text-right">{project.actual_cost}</td>
                            <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {project.pdf ? (
                                <a
                                  href={`/assets/${project.pdf}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700"
                                  title="View PDF"
                                >
                                  <FileText className="h-5 w-5" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="border p-2 text-center">{project.fundhead?.name}</td>
                            <td className="border p-2 text-center">{project.current_stage?.stage_name || 'Request Initiated'}</td>
                            <td className="border p-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.approval_status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.approval_status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {project.approval_status.charAt(0).toUpperCase() + project.approval_status.slice(1)}<br />

                              </span>
                              {project.approval_status === 'waiting' ? project.current_stage?.level || 'Regional Office' : ''}
                            </td>


                            <td className="border p-2 text-center">{project.completion_per ? parseFloat(project.completion_per.toString()) : '-'}</td>
                            <td className="border p-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </span>
                            </td>                   <td className="border p-2 text-center">{project.final_comments || '-'}</td>
                            <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
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
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
                {/* Pagination */}
                {projects.links.length > 1 && (
                  <div className="p-4 border-t flex justify-center flex-wrap gap-2 shrink-0">
                    {projects.links.map((link, i) => (
                      <Button
                        key={i}
                        disabled={!link.url}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
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
                                {record.action_date ? new Date(record.action_date).toLocaleString() : ''}
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
                                </a>
                              )}
                              {record.img && (
                                <div className="mt-2">
                                  <ImagePreview
                                    dataImg={record.img}
                                    size="h-20"
                                    className="rounded border"
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
                          <Card key={milestone.id}>
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
                                  <ImagePreview
                                    dataImg={milestone.img}
                                    size="h-32"
                                    className="w-full object-cover rounded-md"
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
                                  <span className="text-muted-foreground">Due in: </span>
                                  {milestone.days} days
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