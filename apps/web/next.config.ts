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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: http: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' http: https: ws: wss:",
              "media-src 'self' http: https:",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
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
