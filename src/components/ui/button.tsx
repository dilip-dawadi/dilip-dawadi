import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--color-accent)] text-[var(--color-white)] hover:bg-[var(--color-accent-hover)] shadow-sm',
  destructive:
    'border border-[color-mix(in_srgb,#dc2626_60%,var(--color-border))] bg-[var(--color-bg)] text-[color-mix(in_srgb,#dc2626_72%,var(--color-fg))] hover:bg-[color-mix(in_srgb,#dc2626_12%,var(--color-bg))] shadow-sm',
  outline:
    'border border-[var(--color-border)] bg-[var(--color-bg-offset)] text-[var(--color-fg)] hover:bg-[var(--color-bg-alt)]',
  secondary:
    'bg-[var(--color-bg-alt)] text-[var(--color-fg)] hover:bg-[var(--color-bg-offset)] border border-[var(--color-border)]',
  ghost: 'text-[var(--color-fg)] hover:bg-[var(--color-bg-alt)]',
  link: 'text-[var(--color-accent)] underline-offset-4 hover:underline bg-transparent p-0 h-auto',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xs px-4 text-[0.82rem] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});

export { Button };
