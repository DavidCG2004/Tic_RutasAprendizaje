import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Spinner from './Spinner';

/**
 * Variantes de color del botón.
 *
 * Las variantes solo definen color, borde y sombra: el tamaño, el radio y el
 * foco viven en la base para que todos los botones se comporten igual.
 */
const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-2xs hover:shadow-primary-500/20',
  secondary:
    'bg-surface-100 text-surface-800 hover:bg-surface-200/80 active:bg-surface-200 border border-surface-200/80 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700 dark:border-surface-700',
  ghost:
    'bg-transparent text-surface-600 hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-surface-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-2xs',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-2xs',
} as const;

export type ButtonVariant = keyof typeof variants;

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
} as const;

export type ButtonSize = keyof typeof sizes;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra un spinner y bloquea el botón sin cambiar su ancho. */
  isLoading?: boolean;
  /** Ocupa todo el ancho del contenedor. */
  fullWidth?: boolean;
  /** Icono decorativo a la izquierda (se oculta mientras carga). */
  iconLeft?: ReactNode;
  /** Icono decorativo a la derecha (se oculta mientras carga). */
  iconRight?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className = '',
      children,
      isLoading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          'inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-control font-semibold',
          'transition-colors duration-200',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus/50 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" className="shrink-0" />
        ) : (
          iconLeft && <span className="shrink-0">{iconLeft}</span>
        )}
        {children}
        {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
