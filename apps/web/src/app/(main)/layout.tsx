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
import { Home, Search, PlusSquare, Heart, User, LogOut, MessageCircle, Hash, Bookmark, Sun, Moon } from 'lucide-react';

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
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/explore', icon: Hash, label: 'Explore' },
    { href: '/create', icon: PlusSquare, label: 'Create' },
    { href: '/notifications', icon: Heart, label: 'Notifications' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/bookmarks', icon: Bookmark, label: 'Saved' },
    { href: user ? `/profile/${user.id}` : '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-bg-secondary">
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-64 border-r border-border bg-bg p-6 md:flex md:flex-col">
        <Link href="/feed">
          <h1 className="mb-8 text-2xl font-bold bg-gradient-to-r from-accent via-brand to-primary bg-clip-text text-transparent">
            Blink
          </h1>
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-text hover:bg-bg-secondary hover:text-text'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform duration-150 ${
                  active ? 'text-primary' : 'group-hover:scale-110'
                }`} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-border">
          <Link
            href={user ? `/profile/${user.id}` : '/profile'}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-bg-secondary transition-all duration-150"
          >
            <Avatar
              src={user?.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
              alt={user?.username || '?'}
              size="sm"
              fallback={user?.username?.[0]?.toUpperCase() || '?'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-text-secondary truncate">{user?.displayName || user?.email}</p>
            </div>
          </Link>
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="md"
            icon={theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            className="mt-1 w-full justify-start gap-3 px-3 py-2.5 text-sm text-text-secondary"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button
            onClick={() => { logout(); router.push('/login'); }}
            variant="ghost"
            size="md"
            icon={<LogOut className="h-5 w-5" />}
            className="mt-1 w-full justify-start gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-danger transition-all duration-150"
          >
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 animate-fade-in">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-bg px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1 md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-150 ${
                active ? 'text-primary' : 'text-text-secondary hover:text-text'
              }`}
            >
              <item.icon className={`h-6 w-6 transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <span className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Floating Create Button (mobile) */}
      <Link
        href="/create"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent via-brand to-primary text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-brand/30 active:scale-95 md:hidden"
        aria-label="Create post"
      >
        <PlusSquare className="h-6 w-6" />
      </Link>
    </div>
  );
}
