import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: {
    '/*': [
      './.git/**/*',
      './.next/cache/**/*',
      './src-tauri/**/*',
      './target/**/*',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.modrinth.com' },
      { protocol: 'https', hostname: '*.modrinth.com' },
      { protocol: 'https', hostname: 'media.forgecdn.net' },
      { protocol: 'https', hostname: 'cdn.forgecdn.net' },
    ],
  },
};

export default nextConfig;
