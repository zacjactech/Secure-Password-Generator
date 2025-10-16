import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Silence workspace root inference warning: explicitly set root to this app
    root: __dirname,
  },
};

export default nextConfig;
