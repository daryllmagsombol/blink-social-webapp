'use client';

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/feed');
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="rounded border border-border bg-bg p-8">
          <h1 className="mb-6 text-center text-3xl font-bold">Blink Social</h1>

          {error && (
            <div className="mb-4 rounded bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Logging in...
                </span>
              ) : 'Log in'}
            </button>
          </form>
        </div>

        <div className="mt-2 rounded border border-border bg-bg p-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
