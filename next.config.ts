import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Silence workspace root inference warning: explicitly set root to this app
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self';"
              : "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
