'use client';

import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { MatIcon } from '@/components/ui/Icon';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface MobileBottomNavProps {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
}

export function MobileBottomNav({ navItems, isActive }: MobileBottomNavProps) {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-bg px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden landscape:hidden">
      {navItems.slice(0, 5).map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-150 ${
              active ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            {item.icon === 'person' && user ? (
              <div className={`rounded-full p-[2px] ${active ? 'bg-primary' : ''}`}>
                <Avatar
                  src={user.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
                  alt={user.username}
                  size="xs"
                  className={`${active ? 'ring-2 ring-white' : ''}`}
                  fallback={user.username[0]?.toUpperCase()}
                />
              </div>
            ) : (
              <MatIcon icon={item.icon} filled={active} />
            )}
            <span className="text-[10px] truncate max-w-[60px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
