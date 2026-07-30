import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({
  className,
  variant = 'primary',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover',
        variant === 'secondary' &&
          'border border-brand-border bg-white text-brand-foreground hover:bg-brand-primary-light',
        variant === 'ghost' && 'text-brand-muted hover:bg-brand-primary-light hover:text-brand-foreground',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
