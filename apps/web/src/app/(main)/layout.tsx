'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react';

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

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/create', icon: PlusSquare, label: 'Create' },
    { href: '/notifications', icon: Heart, label: 'Notifications' },
    { href: user ? `/profile/${user.id}` : '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-bg-secondary">
      <aside className="hidden w-64 border-r border-border bg-bg p-6 md:block">
        <h1 className="mb-8 text-2xl font-bold">Blink Social</h1>
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-bg-secondary font-semibold' : 'hover:bg-bg-secondary'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3 px-3">
            <div className="h-8 w-8 rounded-full bg-primary/20" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-text-secondary truncate">{user?.displayName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="mt-4 w-full rounded px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-secondary"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-border bg-bg py-3 md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'text-primary' : 'text-text-secondary'}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
