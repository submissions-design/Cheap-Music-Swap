import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-2b06c84d72134bd8ab9357cd35d34199.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
