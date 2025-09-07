/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
    // Speed up local builds by skipping type and lint checks in dev
    typescript: {
        ignoreBuildErrors: !isProd,
    },
    eslint: {
        ignoreDuringBuilds: !isProd,
    },
    async rewrites() {
        // Proxy API calls in dev to Nest backend on port 4000
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4000/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
