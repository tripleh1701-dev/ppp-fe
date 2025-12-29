/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// Admin Portal API URL for external account management
const ADMIN_PORTAL_API =
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_API_URL ||
    'https://hnm7u7id73.execute-api.us-east-1.amazonaws.com/prod';

// Base path for production deployment (e.g., /prod for API Gateway stage)
const basePath = isProd ? process.env.NEXT_PUBLIC_BASE_PATH || '/prod' : '';

const nextConfig = {
    // Speed up local builds by skipping type and lint checks in dev
    typescript: {
        ignoreBuildErrors: !isProd,
    },
    eslint: {
        ignoreDuringBuilds: !isProd,
    },
    // Set basePath and assetPrefix for production deployments
    ...(isProd && basePath
        ? {
              basePath: basePath,
              assetPrefix: basePath,
          }
        : {}),
    async rewrites() {
        // Proxy API calls in dev to Nest backend on port 4000
        return [
            // Proxy external Admin Portal API calls to avoid CORS issues
            {
                source: '/admin-portal-api/:path*',
                destination: `${ADMIN_PORTAL_API}/:path*`,
            },
            // Local backend API calls
            {
                source: '/api/:path*',
                destination: 'http://localhost:4000/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
