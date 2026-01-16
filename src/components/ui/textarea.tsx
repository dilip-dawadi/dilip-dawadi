import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, style, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-xs px-3 py-2 text-sm transition-colors',
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

export { Textarea };
