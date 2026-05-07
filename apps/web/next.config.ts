import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@conscious-slovenia/database",
    "@conscious-slovenia/ai-processor",
    "@conscious-slovenia/publisher",
    "@conscious-slovenia/pipeline",
    "@conscious-slovenia/scraper",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization,x-webhook-secret,x-admin-secret" },
        ],
      },
    ];
  },
};

export default nextConfig;
