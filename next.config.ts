import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.API_URL || 'https://dlo.43-205-27-169.sslip.io';
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
