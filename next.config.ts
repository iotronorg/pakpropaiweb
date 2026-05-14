import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local dev media
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      // Cloudflare R2 public bucket
      { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
      // Render production API
      { protocol: "https", hostname: "pakpropai-api.onrender.com", pathname: "/media/**" },
    ],
  },
};

export default nextConfig;
