import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import AppearanceDropdown from '@/components/appearance-dropdown';
import { NotificationDropdown } from './notification-dropdown';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
  const [lang, setLang] = useState('id');
  const { can_view_notifications } = usePage<{ can_view_notifications: boolean }>().props;

  return (
    <header className="bg-primary dark:bg-sidebar-accent border-sidebar-border/50 flex h-16 sticky top-0 z-[100] w-full
     shrink-0 items-center justify-between px-4 md:px-6 border-b transition-all ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/* Left: Sidebar + Breadcrumb */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 cursor-pointer" />
        <div className="hidden sm:block">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      </div>

      {/* Right: Language + Theme */}
      <div className="flex items-center gap-4">

        {can_view_notifications && <NotificationDropdown />}
        <AppearanceDropdown />
        <NavUser />
      </div>
    </header>
  );
}
