import React, { useState } from 'react';
import { Head, router, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Building, ChevronLeft, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import ChatBox from '@/components/ChatBox';

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
  created_at: Date;
  updated_at: Date;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'yellow';
    case 'Waiting': return 'blue';
    case 'Resolved': return 'green';
    case 'Rejected': return 'red';
    default: return 'gray';
  }
};

export default function HelpDeskIndex({ helpDesk, filters, institutes, auth }: Props) {


  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
      router.get('/helpdesk', { ...filters, search, status }, { preserveScroll: true });
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    router.get('/helpdesk', { ...filters, search, status: value }, { preserveScroll: true });
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


  const isImageAttachment = (attachment: string | null) => {
    if (!attachment) return false;
    const extension = attachment.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(extension || '');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="HelpDesk" />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
        {/* Left Sidebar: Ticket List */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r bg-card transition-all ${selectedHelpDesk ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">HelpDesk</h1>
              <AlertDialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Plus className="h-5 w-5" />
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
                      <label htmlFor="create-title" className="block text-sm font-medium">Title</label>
                      <Input
                        id="create-title"
                        type="text"
                        value={createData.title}
                        onChange={(e) => setCreateData('title', e.target.value)}
                        placeholder="Enter ticket title"
                      />
                      {createErrors.title && <p className="text-xs text-destructive mt-1">{createErrors.title}</p>}
                    </div>
                    <div>
                      <label htmlFor="create-description" className="block text-sm font-medium">Description</label>
                      <Input
                        id="create-description"
                        type="text"
                        value={createData.description}
                        onChange={(e) => setCreateData('description', e.target.value)}
                        placeholder="Enter description"
                      />
                      {createErrors.description && <p className="text-xs text-destructive mt-1">{createErrors.description}</p>}
                    </div>
                    <div>
                      <label htmlFor="create-attachment" className="block text-sm font-medium">Attachment</label>
                      <Input
                        id="create-attachment"
                        type="file"
                        accept=".jpg,.png,.pdf,.doc,.docx"
                        onChange={(e) => setCreateData('attachment', e.target.files ? e.target.files[0] : null)}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction type="submit" disabled={processing}>Create</AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKey}
                  className="h-9 pl-9"
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Waiting">Waiting</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {!helpDesk?.data || helpDesk.data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                No tickets found
              </div>
            ) : (
              helpDesk.data.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedHelpDesk(req)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors min-h-[80px] flex flex-col justify-center ${selectedHelpDesk?.id === req.id ? 'bg-primary/10 border-r-2 border-primary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono font-medium text-muted-foreground">#{req.token}</span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${getStatusStyles(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{req.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground italic">
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}

            {helpDesk?.links && helpDesk.links.length > 3 && (
              <div className="p-4 flex justify-center gap-1 border-t">
                {helpDesk.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    variant={link.active ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 text-[10px]"
                    onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Content: Conversation */}
        <div className={`flex-1 flex flex-col bg-muted/5 transition-all ${!selectedHelpDesk ? 'hidden md:flex' : 'flex'}`}>
          {selectedHelpDesk ? (
            <>
              {/* Header */}
              <div className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedHelpDesk(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h2 className="font-bold text-base leading-none mb-1">{selectedHelpDesk.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      Ticket #{selectedHelpDesk.token} • {selectedHelpDesk.institute.name}
                    </p>
                  </div>
                </div>
                <div className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${getStatusStyles(selectedHelpDesk.status)}`}>
                  {selectedHelpDesk.status}
                </div>
              </div>

              {/* Scrollable Conversation */}
              <div className="flex-1 overflow-y-auto p-1 lg:p-2">
                <div className="max-w-full mx-auto space-y-2">
                  {/* Ticket Details Summary */}
                  <div className="bg-card rounded-xl border p-2 shadow-sm space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-2 border-b">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Created By</label>
                        <p className="text-sm font-medium">{selectedHelpDesk.user.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Date Created</label>
                        <p className="text-sm font-medium">{new Date(selectedHelpDesk.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Last Update</label>
                        <p className="text-sm font-medium">{new Date(selectedHelpDesk.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Institute</label>
                        <p className="text-sm font-medium truncate">{selectedHelpDesk.institute.name}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap italic">
                        "{selectedHelpDesk.description}"
                      </p>

                      {selectedHelpDesk.attachment && (
                        <div className="pt-2">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-2">Attached Documents</label>
                          {isImageAttachment(selectedHelpDesk.attachment) ? (
                            <div className="relative group max-w-[240px]">
                              <img
                                src={`/${selectedHelpDesk.attachment}`}
                                alt="Attachment preview"
                                className="rounded-lg border object-cover h-32 w-full hover:brightness-90 transition-all cursor-zoom-in"
                                onClick={() => window.open(`/${selectedHelpDesk.attachment}`, '_blank')}
                              />
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => window.open(`/${selectedHelpDesk.attachment}`, '_blank')}
                            >
                              Download File
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Official Resolution Overlay */}
                  {(selectedHelpDesk.feedback || selectedHelpDesk.feedbackby) && (
                    <div className={
                      selectedHelpDesk.status === 'Pending' ? 'bg-yellow-500/10 border-yellow-500/20 rounded-xl p-4 md:p-5 border text-yellow-900 dark:text-yellow-100 shadow-sm relative overflow-hidden group' :
                        selectedHelpDesk.status === 'Waiting' ? 'bg-blue-500/10 border-blue-500/20 rounded-xl p-4 md:p-5 border text-blue-900 dark:text-blue-100 shadow-sm relative overflow-hidden group' :
                          selectedHelpDesk.status === 'Resolved' ? 'bg-green-500/10 border-green-500/20 rounded-xl p-4 md:p-5 border text-green-900 dark:text-green-100 shadow-sm relative overflow-hidden group' :
                            selectedHelpDesk.status === 'Rejected' ? 'bg-red-500/10 border-red-500/20 rounded-xl p-4 md:p-5 border text-red-900 dark:text-red-100 shadow-sm relative overflow-hidden group' :
                              'bg-gray-500/10 border-gray-500/20 rounded-xl p-4 md:p-5 border text-gray-900 dark:text-gray-100 shadow-sm relative overflow-hidden group'
                    }>
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-${getStatusColor(selectedHelpDesk.status)}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform`} />
                      <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 text-${getStatusColor(selectedHelpDesk.status)}-600 dark:text-${getStatusColor(selectedHelpDesk.status)}-500`}>Official Support Resolution</h4>
                      <p className="text-sm leading-relaxed mb-4 font-medium">{selectedHelpDesk.feedback || 'In Progress - Awaiting final resolution.'}</p>
                      <div className={`flex items-center justify-between pt-3 border-t border-${getStatusColor(selectedHelpDesk.status)}-500/10 text-[10px] uppercase font-bold tracking-wider`}>
                        <span className="flex items-center gap-1.5">
                          <Building className="h-3 w-3" />
                          {selectedHelpDesk.feedbackby?.name || 'Assigned Agent'}
                        </span>
                        {selectedHelpDesk.feedback_date && (
                          <span>Resolved at: {new Date(selectedHelpDesk.feedback_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chat Section */}
                  <div className="pt-1">
                    <ChatBox helpDeskId={selectedHelpDesk.id} status={selectedHelpDesk.status} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-40">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Building className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your Conversations</h2>
              <p className="text-sm text-center max-w-[300px]">
                Select a ticket from the left sidebar to view the details and start chatting with support.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}