// app-sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuItemCollapsible,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { usePage, Link } from '@inertiajs/react';
import AppLogo from './app-logo';
import { iconMapper } from '@/lib/iconMapper';
import type { LucideIcon } from 'lucide-react';

interface MenuItem {
  id: number;
  title: string;
  route: string | null;
  icon: string;
  children?: MenuItem[];
}

function RenderMenu({ items, level = 0 }: { items: MenuItem[]; level?: number }) {
  const { url: currentUrl } = usePage();

  if (!Array.isArray(items)) return null;

  return (
    <>
      {items.map((menu) => {
        if (!menu) return null;

        const Icon = iconMapper(menu.icon || 'Folder') as LucideIcon;
        const children = Array.isArray(menu.children) ? menu.children.filter(Boolean) : [];
        const hasChildren = children.length > 0;

        const isActive = menu.route ? currentUrl.startsWith(menu.route) : false;

        if (!menu.route && !hasChildren) return null;

        return (
          <SidebarMenuItem key={menu.id}>
            {hasChildren ? (
              <SidebarMenuItemCollapsible
                title={menu.title}
                icon={<Icon className={cn('size-5', isActive && 'text-white')} />}
                defaultOpen={true}
                className={cn(
                  'w-full  rounded-lg transition-all duration-200 font-bold ',
                  isActive
                    ? 'bg-primary/80 text-lg text-white shadow-sm'
                    : 'text-foreground text-lg hover:bg-muted/60'
                )}
              >
                {children.map((child) => {
                  if (!child?.route) return null;
                  const ChildIcon = iconMapper(child.icon || 'Circle') as LucideIcon;
                  const childActive = currentUrl.startsWith(child.route);

                  return (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton asChild>
                        <Link
                          href={child.route}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-lg font-bold transition-all duration-200',
                            childActive
                              ? 'bg-primary/80 text-white shadow-sm'
                              : 'text-black hover:bg-primary/10'
                          )}
                        >
                          <ChildIcon className={cn('size-5', childActive && 'text-white')} />
                          <span>{child.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuItemCollapsible>
            ) : (
              /* Fixed: Menu item WITHOUT children → now properly styled when active */
              <SidebarMenuButton
                asChild
                className={cn(
                  'w-full justify-start rounded-lg px-4 py-3 text-lg font-bold transition-all duration-200',
                  isActive
                    ? 'bg-primary/80 text-white shadow-sm'
                    : 'text-black hover:bg-primary/10'
                )}
              >
                <Link href={menu.route || '#'}>
                  <Icon className={cn('mr-3 size-5', isActive && 'text-white')} />
                  <span>{menu.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
export function AppSidebar() {
  const { menus = [] } = usePage().props as { menus?: MenuItem[] };

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r">
      {/* Logo Header */}
      <SidebarHeader className="bg-primary px-6 py-5 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-primary/90 h-8">
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="gap-2">
          <RenderMenu items={menus} />
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}