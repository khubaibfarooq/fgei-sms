import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Edit, Building, ChevronLeft, Search, Mail } from 'lucide-react';
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
import { formatDateTime } from '@/utils/dateFormatter';
import ChatBox from '@/components/ChatBox';

interface HelpDesk {
  id: number;
  token: string;
  description: string;
  attachment: string;
  feedback: string;
  status: string;
  title: string;
  institute_id: number;
  feedback_date: string | null;
  created_at: string;
  updated_at: string;
  institute: {
    id: number;
    name: string;
    type: string;
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
  };

  const isImageAttachment = (attachment: string | null) => {
    if (!attachment) return false;
    const extension = attachment.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(extension || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHelpDesk) {
      put(`/helpdesk/${selectedHelpDesk.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          resetEdit();
          // We keep the selected ticket but updated the status in the UI might need a refresh or just rely on router reload
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
      <Head title="Ticket Requests" />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
        {/* Left Sidebar: All Requests */}
        <div className={`w-full md:w-80 lg:w-[400px] flex flex-col border-r bg-card transition-all ${selectedHelpDesk ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b space-y-4 shadow-sm z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Requests
              </h1>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets, tokens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKey}
                  className="h-9 pl-9 bg-muted/30"
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Status" />
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

          <div className="flex-1 overflow-y-auto divide-y bg-muted/5 scrollbar-thin scrollbar-thumb-muted">
            {!helpDesk?.data || helpDesk.data.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm italic">No requests found</p>
              </div>
            ) : (
              helpDesk.data.map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedHelpDesk(req);
                    setEditData({ status: req.status, feedback: req.feedback || '' });
                  }}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-all border-l-4 ${selectedHelpDesk?.id === req.id ? 'bg-primary/5 border-primary shadow-sm' : 'border-transparent'}`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tighter">#{req.token}</span>
                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${getStatusStyles(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <h3 className="font-bold text-sm truncate uppercase tracking-tight">{req.title}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {req.institute.name}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground italic border-t pt-2 mt-2 opacity-60">
                    <span>From: {req.user.name}</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}

            {helpDesk?.links && helpDesk.links.length > 3 && (
              <div className="p-4 flex justify-center gap-1 bg-card border-t sticky bottom-0">
                {helpDesk.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url || link.active}
                    variant={link.active ? 'default' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 text-[10px]"
                    onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Content: Conversation & Resolution */}
        <div className={`flex-1 flex flex-col bg-muted/5 transition-all ${!selectedHelpDesk ? 'hidden md:flex' : 'flex'}`}>
          {selectedHelpDesk ? (
            <>
              {/* Converstation Header */}
              <div className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-20 shadow-sm h-16">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedHelpDesk(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="min-w-0">
                    <h2 className="font-black text-sm uppercase truncate leading-tight tracking-tight">{selectedHelpDesk.title}</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                      #{selectedHelpDesk.token} <span className="opacity-30">|</span> <span className="text-primary/70">{selectedHelpDesk.institute.name}</span>
                    </p>
                  </div>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusStyles(selectedHelpDesk.status)} shadow-sm`}>
                  {selectedHelpDesk.status}
                </div>
              </div>

              {/* Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-muted">
                <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                  {/* Left Column: Context & resolution */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Resolution Form */}
                    <Card className="shadow-md border-primary/10 overflow-hidden">
                      <CardHeader className="py-3 px-4 bg-primary/5 border-b">
                        <CardTitle className="text-xs uppercase font-black tracking-widest flex items-center gap-2 text-primary/80">
                          <Edit className="h-3.5 w-3.5" />
                          Update Resolution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Official Status</label>
                            <Select
                              value={editData.status}
                              onValueChange={(val) => setEditData('status', val)}
                            >
                              <SelectTrigger className="h-9 bg-muted/20 text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Waiting">Waiting</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Official Feedback</label>
                            <textarea
                              className="w-full text-xs p-3 rounded-md border min-h-[100px] bg-muted/20 focus:ring-1 focus:ring-primary outline-none font-medium leading-relaxed"
                              placeholder="Type final resolution feedback here..."
                              value={editData.feedback}
                              onChange={(e) => setEditData('feedback', e.target.value)}
                            />
                            {editErrors.feedback && <p className="text-[10px] text-destructive mt-1 font-bold italic">{editErrors.feedback}</p>}
                          </div>
                          <Button
                            disabled={editProcessing}
                            type="submit"
                            className="w-full h-10 font-black uppercase text-[10px] tracking-widest shadow-sm"
                          >
                            {editProcessing ? 'Processing...' : 'Apply Resolution'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Metadata summary */}
                    <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4 text-[11px]">
                      <div>
                        <label className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] block mb-2 opacity-50">Requester Profile</label>
                        <p className="font-black text-sm text-foreground/80">{selectedHelpDesk.user.name}</p>
                        <p className="text-muted-foreground font-medium">{selectedHelpDesk.institute.name}</p>
                        <p className="text-muted-foreground mt-0.5 opacity-70">Institute ID: {selectedHelpDesk.institute.id}</p>
                      </div>
                      <Separator className="opacity-50" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] block mb-1 opacity-50">Received</label>
                          <p className="font-bold">{new Date(selectedHelpDesk.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] block mb-1 opacity-50">Last Update</label>
                          <p className="font-bold">{new Date(selectedHelpDesk.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Original Issue & Conversation */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Original Description */}
                    <div className="bg-card rounded-2xl border p-6 shadow-sm shadow-primary/5">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 border-b pb-2 flex items-center justify-between">
                        Case Description
                        {selectedHelpDesk.attachment && (
                          <span className="text-[10px] text-muted-foreground font-medium normal-case flex items-center gap-1">
                            <Edit className="h-3 w-3" /> Includes attachment
                          </span>
                        )}
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground font-medium mb-6 whitespace-pre-wrap italic opacity-80">
                        "{selectedHelpDesk.description}"
                      </p>

                      {selectedHelpDesk.attachment && (
                        <div className="pt-2">
                          {isImageAttachment(selectedHelpDesk.attachment) ? (
                            <div className="relative group max-w-sm rounded-xl overflow-hidden border-2 border-muted shadow-lg">
                              <img
                                src={`/storage/${selectedHelpDesk.attachment}`}
                                alt="Ticket attachment"
                                className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => window.open(`/storage/${selectedHelpDesk.attachment}`, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="sm" className="font-bold text-[10px]">View Full Image</Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="font-bold text-xs flex gap-2 h-10 px-4"
                              onClick={() => window.open(`/storage/${selectedHelpDesk.attachment}`, '_blank')}
                            >
                              📄 Download Attached File
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ChatBox Integration */}
                    <div className="bg-muted/30 rounded-2xl p-4 lg:p-1 border border-primary/5 min-h-[400px]">
                      <ChatBox helpDeskId={selectedHelpDesk.id} status={selectedHelpDesk.status} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-primary/[0.02]">
                <Mail className="h-10 w-10 text-primary opacity-20" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Ticket Command Center</h2>
              <p className="text-sm text-muted-foreground max-w-[360px] font-medium leading-relaxed">
                Select an incoming helpdesk ticket from the left column to begin investigating, chatting, and applying resolutions.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}