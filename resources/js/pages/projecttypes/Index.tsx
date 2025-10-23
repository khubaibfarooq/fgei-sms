import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

interface ProjectType {
  id: number;
  name: string;

}

interface Props {
  projectTypes: {
    data: ProjectType[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Project Types', href: '/project-types' },
];

export default function ProjectTypeIndex({ projectTypes, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  console.log(projectTypes);
  const handleDelete = (id: number) => {
    router.delete(`/project-types/${id}`, {
      onSuccess: () => toast.success('Project type deleted successfully'),
      onError: () => toast.error('Failed to delete Project type'),
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/project-types', { ...filters, search }, { preserveScroll: true });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Project Type Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Project Types</CardTitle>
              <p className="text-muted-foreground text-sm">Manage Project types</p>
            </div>
            <Link href="/project-types/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Project Type
              </Button>
            </Link>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search Project types... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
               <table className="w-full border-collapse">
  <thead>
    <tr className="bg-primary dark:bg-gray-800 text-center">
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">ID</th>
      <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Name</th>
     
     
      <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Actions</th>
    </tr>
  </thead>
  <tbody>
              {!projectTypes || projectTypes.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No Project types found.</p>
              ) : (
                projectTypes.data.map((projectType) => (
                   <tr key={projectType.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center
                    ">
                      <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          {projectType.id}
                         </td>
                           <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          {projectType.name}
                         </td>
                         <td className="border  text-sm text-gray-900 dark:text-gray-100">
  <Link href={`/project-types/${projectType.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this Project type?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Project type <strong>{projectType.name}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(projectType.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                         </td>
                         </tr>
                  
                ))
              )}
              </tbody></table>
            </div>

            {!projectTypes || projectTypes.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {projectTypes.links.map((link, i) => (
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