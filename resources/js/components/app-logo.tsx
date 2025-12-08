import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';
import { cn } from '@/lib/utils';

export default function AppLogo({ className }: { className?: string }) {
  const setting = usePage().props.setting as {
    nama_app?: string;
    logo?: string;
  } | null;

  const defaultAppName = 'Laravel Starter Kit';
  const defaultLogo = '';

  const appName = setting?.nama_app || defaultAppName;
  const logo = setting?.logo || defaultLogo;

  return (
    <div className={cn("flex items-center gap-2 text-primary-foreground", className)}>
      {logo ? (
        <img
          src={`/assets/${logo}`}
          alt="Logo"
          className="h-12 w-12 rounded-md object-contain"
        />
      ) : (
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
          <AppLogoIcon className="size-[1.375rem] fill-current" />
        </div>
      )}
      <div className="grid flex-1 text-left text-sm">
        <span className="mb-0.5 truncate leading-none font-semibold">
          {appName}
        </span>
      </div>
    </div>
  );
}
