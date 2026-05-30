'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg p-12 text-center">
      {icon && <span className="mb-3 text-4xl">{icon}</span>}
      <p className="font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      )}
      {action && action.href && (
        <Link
          href={action.href}
          className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white"
        >
          {action.label}
        </Link>
      )}
      {action && action.onClick && !action.href && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
