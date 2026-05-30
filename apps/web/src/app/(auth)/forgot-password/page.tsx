'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email }, { skipAuth: true });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-border bg-bg p-8">
          <div className="mb-6 flex justify-center">
            <img src="/images/blink-social-logo.png" alt="Blink Social" className="h-16 w-auto" />
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-brand">Reset Password</h1>
          <p className="mb-6 text-center text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>
          )}

          {sent ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-text-secondary">
                If an account with that email exists, a reset link has been sent. Check the server console for the link (dev mode).
              </p>
              <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <div className="mt-2 rounded-lg border border-border bg-bg p-4 text-center text-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
