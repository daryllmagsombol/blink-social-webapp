'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { Spinner } from '@/components/ui/Spinner';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, fetchMe } = useAuth();
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
      <SidebarNav navItems={navItems} isActive={isActive} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[244px] animate-fade-in min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav navItems={navItems} isActive={isActive} />

      {/* Spacer for mobile bottom nav */}
      <div className="h-[60px] lg:hidden" />
    </div>
  );
}
