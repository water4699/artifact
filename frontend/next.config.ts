import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce chunk loading issues in development
  experimental: {
    // Reduce concurrent requests
    optimizePackageImports: ['@metamask/sdk', 'ethers'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce chunk size and concurrent loading in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Reduce MetaMask SDK chunking
            metamask: {
              test: /[\\/]node_modules[\\/]@metamask[\\/]/,
              name: 'metamask-vendor',
              chunks: 'all',
              priority: 10,
            },
            // Reduce ethers chunking
            ethers: {
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              name: 'ethers-vendor',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },
  headers() {
    // Minimal headers for FHEVM compatibility - focus on API routes only
    return Promise.resolve([
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      // Remove restrictive headers from frontend pages to allow third-party integrations
      // FHEVM will handle encryption through other mechanisms when needed
    ]);
  }
};

export default nextConfig;
