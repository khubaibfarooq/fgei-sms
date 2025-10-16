import React, { useState } from 'react';
import { Head, router, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Building } from 'lucide-react';
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

interface HelpDesk {
  id: number;
  token: string;
  description: string;
  attachment: string | null;
  feedback: string | null;
  status: string;
  title: string;
  institute_id: number;
  feedback_date: Date | null;
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
  };
  institutes: { id: number; name: string }[];
  auth: { user: { id: number; name: string } };
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'HelpDesks', href: '/helpdesk' },
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedHelpDesk, setSelectedHelpDesk] = useState<HelpDesk | null>(null);

  // Form state for creating a new ticket
  const { data: createData, setData: setCreateData, post, processing, errors: createErrors, reset: resetCreate } = useForm<{
    title: string;
    description: string;
    attachment: File | null;
  }>({
    title: '',
    description: '',
    attachment: null,
  });

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.get('/helpdesk', { ...filters, search }, { preserveScroll: true });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/helpdesk', {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateModalOpen(false);
        resetCreate();
        toast.success('Help desk ticket created successfully.');
      },
      onError: () => {
        toast.error('Failed to create help desk ticket.');
      },
    });
  };

  const openViewModal = (helpDesk: HelpDesk) => {
    setSelectedHelpDesk(helpDesk);
    setIsViewModalOpen(true);
  };

  const isImageAttachment = (attachment: string | null) => {
    if (!attachment) return false;
    const extension = attachment.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(extension || '');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="HelpDesk Management" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">HelpDesks</CardTitle>
              <p className="text-muted-foreground text-sm">Manage institutional helpdesk</p>
            </div>
            <AlertDialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <AlertDialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Request
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create Help Desk Ticket</AlertDialogTitle>
                  <AlertDialogDescription>
                    Fill in the details to create a new help desk ticket.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <form onSubmit={handleCreateSubmit} encType="multipart/form-data" className="space-y-4">
                  <div>
                    <label htmlFor="create-title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <Input
                      id="create-title"
                      type="text"
                      value={createData.title}
                      onChange={(e) => setCreateData('title', e.target.value)}
                      placeholder="Enter ticket title"
                      className="mt-1"
                    />
                    {createErrors.title && <p className="mt-1 text-sm text-red-600">{createErrors.title}</p>}
                  </div>
                  <div>
                    <label htmlFor="create-description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Input
                      id="create-description"
                      type="text"
                      value={createData.description}
                      onChange={(e) => setCreateData('description', e.target.value)}
                      placeholder="Enter description"
                      className="mt-1"
                    />
                    {createErrors.description && <p className="mt-1 text-sm text-red-600">{createErrors.description}</p>}
                  </div>
                  <div>
                    <label htmlFor="create-attachment" className="block text-sm font-medium text-gray-700">
                      Attachment
                    </label>
                    <Input
                      id="create-attachment"
                      type="file"
                      accept=".jpg,.png,.pdf,.doc,.docx"
                      onChange={(e) => setCreateData('attachment', e.target.files ? e.target.files[0] : null)}
                      className="mt-1"
                    />
                    {createData.attachment && (
                      <p className="mt-1 text-sm text-gray-600">Selected file: {createData.attachment.name}</p>
                    )}
                    {createErrors.attachment && <p className="mt-1 text-sm text-red-600">{createErrors.attachment}</p>}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction type="submit" disabled={processing}>
                      Create
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search helpdesk... (press Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>

            <div className="space-y-3">
              {!helpDesk?.data || helpDesk.data.length === 0 ? (
                <p className="text-muted-foreground text-center">No helpdesk found.</p>
              ) : (
                helpDesk.data.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between border px-4 py-2 rounded-md bg-muted/50 hover:bg-muted/70 transition cursor-pointer"
                    onClick={() => openViewModal(req)}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-foreground">
                          #{req.token} | {req.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Description: {req.description} • Status:{' '}
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyles(req.status)}`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

        {/* View Modal */}
        <AlertDialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Help Desk Ticket Details</AlertDialogTitle>
              <AlertDialogDescription>Details of the selected help desk ticket.</AlertDialogDescription>
            </AlertDialogHeader>
            {selectedHelpDesk && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Token</label>
                  <p className="mt-1 text-sm text-gray-900">#{selectedHelpDesk.token}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHelpDesk.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHelpDesk.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                      selectedHelpDesk.status
                    )}`}
                  >
                    {selectedHelpDesk.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Feedback</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHelpDesk.feedback || 'No feedback provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Feedback Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedHelpDesk.feedback_date
                      ? new Date(selectedHelpDesk.feedback_date).toLocaleDateString()
                      : 'No feedback date'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institute</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHelpDesk.institute.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHelpDesk.user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Feedback By</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHelpDesk.feedbackby?.name || 'None'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachment</label>
                  {selectedHelpDesk.attachment ? (
                    isImageAttachment(selectedHelpDesk.attachment) ? (
                      <img
                        src={`/storage/${selectedHelpDesk.attachment}`}
                        alt="Attachment"
                        className="mt-2 max-w-full h-auto rounded-md"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.open(`/storage/${selectedHelpDesk.attachment}`, '_blank')}
                      >
                        View Attachment
                      </Button>
                    )
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">No attachment</p>
                  )}
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedHelpDesk(null)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}