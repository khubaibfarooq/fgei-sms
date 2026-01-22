import * as React from 'react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** URL to navigate to when the card is clicked */
  redirectLink?: string;
  /** Icon to display on the right middle of the card */
  icon?: keyof typeof LucideIcons;
  /** Number to display on the left top of the card */
  number?: string | number;
  /** Title to display below the number */
  title?: string;
  /** Background color for icon (e.g., '#3b82f6') */
  iconBgColor?: string;
  changeColorOnHover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      redirectLink,
      onClick,
      icon,
      number,
      title,
      iconBgColor = '#3b82f6',
      children,
      changeColorOnHover = false,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false); // { changed code }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);

      if (redirectLink) {
        if (!e.defaultPrevented) {
          router.visit(redirectLink);
        }
      }
    };

    // Get the icon component if provided
    const IconComponent = icon
      ? (LucideIcons[icon] as unknown as React.ComponentType<React.SVGProps<SVGSVGElement>>)
      : null;

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)} // { changed code }
        onMouseLeave={() => setIsHovered(false)} // { changed code }
        className={cn(
          'rounded-lg border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-900',
          'overflow-hidden relative border-1 border-primary/50',

          'hover:shadow-lg  dark:hover:border-gray-600',

          'cursor-pointer',
          'p-2 md:p-5',
          'shadow-sm',
          className
        )}
        style={{
          backgroundColor: isHovered && changeColorOnHover ? iconBgColor + '20' : 'transparent', // { changed code }
          transition: 'background-color 0.3s ease-in-out',
        }}
        {...props}
      >
        <div className="flex items-start justify-between  md:gap-4">
          {/* Left side - Number and Title */}
          <div className="flex flex-col gap-1">
            {/* Title above number */}
            {title && (
              <div className="text-xs md:text-sm text-black dark:text-gray-400 font-semibold uppercase tracking-wide">
                {title}
              </div>
            )}

            {/* Number */}
            {number !== undefined && (
              <div className=" text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                {number}
              </div>
            )}
          </div>

          {/* Icon on right with colored background */}
          {IconComponent && (
            <div
              className={cn(
                'p-3 rounded-lg',
                'flex items-center justify-center',
                'text-white text-xl border-2',
                'flex-shrink-0',
                'transition-all duration-300'
              )}
              style={{
                backgroundColor: iconBgColor + '20',
                color: iconBgColor,
                borderColor: iconBgColor,
              }}
            >
              <IconComponent className="md:h-6 md:w-6 h-4 w-4" />
            </div>
          )}
        </div>

        {/* Card content */}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-2xl font-bold leading-none tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };