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
    <div className="date-time-picker">
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="date-time-picker__input"
        aria-label={placeholder}
      />

      {value && onClear ? (
        <button
          type="button"
          className="date-time-picker__clear"
          onClick={onClear}
          aria-label="Clear date and time"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
