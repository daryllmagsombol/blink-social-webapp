'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useTheme } from '@/components/ui/ThemeProvider';
import { UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { MatIcon } from '@/components/ui/Icon';
import { LogOut, Sun, Moon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface SidebarNavProps {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
}

export function SidebarNav({ navItems, isActive }: SidebarNavProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-[244px] border-r border-border bg-bg lg:flex lg:flex-col">
      <div className="flex flex-col h-full px-3 py-3">
        {/* Brand */}
        <Link href="/feed" className="flex items-center gap-2 px-3 py-5 mb-3">
          <h1 className="text-[22px] font-bold bg-gradient-to-r from-accent via-brand to-primary bg-clip-text text-transparent">
            Blink
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-4 rounded-xl px-3 py-3 text-sm transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-text hover:bg-bg-secondary'
                }`}
              >
                <MatIcon icon={item.icon} filled={active} />
                <span className="leading-[18px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="pt-3 mt-auto border-t border-border">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm text-text-secondary hover:bg-bg-secondary transition-all duration-150"
          >
            {theme === 'dark' ? (
              <Sun className="h-[22px] w-[22px]" />
            ) : (
              <Moon className="h-[22px] w-[22px]" />
            )}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* User profile */}
          <Link
            href={user ? `/profile/${user.id}` : '/profile'}
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-bg-secondary transition-all duration-150 mt-0.5"
          >
            <Avatar
              src={user?.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
              alt={user?.username || '?'}
              size="sm"
              fallback={user?.username?.[0]?.toUpperCase() || '?'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-[18px] truncate">{user?.username}</p>
              <p className="text-xs text-text-secondary leading-[16px] truncate">{user?.displayName || user?.email}</p>
            </div>
          </Link>

          {/* Log out */}
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm text-text-secondary hover:bg-bg-secondary transition-all duration-150 mt-0.5"
          >
            <LogOut className="h-[22px] w-[22px]" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
