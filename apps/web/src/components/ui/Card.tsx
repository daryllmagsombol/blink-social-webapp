import { cn } from '@/lib/utils';

interface CardProps {
  variant?: 'default' | 'interactive' | 'elevated';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const variantStyles = {
  default: 'border border-border bg-bg',
  interactive:
    'border border-border bg-bg hover:bg-bg-secondary hover:-translate-y-0.5 hover:shadow-md cursor-pointer transition-all duration-200',
  elevated:
    'bg-bg shadow-lg border border-border/50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200',
};

export function Card({ variant = 'default', children, className, style, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      style={style}
      className={cn(
        'rounded-lg text-left',
        variantStyles[variant],
        onClick && 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </Component>
  );
}
