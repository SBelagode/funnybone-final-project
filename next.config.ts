import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: {
      // OAuth callback query strings contain authorization codes.
      ignore: [/^\/(?:auth|google)\/callback(?:[/?]|$)/],
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.crackd.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.almostcrackd.ai",
        pathname: "/**",
      },
    ],
    // image settings, can be adjusted
    minimumCacheTTL: 60 * 60 * 24, // 24 hours cache
    deviceSizes: [640, 750, 828, 1080, 1200], // Fewer sizes to reduce variants
    // imageSizes: [16, 32, 48, 64, 96], // Fewer sizes
    formats: ["image/webp"], // Only use webp to reduce requests
  },
};

export default nextConfig;
