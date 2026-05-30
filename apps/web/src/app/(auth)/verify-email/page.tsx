'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    api.post(`/auth/verify-email?token=${token}`, undefined, { skipAuth: true })
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm rounded border border-border bg-bg p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-text-secondary">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <h1 className="text-lg font-bold">Email Verified</h1>
            <p className="text-sm text-text-secondary">{message}</p>
            <Link href="/login" className="mt-4 rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
              Log in
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-10 w-10 text-danger" />
            <h1 className="text-lg font-bold">Verification Failed</h1>
            <p className="text-sm text-text-secondary">{message}</p>
            <Link href="/login" className="mt-4 text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
