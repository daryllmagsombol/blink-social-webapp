'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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
        <div className="rounded border border-border bg-bg p-8">
          <h1 className="mb-2 text-center text-2xl font-bold">Reset Password</h1>
          <p className="mb-6 text-center text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="mb-4 rounded bg-danger/10 p-3 text-sm text-danger">{error}</div>
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
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-2 rounded border border-border bg-bg p-4 text-center text-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
