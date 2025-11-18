import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { Building } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/utils/dateFormatter';
import Combobox from '@/components/ui/combobox';

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
  cost: string | number;
  status: string;
  institute?: { id: number; name?: string };
  region?: { id: number; name?: string };
  project_type?: { id: number; name?: string };
}

interface Item {
  id: number;
  name: string;
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
}

// Error Boundary
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

export default function Projects({ projects: initialProjects, institutes, regions, projectTypes, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [institute, setInstitute] = useState(filters.institute_id || '');
  const [projectType, setProjectType] = useState(filters.project_type_id || '');
  const [status, setStatus] = useState(filters.status || '');
  const [projects, setProjects] = useState(initialProjects);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Item[]>(institutes || []);
  const [region, setRegion] = useState(filters.region_id || '');

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
        cost: p.cost,
        status: p.status,
        project_type: p.project_type?.name || 'N/A',
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

    const headers = ['Name', 'Cost', 'Status', 'Project Type', 'Institute', 'Region'];
    const rows = projects.data.map((p) => [
      p.name,
      p.cost,
      p.status,
      p.project_type?.name || 'N/A',
      p.institute?.name || 'N/A',
      p.region?.name || 'N/A',
    ]);

    autoTable(doc,{
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
        <div className="flex-1 p-1 md:p-1">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left: Filters */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Filters</CardTitle>
                  <p className="text-muted-foreground text-sm">Refine your project search</p>
                </CardHeader>
                <CardContent className="space-y-4">
                

                  {/* Region */}
                     {memoizedRegions.length > 0 && (
                    <Combobox
                                                      entity="region"
                                                      value={region}
                                                      onChange={(value) => handleRegionChange(value)}
                                                      options={memoizedRegions.map((reg) => ({
                                                        id: reg.id.toString(), // Convert ID to string to match prop type
                                                        name: reg.name,
                                                      }))}
                                                      includeAllOption={false}
                                                      
                                                    />
                     )}
                  {/* Institute (Combobox) */}
                  <Combobox
                    entity="institute"
                    value={institute}
                    onChange={setInstitute}
                    options={memoizedInstitutes.map((i) => ({ id: i.id.toString(), name: i.name }))}
                    includeAllOption={false}
                    placeholder="Select Institute"
                  />

                  {/* Project Type */}
                  <Select value={projectType} onValueChange={(v) => { setProjectType(v); debouncedApplyFilters(); }}>
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

                  {/* Status */}
                  <Select value={status} onValueChange={(v) => { setStatus(v); debouncedApplyFilters(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={debouncedApplyFilters} className="w-full">
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Projects List */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">Projects Report</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportToPDF} className="w-full md:w-auto">
                      Export PDF
                    </Button>
                    <Button onClick={exportToExcel} className="w-full md:w-auto">
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-white text-center">
                          <th className="border p-2 font-medium">Name</th>
                          <th className="border p-2 font-medium">Cost</th>
                          <th className="border p-2 font-medium">Status</th>
                          <th className="border p-2 font-medium">Project Type</th>
                          <th className="border p-2 font-medium">Institute</th>
                          <th className="border p-2 font-medium">Region</th>
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
                            <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                              <td className="border p-2">{project.name}</td>
                              <td className="border p-2">{project.cost}</td>
                              <td className="border p-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  project.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                </span>
                              </td>
                              <td className="border p-2">{project.project_type?.name || 'N/A'}</td>
                              <td className="border p-2">{project.institute?.name || 'N/A'}</td>
                              <td className="border p-2">{project.region?.name || 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {projects.links.length > 1 && (
                    <div className="flex justify-center pt-6 flex-wrap gap-2">
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
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}