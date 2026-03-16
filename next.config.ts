import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Proxy /api/proxy/* to the backend so cookies are same-origin (fixes mobile Safari ITP)
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
      },
      {
        protocol: "https",
        hostname: "*.runixcloud.dev",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
    // Disable image optimization in development to avoid private IP blocking
    unoptimized: isDev,
  },
};

export default nextConfig;
