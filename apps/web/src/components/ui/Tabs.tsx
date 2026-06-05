'use client';

import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

const variantStyles = {
  underline: {
    list: 'border-b border-border',
    tab: (active: boolean) =>
      cn(
        'border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200 -mb-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-text-secondary hover:text-text hover:border-border',
      ),
  },
  pill: {
    list: 'gap-1',
    tab: (active: boolean) =>
      cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
        active
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:text-text hover:bg-bg-secondary',
      ),
  },
};

export function Tabs({ tabs, value, onChange, variant = 'underline', className }: TabsProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('flex', styles.list, className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={styles.tab(tab.value === value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
