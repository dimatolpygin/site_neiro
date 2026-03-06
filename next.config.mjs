/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.wavespeed.ai" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflare.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["ioredis", "bullmq"],
  },
};

export default nextConfig;
