import React from 'react';
import { Input } from '@/components/ui/input';

interface AmountInputProps {
  /** The actual value in base unit (Rs) */
  value: number | string;
  /** Called with the value in base unit (Rs) */
  onChange: (value: number | string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** Input className */
  inputClassName?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Minimum value */
  min?: number;
  /** Step value */
  step?: string | number;
  /** Input ID for label association */
  id?: string;
}

/**
 * AmountInput — a number input with a Rs / Mn toggle.
 *
 * When the user selects "Mn", the displayed value is in millions
 * but the onChange callback always returns the value in base unit (Rs).
 */
export function AmountInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  min,
  step,
  id,
}: AmountInputProps) {
  const [unit, setUnit] = React.useState<'Rs' | 'Mn'>('Rs');

  // Convert base value (Rs) → display value based on selected unit
  const displayValue = React.useMemo(() => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || value === '' || value === 0) return value;
    if (unit === 'Mn') {
      return parseFloat((num / 1_000_000).toFixed(6));
    }
    return value;
  }, [value, unit]);

  // Convert display value → base value (Rs) and call onChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange('');
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onChange(raw);
      return;
    }
    if (unit === 'Mn') {
      onChange(Math.round(num * 1_000_000));
    } else {
      onChange(num);
    }
  };

  // When toggling unit, we don't change the underlying value — only the display
  const handleUnitChange = (newUnit: 'Rs' | 'Mn') => {
    setUnit(newUnit);
  };

  return (
    <div className={`flex items-stretch ${className}`}>
      <Input
        id={id}
        type="number"
        min={min}
        step={unit === 'Mn' ? '0.01' : (step ?? '1')}
        value={displayValue === '' ? '' : displayValue}
        onChange={handleChange}
        placeholder={unit === 'Mn' ? '0.00 Mn' : placeholder}
        disabled={disabled}
        required={required}
        className={`rounded-r-none border-r-0 ${inputClassName}`}
      />
      <div className="inline-flex rounded-r-md border border-input overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => handleUnitChange('Rs')}
          className={`px-2.5 text-xs font-semibold transition-colors focus:outline-none ${
            unit === 'Rs'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          Rs
        </button>
        <button
          type="button"
          onClick={() => handleUnitChange('Mn')}
          className={`px-2.5 text-xs font-semibold transition-colors focus:outline-none border-l border-input ${
            unit === 'Mn'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          Mn
        </button>
      </div>
    </div>
  );
}
