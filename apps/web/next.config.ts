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
};

export default nextConfig;
