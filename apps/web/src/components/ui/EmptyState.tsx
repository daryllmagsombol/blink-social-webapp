'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-border bg-bg p-12 text-center">
      {icon && <span className="text-4xl mb-3">{icon}</span>}
      <p className="text-text-secondary font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 rounded bg-primary px-4 py-1.5 text-sm font-semibold text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
