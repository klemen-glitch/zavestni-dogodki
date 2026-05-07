import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@conscious-slovenia/database",
    "@conscious-slovenia/ai-processor",
    "@conscious-slovenia/publisher",
    "@conscious-slovenia/pipeline",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "scontent*.fbcdn.net" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
