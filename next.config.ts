import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Base Alpha calls external read-only data APIs at request time from Route Handlers.
  // No external images are rendered, so no remotePatterns are required.
  experimental: {
    // Route Handlers stay on the Node runtime so viem + RPC batching work as expected.
  },
};

export default nextConfig;
