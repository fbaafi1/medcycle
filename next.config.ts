import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js <Image> to optimise images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Serve modern WebP/AVIF formats automatically
    formats: ['image/avif', 'image/webp'],
  },

  // HTTP cache headers — cuts repeated-reload latency dramatically
  async headers() {
    return [
      // Static assets: cache for 1 year in the browser + CDN
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public folder assets (images, icons, etc.)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Pages: never cache HTML at the CDN layer — always serve fresh
      // (client-side sessionStorage cache handles repeat-visit performance)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

