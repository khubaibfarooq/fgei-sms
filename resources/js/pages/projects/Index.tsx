import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
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

interface Project {
  id: number;
  name: string;
  cost: number;
  status:string;
  institute_id: number;
  institute: {
    name: string;
  };
  rooms_count?: number;
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
    status:string;
  };
  permissions: {
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Projects', href: '/projects' },
];

export default function ProjectIndex({ projects, filters,permissions }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

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
 const handleStatusChange= (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value=  e.target.value;
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
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Project Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
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
  
</select>
            </div>

            <div className="space-y-3">
               <table className="w-full border-collapse  border-1 rounded-md overflow-hidden shadow-sm">
  <thead>
    <tr className="bg-primary dark:bg-gray-800 text-center" >
      <th className="border p-2  text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Name</th>
      <th className="border p-2  text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Cost</th>
            <th className="border p-2  text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Status</th>


      <th className="border p-2  text-sm md:text-md lg:text-lg font-medium text-white dark:text-gray-200">Action</th>
     
      
    </tr>
  </thead>
  <tbody>
              {projects.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No projects found.</p>
              ) : (
                projects.data.map((project) => (
                   <tr  key={project.id} className="hover:bg-primary/10 dark:hover:bg-gray-700 text-center
                    ">
                     
                         <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                          {project.name}
                         </td>
                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                 {project.cost}
                         </td>
                           <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">
                   {project.status}
                         </td>
                          <td className="border  text-sm md:text-md lg:text-lg text-gray-900 dark:text-gray-100">  {permissions.can_edit &&
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
                      }</td>
                          </tr>
                 
                ))
              )}
              </tbody></table>
            </div>

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
    </AppLayout>
  );
}