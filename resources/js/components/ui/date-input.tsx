// components/ui/date-input.tsx
import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Input } from '@/components/ui/input';
import "react-datepicker/dist/react-datepicker.css";
import { cn } from '@/lib/utils';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({className, value, onChange, placeholder = "DD/MM/YYYY", ...props }, ref) => {
    
   const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  console.log('Parsing date:', dateString);
  
  // Handle YYYY-MM-DD format (from your backend)
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    console.log('Date parts:', parts);
    if (parts.length === 3) {
      // YYYY-MM-DD format: parts[0] = year, parts[1] = month, parts[2] = day
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  
  // Handle DD/MM/YYYY format (from your input)
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    console.log('Date parts:', parts);
    if (parts.length === 3) {
      // DD/MM/YYYY format: parts[0] = day, parts[1] = month, parts[2] = year
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }
  
  return null;
};

    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const handleChange = (date: Date | null) => {
      if (date) {
        onChange(formatDate(date));
      } else {
        onChange('');
      }
    };

    return (
      <DatePicker
        selected={parseDate(value)}
        onChange={handleChange}
        dateFormat="dd/MM/yyyy"
        customInput={<Input ref={ref} placeholder={placeholder} {...props} />}
        showPopperArrow={false}
        placeholderText={placeholder}
         className={cn(
                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                        className,
                    )}
      />
    );
  }
);

DateInput.displayName = 'DateInput';

export { DateInput };