import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Note: 'output: export' removed to support API routes for authentication
  // If you need static export, use a different auth strategy or deploy with a Node.js server

  // Allow dev server access from local network (mobile testing, etc.)
  allowedDevOrigins: ['http://192.168.*.*:3000'],

  images: {
    unoptimized: true,
  },

  // Note: trailingSlash disabled because it conflicts with catch-all API routes
  // trailingSlash: true,

  // Fix for Better Auth 2026 - Keep server-only packages external
  serverExternalPackages: ['better-auth'],

  // Explicitly transpile better-auth to prevent Node built-ins in client bundle
  transpilePackages: ['better-auth'],

  // Webpack configuration for better-auth compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Node.js built-ins from being bundled in client code
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        process: false,
        path: false,
        fs: false,
        os: false,
      };
    }
    return config;
  },

  // Turbopack configuration (used in development)
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    root: process.cwd(),
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['@fortawesome/react-fontawesome', '@fortawesome/fontawesome-svg-core'],
  },
};

// Bundle analyzer for production build analysis
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
