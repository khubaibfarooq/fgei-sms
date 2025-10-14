import React, { useState, useRef, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayed?: number;
  className?: string;
  label?: string;
  error?: string;
}

// SVG Icons as React components
const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = ({ className = "w-3 h-3" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  disabled = false,
  maxDisplayed = 3,
  className = "",
  label,
  error
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange(newValue);
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getSelectedLabels = () => {
    return value.map(v => options.find(opt => opt.value === v)?.label || v);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <Select.Root open={open} onOpenChange={setOpen} disabled={disabled}>
        <Select.Trigger
          ref={triggerRef}
          className={`
            inline-flex items-center justify-between w-full px-3 py-2 text-sm
            bg-white border rounded-lg shadow-sm
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200 min-h-[42px]
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        >
          <div className="flex items-center flex-wrap gap-1 flex-1 min-w-0">
            {value.length > 0 ? (
              <>
                {getSelectedLabels().slice(0, maxDisplayed).map((label, index) => (
                  <span
                    key={value[index]}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={(e) => removeOption(value[index], e)}
                      className="ml-1 hover:text-blue-600 focus:outline-none"
                    >
                      <CrossIcon />
                    </button>
                  </span>
                ))}
                {value.length > maxDisplayed && (
                  <span className="text-gray-500 text-xs">
                    +{value.length - maxDisplayed} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 focus:outline-none"
                title="Clear all"
              >
                <CrossIcon className="w-4 h-4" />
              </button>
            )}
            <Select.Icon className="text-gray-500">
              <ChevronDownIcon />
            </Select.Icon>
          </div>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            position="popper"
            align="start"
            sideOffset={4}
          >
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
              <ChevronUpIcon />
            </Select.ScrollUpButton>
            
            <Select.Viewport className="p-2 max-h-64">
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={`
                      relative flex items-center px-8 py-2 text-sm rounded-md
                      focus:bg-blue-50 focus:outline-none focus:text-blue-900
                      ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                      transition-colors duration-150
                    `}
                    onPointerDown={(e) => {
                      if (!option.disabled) {
                        e.preventDefault();
                        toggleOption(option.value);
                      }
                    }}
                  >
                    <Select.ItemIndicator className="absolute left-2 w-4 h-4 inline-flex items-center justify-center">
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                );
              })}
              
              {options.length === 0 && (
                <div className="px-8 py-2 text-sm text-gray-500 text-center">
                  No options available
                </div>
              )}
            </Select.Viewport>
            
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
              <ChevronDownIcon />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect;