import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.sanity.io',
            },
            {
                protocol: 'https',
                hostname: 'www.bikeraft.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn-ilbflkb.nitrocdn.com',
            },
        ],
    },
};

export default nextConfig;
