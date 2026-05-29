'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        displayName: form.displayName || undefined,
      });
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="rounded border border-border bg-bg p-8">
          <h1 className="mb-6 text-center text-3xl font-bold">Blink Social</h1>
          <p className="mb-4 text-center text-sm text-text-secondary">
            Sign up to see photos from your friends.
          </p>

          {error && (
            <div className="mb-4 rounded bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              required
              minLength={3}
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary"
            />
            <input
              type="text"
              placeholder="Full name (optional)"
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        </div>

        <div className="mt-2 rounded border border-border bg-bg p-4 text-center text-sm">
          Have an account?{' '}
          <Link href="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
