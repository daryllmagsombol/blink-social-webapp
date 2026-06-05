'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Parallax state
  const phoneRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [heroMousePos, setHeroMousePos] = useState({ x: 0, y: 0 });

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

  function handleHeroMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!phoneRef.current) return;
    const rect = phoneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 8;
    const rotateX = ((centerY - y) / centerY) * 8;
    setRotation({ x: rotateX, y: rotateY });
    setHeroMousePos({ x: e.clientX, y: e.clientY });
  }

  function handleHeroMouseLeave() {
    setRotation({ x: 0, y: 0 });
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* ===== Fixed Top Nav ===== */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-text"
          >
            <span className="bg-gradient-to-r from-primary via-brand to-accent bg-clip-text text-transparent">
              Blink
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/about"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              About
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              Help
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              Terms
            </Link>
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm font-semibold text-text-secondary">
              Log In
            </span>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-5">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex flex-1 pt-14">
        <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col md:flex-row">
          {/* ---- Left: Hero Visual (hidden on mobile) ---- */}
          <div
            className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden md:flex"
            style={{
              background:
                'linear-gradient(135deg, #1b1c1c 0%, #002b4d 100%)',
            }}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            {/* Decorative blur circles */}
            <div
              className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-20"
              style={{
                background:
                  'radial-gradient(circle, #00B7FF 0%, transparent 70%)',
                filter: 'blur(80px)',
                transform: `translate(${heroMousePos.x * 0.01}px, ${heroMousePos.y * 0.01}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full opacity-20"
              style={{
                background:
                  'radial-gradient(circle, #8A2EFF 0%, transparent 70%)',
                filter: 'blur(80px)',
                transform: `translate(${heroMousePos.x * -0.015}px, ${heroMousePos.y * -0.015}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            />
            <div
              className="pointer-events-none absolute left-1/3 top-1/3 h-64 w-64 rounded-full opacity-10"
              style={{
                background:
                  'radial-gradient(circle, #FF2BA6 0%, transparent 70%)',
                filter: 'blur(60px)',
                transform: `translate(${heroMousePos.x * 0.008}px, ${heroMousePos.y * -0.008}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            />

            {/* Phone mockup */}
            <div
              ref={phoneRef}
              className="relative z-10"
              style={{
                perspective: '1000px',
              }}
            >
              <div
                className="h-[480px] w-[260px] overflow-hidden rounded-[32px] border-2 border-white/10 shadow-2xl transition-transform duration-75 ease-out"
                style={{
                  background: '#0a0a0a',
                  boxShadow:
                    '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                  transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                }}
              >
                {/* Phone notch */}
                <div className="relative mx-auto h-6 w-[120px] rounded-b-xl bg-black" />

                {/* Phone screen content placeholder */}
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  {/* Mock feed content */}
                  <div className="mb-6 flex w-full items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="h-3 flex-1 rounded bg-white/10" />
                  </div>
                  <div className="mb-4 aspect-square w-full rounded-xl bg-gradient-to-br from-primary/20 to-brand/20" />
                  <div className="mb-3 flex w-full gap-2">
                    <div className="h-3 flex-1 rounded bg-white/10" />
                    <div className="h-3 w-12 rounded bg-white/10" />
                  </div>
                  <div className="mb-6 h-3 w-3/4 rounded bg-white/10" />
                  <div className="flex w-full gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                  </div>
                  <div className="mt-8">
                    <div className="text-2xl font-bold text-white">Blink</div>
                    <div className="mt-1 text-xs text-white/40">
                      Share your world
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="relative z-10 mt-10 text-center">
              <h2 className="text-2xl font-bold text-white">
                Share your world in a blink.
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/60">
                Connect with friends, share moments, and discover stories from
                around the globe — all in an instant.
              </p>
            </div>
          </div>

          {/* ---- Right: Login Form ---- */}
          <div className="flex flex-1 items-center justify-center px-4 py-8 md:px-8">
            <div className="w-full max-w-[350px] space-y-3">
              {/* Auth Card */}
              <div className="rounded-xl border border-border bg-bg px-8 py-10 shadow-sm">
                {/* Large Blink logo */}
                <div className="mb-8 text-center">
                  <h1 className="text-[42px] font-extrabold tracking-tight text-text">
                    Blink
                  </h1>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-danger/10 p-3 text-center text-sm text-danger">
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Username or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="bg-bg-secondary text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-bg-secondary text-sm"
                  />
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full"
                    size="lg"
                  >
                    Log In
                  </Button>
                </form>

                {/* OR divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs font-semibold uppercase">
                    <span className="bg-bg px-3 text-text-secondary">or</span>
                  </div>
                </div>

                {/* Social buttons */}
                <div className="space-y-2">
                  {/* Google */}
                  <a
                    href={`${API_URL}/api/auth/google`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-2 text-sm font-semibold text-text transition-all duration-150 hover:bg-bg-secondary active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </a>

                  {/* GitHub */}
                  <a
                    href={`${API_URL}/api/auth/github`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-text px-4 py-2 text-sm font-semibold text-bg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
                    </svg>
                    Continue with GitHub
                  </a>
                </div>

                {/* Forgot password */}
                <div className="mt-5 text-center">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary transition-colors hover:text-primary-dark"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Sign up card */}
              <div className="rounded-xl border border-border bg-bg px-8 py-5 text-center text-sm shadow-sm">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-primary transition-colors hover:text-primary-dark"
                >
                  Sign up
                </Link>
              </div>

              {/* App store badges */}
              <div className="pt-2 text-center">
                <p className="mb-3 text-sm font-medium text-text-secondary">
                  Get the app.
                </p>
                <div className="flex items-center justify-center gap-3">
                  {/* Google Play badge */}
                  <a
                    href="#"
                    className="flex items-center gap-2 rounded-lg bg-text px-4 py-2 text-bg transition-opacity hover:opacity-90"
                    aria-label="Get it on Google Play"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.523 12.62c-.02.267-.127.52-.33.69l-.016.013-8.328 6.228c-.295.222-.66.33-1.025.33-.218 0-.435-.045-.64-.134l6.74-6.74 1.6-1.6 1.6 1.6.03.03c.14.14.35.33.37.53v-.007zM5.838 5.18c.056-.15.126-.294.212-.43l7.648 7.648-2.418 2.42-6.636-6.638c-.23-.23-.34-.54-.34-.86 0-.325.113-.638.34-.868.096-.096.21-.172.34-.233l.674-.04z" />
                      <path d="M15.59 10.64l-5.063-5.064c-.28-.28-.66-.43-1.07-.43-.14 0-.28.02-.41.06-1.41.46-2.46 1.36-2.88 2.18-.17.33-.25.66-.22.98l6.28 6.28 1.36-1.36 1.36-1.36c.49-.48.64-1.22.64-1.81v-.001zm1.19-.159c-.63-.08-1.15.07-1.51.42l-1.36 1.36 2.73 2.73 1.38-1.38c.42-.42.48-.96.46-1.6-.04-.56-.33-.93-.55-1.13-.18-.17-.41-.3-.65-.4zM9.274 20.89c.29.12.61.18.94.18.36 0 .718-.09 1.035-.27l7.23-5.41c.19-.14.32-.33.38-.54-1.83.02-5.272.02-7.265.02l-2.32 2.32v3.7z" />
                    </svg>
                    <div className="text-left leading-tight">
                      <div className="text-[9px] opacity-80">GET IT ON</div>
                      <div className="text-xs font-semibold">Google Play</div>
                    </div>
                  </a>

                  {/* App Store badge */}
                  <a
                    href="#"
                    className="flex items-center gap-2 rounded-lg bg-text px-4 py-2 text-bg transition-opacity hover:opacity-90"
                    aria-label="Download on the App Store"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M14.94 3.52c.47-.56 1.08-1 1.78-1.26.13 1.04-.32 2.08-.88 2.82-.56.74-1.35 1.28-2.18 1.26-.18-.94.25-2.02.82-2.72.38-.45.87-.78 1.46-1.1zM15.84 5.8c.77-.01 1.48.28 2.06.78.84-.16 1.65-.46 2.38-.88.25-.15.5-.32.74-.5a8.87 8.87 0 0 1-1.64 1.94c.08.9.06 1.78-.2 2.6-.4 1.27-1.2 2.38-2.22 3.1-.6.43-1.28.7-1.98.82-.46.08-.93.06-1.38-.06a3.3 3.3 0 0 1-1.55-.78c-.38-.34-.68-.76-.88-1.22a3.6 3.6 0 0 1-.18-2.52c.25-.77.7-1.48 1.3-2.02.4-.36.86-.64 1.36-.82.28-.1.57-.16.86-.18.31-.02.62 0 .92.06.3.06.6.16.88.3.27.14.52.3.74.5.4-.16.82-.28 1.24-.34zM12 11.12a3.35 3.35 0 0 1 .7-1.52c.3-.38.68-.7 1.1-.94a4.22 4.22 0 0 0-.5-.64c-.4-.4-.88-.7-1.4-.88a3.31 3.31 0 0 0-2.2.12c-.6.24-1.12.64-1.5 1.12-.36.47-.6 1.03-.68 1.6a3.4 3.4 0 0 0 .08 1.54c.14.46.38.88.7 1.22.3.32.66.56 1.06.72.4.16.82.23 1.24.2.24-.02.48-.08.7-.16.22-.08.42-.2.6-.36a3.18 3.18 0 0 0 .9-1.18c.2-.46.28-.96.22-1.44a2.8 2.8 0 0 0-.32-.96h-.1z" />
                    </svg>
                    <div className="text-left leading-tight">
                      <div className="text-[9px] opacity-80">DOWNLOAD ON</div>
                      <div className="text-xs font-semibold">App Store</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border bg-bg-tertiary/50 py-6">
        <div className="mx-auto max-w-4xl px-4 text-center">
          {/* Footer links */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-text-secondary">
            <Link
              href="/meta"
              className="hover:text-text"
            >
              Meta
            </Link>
            <Link
              href="/about"
              className="hover:text-text"
            >
              About
            </Link>
            <Link
              href="/blog"
              className="hover:text-text"
            >
              Blog
            </Link>
            <Link
              href="/jobs"
              className="hover:text-text"
            >
              Jobs
            </Link>
            <Link
              href="/help"
              className="hover:text-text"
            >
              Help
            </Link>
            <Link
              href="/api"
              className="hover:text-text"
            >
              API
            </Link>
            <Link
              href="/privacy"
              className="hover:text-text"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-text"
            >
              Terms
            </Link>
            <Link
              href="/locations"
              className="hover:text-text"
            >
              Locations
            </Link>
            <Link
              href="/blink-lite"
              className="hover:text-text"
            >
              Blink Lite
            </Link>
          </div>

          {/* Language selector + Copyright */}
          <div className="flex flex-col items-center gap-2 text-xs text-text-secondary">
            <div className="inline-flex items-center gap-1 text-text-secondary">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" x2="22" y1="12" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="font-medium">English</span>
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <p>&copy; 2024 Blink from Meta-style</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
