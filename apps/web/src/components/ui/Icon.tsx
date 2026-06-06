import { type HTMLAttributes } from 'react';

interface MatIconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: string;
  filled?: boolean;
}

export function MatIcon({ icon, filled = false, className = '', ...props }: MatIconProps) {
  return (
    <span
      className={`material-symbols-outlined text-[22px] ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
      {...props}
    >
      {icon}
    </span>
  );
}
