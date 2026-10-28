import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["dashboard.localhost", "*.localhost"],
};

export default nextConfig;
