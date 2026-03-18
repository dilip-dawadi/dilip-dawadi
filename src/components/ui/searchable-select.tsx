import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faMagnifyingGlass, faSort } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  id: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  options?: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  returnType?: 'id' | 'label';
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  id,
  options = [],
  value,
  onChange,
  placeholder = 'Select option',
  height = 'h-12',
  returnType = 'id',
  searchable = false,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption =
    returnType === 'id'
      ? options.find((option) => option.id === value)
      : options.find((option) => option.label === value);

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(option: SearchableSelectOption) {
    onChange(returnType === 'id' ? option.id : option.label);
    setOpen(false);
    setSearch('');
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'searchable-select-trigger w-full cursor-pointer flex items-center justify-between px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:border-transparent data-[state=open]:ring-2 data-[state=open]:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            height,
            className,
          )}
          style={
            {
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-fg)',
              '--tw-ring-color': 'var(--color-accent-light)',
            } as React.CSSProperties
          }
          aria-expanded={open}
        >
          <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FontAwesomeIcon icon={faSort as IconProp} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          avoidCollisions={false}
          className="searchable-select-content z-300 min-w-(--radix-popover-trigger-width) w-(--radix-popover-trigger-width) overflow-hidden p-0"
          style={
            {
              zIndex: 300,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
            } as React.CSSProperties
          }
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div
            className={cn(
              'searchable-select-search flex items-center gap-2 px-3 py-2',
              !searchable && 'hidden',
            )}
          >
            <FontAwesomeIcon
              icon={faMagnifyingGlass as IconProp}
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
            ) : (
              filtered.map((option) => {
                const isSelected =
                  returnType === 'id' ? value === option.id : value === option.label;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      'searchable-select-option w-full cursor-pointer px-3 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
                      isSelected
                        ? 'searchable-select-option--selected font-medium'
                        : 'searchable-select-option--default',
                    )}
                  >
                    {option.label}
                    {isSelected && (
                      <FontAwesomeIcon
                        icon={faCheck as IconProp}
                        className="ml-2 h-4 w-4 shrink-0 text-accent"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
