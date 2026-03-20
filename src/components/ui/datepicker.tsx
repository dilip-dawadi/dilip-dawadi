'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar1 } from 'lucide-react';

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

type DatePickerWithLabelProps = DatePickerProps & {
  fieldTitle: string;
};

type TimePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

type TimePickerWithLabelProps = TimePickerProps & {
  fieldTitle: string;
};

function toLocalDateValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function parseLocalDateValue(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function DatePicker({
  id,
  value,
  onChange,
  className,
  disabled,
  placeholder = 'Select date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseLocalDateValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-12 w-full justify-between gap-2 text-left font-normal! bg-bg hover:bg-bg cursor-pointer whitespace-nowrap',
            !selectedDate && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">
            {selectedDate ? selectedDate.toLocaleDateString() : placeholder}
          </span>
          <Calendar1 className="ml-auto h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-1rem)] overflow-x-auto overflow-y-hidden rounded-xs border border-(--color-border) bg-bg-alt p-0 shadow-xl"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          captionLayout="dropdown"
          startMonth={new Date(2025, 0, 1)}
          endMonth={new Date(2040, 11, 31)}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (!date) {
              return;
            }

            onChange(toLocalDateValue(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerWithLabel({
  fieldTitle,
  id,
  className,
  ...props
}: DatePickerWithLabelProps) {
  return (
    <div className="relative w-full">
      <Label
        htmlFor={id}
        className="absolute left-3 top-[-0.55rem] z-10 bg-bg-alt px-1 text-xs font-medium tracking-wider"
        style={{ color: 'var(--color-fg-light)' }}
      >
        {fieldTitle}
      </Label>
      <DatePicker id={id} className={className} {...props} />
    </div>
  );
}

export function TimePicker({
  id,
  value,
  onChange,
  step = 60,
  className,
  disabled,
  placeholder,
}: TimePickerProps) {
  return (
    <Input
      id={id}
      type="time"
      step={step}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
        className,
      )}
    />
  );
}

export function TimePickerWithLabel({
  fieldTitle,
  id,
  className,
  ...props
}: TimePickerWithLabelProps) {
  return (
    <div className="relative w-full">
      <Label
        htmlFor={id}
        className="absolute left-3 top-[-0.55rem] z-10 bg-bg-alt px-1 text-xs font-medium tracking-wider"
        style={{ color: 'var(--color-fg-light)' }}
      >
        {fieldTitle}
      </Label>
      <TimePicker id={id} className={className} {...props} />
    </div>
  );
}
