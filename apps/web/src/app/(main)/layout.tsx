'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useTheme } from '@/components/ui/ThemeProvider';
import { UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LogOut, Sun, Moon } from 'lucide-react';

function MatIcon({ icon, filled = false }: { icon: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-[22px]"
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {icon}
    </span>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout, fetchMe } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-secondary">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent via-brand to-primary bg-clip-text text-transparent">
            Blink
          </h1>
          <Spinner size="lg" className="text-brand" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    if (href.startsWith('/profile')) return pathname.startsWith('/profile');
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: '/feed', icon: 'home', label: 'Feed' },
    { href: '/search', icon: 'search', label: 'Search' },
    { href: '/explore', icon: 'explore', label: 'Explore' },
    { href: '/create', icon: 'add_box', label: 'Create' },
    { href: '/notifications', icon: 'favorite', label: 'Notifications' },
    { href: '/messages', icon: 'chat', label: 'Messages' },
    { href: '/bookmarks', icon: 'bookmark', label: 'Saved' },
    { href: user ? `/profile/${user.id}` : '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-bg-secondary">
      {/* Desktop Sidebar */}
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
                  className={`group flex items-center gap-4 rounded-xl px-3 py-3 text-[14px] transition-all duration-150 ${
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
              className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-[14px] text-text-secondary hover:bg-bg-secondary transition-all duration-150"
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
                <p className="text-[14px] font-medium leading-[18px] truncate">{user?.username}</p>
                <p className="text-[12px] text-text-secondary leading-[16px] truncate">{user?.displayName || user?.email}</p>
              </div>
            </Link>

            {/* Log out */}
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-[14px] text-text-secondary hover:bg-bg-secondary transition-all duration-150 mt-0.5"
            >
              <LogOut className="h-[22px] w-[22px]" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[244px] animate-fade-in min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-bg px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2 lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-150 ${
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
              {active && (
                <span className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-[60px] lg:hidden" />
    </div>
  );
}
