import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Vercel FE → Railway BE split: in prod NEXT_PUBLIC_API_BASE points to Railway,
    // so Next rewrites are bypassed (client fetches Railway directly). Rewrites only
    // for local dev where BE runs on localhost:3001.
    if (process.env.VERCEL || process.env.NEXT_PUBLIC_API_BASE?.startsWith('http')) {
      return [];
    }
    const apiBase = process.env.API_URL || 'http://127.0.0.1:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/health/:path*',
        destination: `${apiBase}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
