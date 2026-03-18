import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  onClear,
  placeholder = 'Select date and time',
}: DateTimePickerProps) {
  return (
    <div className="date-time-picker flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="date-time-picker__input w-full min-w-0"
        aria-label={placeholder}
      />

      {value && onClear ? (
        <button
          type="button"
          className="date-time-picker__clear h-12 shrink-0 rounded-xs border px-3 text-sm font-medium transition-colors hover:opacity-90 sm:w-auto"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-fg)',
          }}
          onClick={onClear}
          aria-label="Clear date and time"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
