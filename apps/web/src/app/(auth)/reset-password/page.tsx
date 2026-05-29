'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password }, { skipAuth: true });
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
        <div className="w-full max-w-sm rounded border border-border bg-bg p-8 text-center">
          <p className="text-sm text-danger">Invalid reset link</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="rounded border border-border bg-bg p-8">
          <h1 className="mb-6 text-center text-2xl font-bold">Set New Password</h1>

          {error && (
            <div className="mb-4 rounded bg-danger/10 p-3 text-sm text-danger">{error}</div>
          )}

          {done ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-text-secondary">Password reset successfully</p>
              <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                Log in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
                className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
