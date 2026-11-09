import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const variants = {
  default:
    'bg-surface-100 text-surface-700 border border-surface-200/80 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700',
  brand:
    'bg-brand-50 text-brand-700 border border-brand-200/80 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20',
  primary:
    'bg-primary-100 text-primary-700 border border-primary-200/80 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500/20',
  success:
    'bg-emerald-100 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/20',
  warning:
    'bg-amber-100 text-amber-700 border border-amber-200/80 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500/20',
  danger:
    'bg-red-100 text-red-700 border border-red-200/80 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/20',
  accent:
    'bg-accent-100 text-accent-700 border border-accent-200/80 dark:bg-accent-900/30 dark:text-accent-300 dark:border-accent-500/20',
} as const;

export type BadgeVariant = keyof typeof variants;

const sizes = {
  sm: 'px-2 py-0.5 text-2xs gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
} as const;

export type BadgeSize = keyof typeof sizes;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Punto de estado a la izquierda; hereda el color del texto. */
  dot?: boolean;
}

const Badge = ({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

export default Badge;
