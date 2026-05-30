'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/feed');
  }, [isAuthenticated, router]);

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
        <div className="rounded-lg border border-border bg-bg p-8">
          <div className="mb-6 flex justify-center">
            <img src="/images/blink-social-logo.png" alt="Blink Social" className="h-16 w-auto" />
          </div>
          <p className="mb-4 text-center text-sm text-text-secondary">
            Sign up to see photos from your friends.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              required
              minLength={3}
              autoFocus
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
            />
            <Input
              type="text"
              placeholder="Full name (optional)"
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign up
            </Button>
          </form>
        </div>

        <div className="mt-2 rounded-lg border border-border bg-bg p-4 text-center text-sm">
          Have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
