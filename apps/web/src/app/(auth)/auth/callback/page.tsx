'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTokens } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Tokens arrive as hash fragment (#accessToken=...&refreshToken=...)
    // so they're not in server-accessible query params — only on the client.
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      // Clean the URL by removing the hash fragment
      window.location.hash = '';
      router.push('/feed');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary">
      <Spinner size="md" />
    </div>
  );
}
