import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Edit, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface HelpDesk {
  id: number;
  token: string;
  description: string;
  attachment: string;
  feedback: string;
  status: string;
  title: string;
  institute_id: number;
  feedback_date: Date;
  institute: {
    name: string;
  };
  user: {
    name: string;
  };
  feedbackby: {
    name: string | null;
  };
}

interface Props {
  helpDesk?: {
    data: HelpDesk[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    status: string;
  };
  institutes: { id: number; name: string }[];
  auth: { user: { id: number; name: string } };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Help Desks', href: '/helpdesk' },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-500 text-white';
    case 'Waiting':
      return 'bg-blue-500 text-white';
    case 'Resolved':
      return 'bg-green-500 text-white';
    case 'Rejected':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export default function HelpDeskIndex({ helpDesk, filters, institutes, auth }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHelpDesk, setSelectedHelpDesk] = useState<HelpDesk | null>(null);

  // Form state for editing an existing ticket
  const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm<{
    status: string;
    feedback: string;
  }>({
    status: '',
    feedback: '',
  });

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/helpdesk', { ...filters, search, status }, { preserveScroll: true });
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    router.get('/helpdesk', { ...filters, search, status: value }, { preserveScroll: true });
  };

  const openEditModal = (helpDesk: HelpDesk) => {
    setSelectedHelpDesk(helpDesk);
    setEditData({
      status: helpDesk.status,
      feedback: helpDesk.feedback,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHelpDesk) {
      put(`/helpdesk/${selectedHelpDesk.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          setIsEditModalOpen(false);
          resetEdit();
          setSelectedHelpDesk(null);
          toast.success('Help desk ticket updated successfully.');
        },
        onError: () => {
          toast.error('Failed to update help desk ticket.');
        },
      });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Help Desk Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Help Desk</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional help desk</p>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search help desk... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>

                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary dark:bg-gray-800 text-center" >
                    <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Institute</th>
                    <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Token</th>
                    <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Title</th>
                    <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Descriptions</th>
                    <th className="border p-2  text-sm font-medium text-white dark:text-gray-200">Status</th>

                    <th className="border p-2 text-sm font-medium text-white dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!helpDesk?.data || helpDesk.data.length === 0 ? (
                    <p className="text-muted-foreground text-center">No Request found.</p>
                  ) : (
                    helpDesk.data.map((req) => (

                      <tr onClick={() => openEditModal(req)} key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center
                    "> <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          {req.institute.name}
                        </td>
                        <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          #{req.token}
                        </td>
                        <td className="border  text-sm text-gray-900 dark:text-gray-100">
                          {req.title}
                        </td>
                        <td className="border  text-sm text-gray-900 dark:text-gray-100">{req.description} </td>
                        <td className="border  text-sm text-gray-900 dark:text-gray-100">  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyles(req.status)}`}>
                          {req.status}
                        </span> </td>
                        <td className="border  text-sm text-gray-900 dark:text-gray-100">    <Button variant="ghost" size="icon" onClick={() => openEditModal(req)}>
                          <Edit className="h-4 w-4" />
                        </Button> </td>


                      </tr>
                      // <div
                      //   key={req.id}
                      //   className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition"
                      // >
                      //   <div className="flex items-center gap-3">
                      //     <Building className="h-5 w-5 text-muted-foreground" />
                      //     <div className="space-y-1">
                      //       <div className="font-medium text-sm text-foreground">
                      //         #{req.token} | {req.title}
                      //       </div>
                      //       <div className="text-xs text-muted-foreground">
                      //         Institute:{req.institute.name} | Description: {req.description} • Status:{' '}
                      //         <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyles(req.status)}`}>
                      //           {req.status}
                      //         </span>
                      //       </div>
                      //     </div>
                      //   </div>
                      //   <div className="flex items-center gap-2">
                      //     <Button variant="ghost" size="icon" onClick={() => openEditModal(req)}>
                      //       <Edit className="h-4 w-4" />
                      //     </Button>
                      //   </div>
                      // </div>
                    ))
                  )}
                </tbody></table>
            </div>

            {helpDesk?.links && helpDesk.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {helpDesk.links.map((link, i) => (
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

        {/* Edit Modal */}
        <AlertDialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Help Desk Ticket</AlertDialogTitle>
              <AlertDialogDescription>
                Update the status and feedback of the help desk ticket.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-feedback" className="block text-sm font-medium text-gray-700">
                  Feedback
                </label>
                <Input
                  id="edit-feedback"
                  type="text"
                  value={editData.feedback}
                  onChange={(e) => setEditData('feedback', e.target.value)}
                  placeholder="Enter feedback"
                  className="mt-1"
                />
                {editErrors.feedback && <p className="mt-1 text-sm text-red-600">{editErrors.feedback}</p>}
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={editData.status}
                  onChange={(e) => setEditData('status', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                {editErrors.status && <p className="mt-1 text-sm text-red-600">{editErrors.status}</p>}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedHelpDesk(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={editProcessing}>
                  Update
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}