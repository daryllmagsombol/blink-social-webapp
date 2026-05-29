'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { Home, Search, PlusSquare, Heart, User, LogOut, MessageCircle } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout, fetchMe } = useAuth();
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
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
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/create', icon: PlusSquare, label: 'Create' },
    { href: '/notifications', icon: Heart, label: 'Notifications' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: user ? `/profile/${user.id}` : '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-bg-secondary">
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-64 border-r border-border bg-bg p-6 md:flex md:flex-col">
        <Link href="/feed">
          <h1 className="mb-8 text-2xl font-bold hover:text-primary transition-colors">Blink Social</h1>
        </Link>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-bg-secondary font-semibold text-primary'
                    : 'text-text hover:bg-bg-secondary hover:text-text'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-border">
          <Link href={user ? `/profile/${user.id}` : '/profile'} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-bg-secondary transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-xs font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-text-secondary truncate">{user?.displayName || user?.email}</p>
            </div>
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-bg py-2 md:hidden">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                active ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
