import { cn } from '@/lib/utils';

interface CardProps {
  variant?: 'default' | 'interactive' | 'elevated';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'border border-border bg-bg',
  interactive: 'border border-border bg-bg hover:bg-bg-secondary cursor-pointer transition-colors',
  elevated: 'bg-bg shadow-lg border border-border/50',
};

export function Card({ variant = 'default', children, className, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn('rounded-lg', variantStyles[variant], className)}
    >
      {children}
    </Component>
  );
}
