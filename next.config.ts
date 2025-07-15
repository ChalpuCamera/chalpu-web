import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
    domains: ["cdn.chalpu.com"],
  },
};

export default nextConfig;
