import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-bg-secondary text-text-secondary border border-border',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent/10 text-accent',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
