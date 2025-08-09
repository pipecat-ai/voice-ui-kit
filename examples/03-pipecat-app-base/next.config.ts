import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://0.0.0.0:7860/api/:path*",
      },
    ];
  },
};

export default nextConfig;
