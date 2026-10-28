import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  allowedDevOrigins: ["dashboard.localhost", "*.localhost"],
};

export default nextConfig;
