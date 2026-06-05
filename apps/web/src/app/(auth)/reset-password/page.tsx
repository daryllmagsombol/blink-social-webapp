'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
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
        <div className="w-full max-w-sm animate-scale-in">
          <div className="rounded-lg border border-border bg-bg p-8 text-center shadow-lg">
            <p className="text-sm text-danger">Invalid reset link</p>
            <Link href="/forgot-password" className="mt-4 inline-block text-sm text-primary hover:underline">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="rounded-lg border border-border bg-bg shadow-lg overflow-hidden">
          {/* Brand gradient header */}
          <div className="bg-gradient-to-r from-[#FF2BA6] via-[#8A2EFF] to-[#00B7FF] px-8 py-6 text-center">
            <h1 className="text-xl font-bold text-white">Blink Social</h1>
            <p className="mt-1 text-sm text-white/80">Share your world in a blink</p>
          </div>

          <div className="p-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-brand">Set New Password</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>
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
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Reset password
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
