/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Disable automatic static optimization for API routes
    experimental: {
        serverActions: true,
    },
    // Configure headers for CORS and cache-busting (required by Stremio)
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    // CORS headers with preflight support
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                    // ADDED: Strict cache-busting headers to prevent iOS caching
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, max-age=0' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
        ];
    },
    // ADDED: HTTP to HTTPS redirect for production
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'x-forwarded-proto',
                        value: 'http',
                    },
                ],
                destination: 'https://:host/:path*',
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;

