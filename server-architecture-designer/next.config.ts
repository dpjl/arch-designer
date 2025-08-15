import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ESLint errors during production builds (Docker) as requested
  eslint: { ignoreDuringBuilds: true },
  // Produce standalone output folder (.next/standalone) for slimmer Docker image
  output: 'standalone',
};

export default nextConfig;
