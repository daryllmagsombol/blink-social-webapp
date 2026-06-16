import type { NextConfig } from 'next';

function getRemotePattern() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const apiUrl =
    configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')
      ? new URL(configuredUrl)
      : new URL(`http://${configuredUrl}`);

  return {
    protocol: apiUrl.protocol.replace(':', ''),
    hostname: apiUrl.hostname,
    ...(apiUrl.port ? { port: apiUrl.port } : {}),
    pathname: '/**',
  };
}

function getApiOrigin(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
      return new URL(configuredUrl).origin;
    }
    return new URL(`http://${configuredUrl}`).origin;
  } catch {
    return 'http://localhost:4000';
  }
}

function getCspValue(): string {
  const apiOrigin = getApiOrigin();
  const isDev = process.env.NODE_ENV === 'development';

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src": `'self' data: blob: ${apiOrigin}`,
    "font-src": "'self' https://fonts.gstatic.com",
    "connect-src": `'self' ${apiOrigin}${isDev ? ' ws: wss:' : ''}`,
    "media-src": `'self' ${apiOrigin}`,
    "frame-src": "'none'",
    "object-src": "'none'",
    "base-uri": "'self'",
  };

  // In development, Next.js requires 'unsafe-eval' for Fast Refresh and
  // 'unsafe-inline' for style injection. In production these are removed.
  if (isDev) {
    directives["script-src"] = "'self' 'unsafe-eval' 'unsafe-inline'";
  } else {
    directives["script-src"] = "'self'";
  }

  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [getRemotePattern() as any],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: getCspValue(),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
