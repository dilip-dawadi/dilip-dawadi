import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CheckboxWithLabelProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'>;

export function CheckboxWithLabel({
  label,
  checked,
  onCheckedChange,
  className,
  inputClassName,
  disabled,
  id,
  ...props
}: CheckboxWithLabelProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-2 rounded-xs h-12 border px-3 py-1.5 text-sm',
        'border-(--color-border) bg-bg text-(--color-fg)',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className={cn(
          'h-4 w-4 rounded-[3px] border border-(--color-border) bg-bg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)',
          inputClassName,
        )}
        style={{ accentColor: 'var(--color-accent)' }}
        {...props}
      />
      {label}
    </label>
  );
}
