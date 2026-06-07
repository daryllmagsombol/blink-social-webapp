'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  online?: boolean;
  gradientBorder?: boolean;
  className?: string;
}

const sizeStyles = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const dotSizes = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

function AvatarContent({
  src,
  alt,
  size,
  initials,
  error,
  onError,
}: {
  src?: string;
  alt: string;
  size: NonNullable<AvatarProps['size']>;
  initials: string;
  error: boolean;
  onError?: () => void;
}) {
  if (!src || error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-brand/20 font-bold text-brand',
          sizeStyles[size],
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      className={cn('rounded-full object-cover', sizeStyles[size])}
    />
  );
}

function OnlineDot({ size }: { size: NonNullable<AvatarProps['size']> }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute bottom-0 right-0 rounded-full border-2 border-bg bg-success',
        dotSizes[size],
      )}
    />
  );
}

export function Avatar({ src, alt, size = 'md', fallback, online, gradientBorder, className }: AvatarProps) {
  const [error, setError] = useState(false);
  const initials =
    fallback ||
    alt
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const content = (
    <AvatarContent
      src={src}
      alt={alt}
      size={size}
      initials={initials}
      error={error}
      onError={() => setError(true)}
    />
  );

  if (gradientBorder) {
    return (
      <div className={cn('relative shrink-0', className)} role="img" aria-label={alt}>
        <div className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2.5px]">
          {content}
        </div>
        {online && <OnlineDot size={size} />}
      </div>
    );
  }

  return (
    <div className={cn('relative shrink-0', className)} role="img" aria-label={alt}>
      {content}
      {online && <OnlineDot size={size} />}
    </div>
  );
}
