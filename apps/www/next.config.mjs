import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["@pipecat-ai/voice-ui-kit"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://0.0.0.0:7860/api/:path*",
      },
    ];
  },
};

export default withMDX(config);
