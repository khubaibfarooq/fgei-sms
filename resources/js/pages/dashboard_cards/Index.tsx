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
interface DashboardCard {
  id: number;
  title: string;
  link: string;
  role_id: number;
  role?: { name: string };
}

interface PageProps {
  dashboardCards: {
    data: DashboardCard[];
    links: any[];
  };
  filters: {
    search: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'DashboardCards', href: '/dashboardcards' },
];

export default function DashboardCards({ dashboardCards, filters }: PageProps){
  const [search, setSearch] = useState(filters.search || '');

 
   const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        router.get('/dashboardcards', { ...filters, search }, { preserveScroll: true });
      }
    };
  const handleDelete = (id: number) => {
    router.delete(`/dashboardcards/${id}`, {
      onSuccess: () => toast.success('Dashboard Card  deleted successfully'),
      onError: () => toast.error('Dashboard Card to delete Building Type'),
    });
  };
 

  return (
   <AppLayout breadcrumbs={breadcrumbs}>
       <Head title="Dashboard Card " />
       <div className="flex-1 p-4 md:p-6">
         <Card>
           <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
             <div>
               <CardTitle className="text-2xl font-bold">Dashboard Cards</CardTitle>
               <p className="text-muted-foreground text-sm">Manage  Dashboard Cards</p>
             </div>
             <Link href="/dashboardcards/create">
               <Button>
                 <Plus className="h-4 w-4 mr-2" />
                 Add 
               </Button>
             </Link>
           </CardHeader>
 
           <Separator />
 
           <CardContent className="pt-6 space-y-6">
             {/* Search */}
             <div className="flex flex-col md:flex-row md:items-center gap-4">
               <Input
                 type="text"
                 placeholder="Search buildingTypes... (press Enter)"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 onKeyDown={handleSearchKey}
               />
             </div>
 
             {/* List */}
             <div className="space-y-3">
               {dashboardCards.data.length === 0 ? (
                 <p className="text-muted-foreground text-center">No buildingTypes found.</p>
               ) : (
                 dashboardCards.data.map((card) => (
                   <div
                     key={card.id}
                     className="flex items-center justify-between border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition"
                   >
                     <div className="space-y-1">
                       <div className="font-medium text-sm text-foreground">
                         {card.title}
                       </div>
                       <div className="text-xs text-muted-foreground">
                          {card.link} • {card.role ? card.role.name : 'N/A'}  
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <Link href={`/dashboardcards/${card.id}/edit`}>
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
                             <AlertDialogTitle>Delete this Card?</AlertDialogTitle>
                             <AlertDialogDescription>
                               Card <strong>{card.title}</strong> will be permanently deleted.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction
                               className="bg-destructive hover:bg-destructive/90"
                               onClick={() => handleDelete(card.id)}
                             >
                               Delete
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </div>
                   </div>
                 ))
               )}
             </div>
 
             {/* Pagination */}
             {dashboardCards.links.length > 1 && (
               <div className="flex justify-center pt-6 flex-wrap gap-2">
                 {dashboardCards.links.map((link, i) => (
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
