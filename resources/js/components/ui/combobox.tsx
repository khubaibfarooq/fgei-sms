import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface Option {
  id: string;
  name: string;
}

interface ComboboxProps {
  entity: string; // Prop to specify the entity type (e.g., 'institute', 'permission', 'role')
  value: string; // Selected value (e.g., institute ID as string)
  onChange: (value: string) => void; // Callback for value change
  options: Option[]; // Array of objects with id and name
  placeholder?: string; // Optional custom placeholder
  notFoundMessage?: string; // Optional custom not found message
  includeAllOption?: boolean; // Optional flag to include "All" option
  allOptionLabel?: string; // Optional label for "All" option
  disabled?: boolean; // Optional flag to disable the combobox
  className?: string; // Optional custom className for the trigger button
}

export default function Combobox({
  entity,
  value,
  onChange,
  options,
  placeholder,
  notFoundMessage,
  includeAllOption = false,
  allOptionLabel = `All ${entity}s`,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  // Default messages based on entity type
  const defaultPlaceholders: Record<string, string> = {
    institute: "Select Institute",
    permission: "Select permissions",
    role: "Select roles",
    user: "Select users",
    menu: "Select menus",
  };

  const defaultNotFoundMessages: Record<string, string> = {
    institute: "No institutes available",
    permission: "Permission not found",
    role: "Role not found",
    user: "User not found",
    menu: "Menu not found",
  };

  // Use custom messages if provided, otherwise fall back to defaults based on entity
  const buttonPlaceholder = placeholder || defaultPlaceholders[entity] || `Select ${entity}s`;
  const notFoundMsg = notFoundMessage || defaultNotFoundMessages[entity] || `${entity} not found`;
  const searchPlaceholder = `Search ${entity}...`;

  // Find the selected option's name for display
  const selectedOption = options.find((option) => option.id === value);

  // Custom filter function for "contains" search
  const filterOptions = (value: string, search: string) => {
    // Case-insensitive "contains" search
    if (value === "0" && includeAllOption) {
      // Always include the "All" option
      return 1;
    }
    return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate overflow-hidden">{value && selectedOption ? selectedOption.name : buttonPlaceholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full ps-2 max-h-60 overflow-y-auto">
        <CommandPrimitive filter={filterOptions} className="w-full">
          <CommandInput
            placeholder={searchPlaceholder}
            className="w-full h-10 px-3 text-sm border-b"
          />
          <CommandList >
            <CommandEmpty>{notFoundMsg}</CommandEmpty>
            <CommandGroup>
              {includeAllOption && (
                <CommandItem className="cursor-pointer hover:bg-gray-200 data-[selected=true]:bg-gray-200"
                  value="0"
                  onSelect={() => {
                    onChange("0");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "0" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {allOptionLabel}
                </CommandItem>
              )}
              {options.map((item) => (
                <CommandItem className="cursor-pointer hover:bg-primary/80 hover:text-white data-[selected=true]:bg-primary/80 data-[selected=true]:text-white my-1 flex flex-row"
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 mt-1 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} /> {item.name}

                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}