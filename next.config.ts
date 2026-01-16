import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow dev server access from local network (mobile testing, etc.)
  allowedDevOrigins: ['http://192.168.*.*:3000'],

  images: {
    unoptimized: true,
  },

  // Webpack configuration for better-auth compatibility
  webpack: (config, { isServer, webpack }) => {
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

      // Define process.env variables to prevent runtime errors
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BETTER_AUTH_SECRET': JSON.stringify(undefined),
          'process.env.AUTH_SECRET': JSON.stringify(undefined),
          'process.env.BETTER_AUTH_TELEMETRY': JSON.stringify(undefined),
          'process.env.BETTER_AUTH_TELEMETRY_ID': JSON.stringify(undefined),
          'process.env.NODE_ENV': JSON.stringify('production'),
          'process.env.PACKAGE_VERSION': JSON.stringify('0.0.0'),
          'process.env.BETTER_AUTH_TELEMETRY_ENDPOINT': JSON.stringify(
            'https://telemetry.better-auth.com/v1/track',
          ),
        }),
      );
    }
    return config;
  },

  // Turbopack configuration (used in development)
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    root: process.cwd(),
  },

  // Client-side environment variables
  env: {
    BETTER_AUTH_SECRET: '',
    AUTH_SECRET: '',
    BETTER_AUTH_TELEMETRY: '',
    BETTER_AUTH_TELEMETRY_ID: '',
    BETTER_AUTH_URL: '',
    PACKAGE_VERSION: '0.0.0',
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
