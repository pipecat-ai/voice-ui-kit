import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://0.0.0.0:7860/api/:path*",
      },
      {
        source: "/start",
        destination: "http://0.0.0.0:7860/start",
      },
      {
        source: "/sessions/:path*",
        destination: "http://0.0.0.0:7860/sessions/:path*",
      },
    ];
  },
};

export default nextConfig;
