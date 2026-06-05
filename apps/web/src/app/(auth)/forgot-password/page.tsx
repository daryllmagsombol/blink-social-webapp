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
      <div className="w-full max-w-sm animate-scale-in">
        <div className="rounded-lg border border-border bg-bg shadow-lg overflow-hidden">
          {/* Brand gradient header */}
          <div className="bg-gradient-to-r from-[#FF2BA6] via-[#8A2EFF] to-[#00B7FF] px-8 py-6 text-center">
            <h1 className="text-xl font-bold text-white">Blink Social</h1>
            <p className="mt-1 text-sm text-white/80">Share your world in a blink</p>
          </div>

          <div className="p-8">
            <h2 className="mb-2 text-center text-2xl font-bold text-brand">Reset Password</h2>
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
        </div>

        <div className="mt-3 rounded-lg border border-border bg-bg p-4 text-center text-sm shadow-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
