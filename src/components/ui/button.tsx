import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--color-accent)] text-[var(--color-white)] hover:bg-[var(--color-accent-hover)] shadow-sm',
  destructive:
    'border bg-[color-mix(in_srgb,#dc2626_10%,var(--color-bg))] border-[color-mix(in_srgb,#dc2626_42%,var(--color-border))] text-[color-mix(in_srgb,#dc2626_78%,var(--color-fg))] hover:bg-[color-mix(in_srgb,#dc2626_22%,var(--color-bg))] shadow-sm',
  outline:
    'border border-[var(--color-border)] bg-[var(--color-bg-offset)] text-[var(--color-fg)] hover:bg-[var(--color-bg-alt)]',
  secondary:
    'bg-[var(--color-bg-alt)] text-[var(--color-fg)] hover:bg-[var(--color-bg-offset)] border border-[var(--color-border)]',
  ghost: 'text-[var(--color-fg)] hover:bg-[var(--color-bg-alt)]',
  link: 'text-[var(--color-accent)] underline-offset-4 hover:underline bg-transparent p-0 h-auto',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 text-[0.82rem]',
  sm: 'h-8 px-4 text-[0.75rem]',
  lg: 'h-11 px-5 text-[0.9rem]',
  icon: 'h-9 w-9 px-0',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-size={size}
      className={cn(
        'inline-flex items-center justify-center rounded-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});

export { Button };
