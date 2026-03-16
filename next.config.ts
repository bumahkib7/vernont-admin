import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
