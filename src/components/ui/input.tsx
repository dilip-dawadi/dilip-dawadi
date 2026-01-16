import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, style, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-12 w-full rounded-xs px-3 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'placeholder:opacity-50',
        className,
      )}
      style={
        {
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-fg)',
          '--tw-ring-color': 'var(--color-accent-light)',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Input };
