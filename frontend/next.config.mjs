/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    if (isServer) {
      config.externals = [...(config.externals ?? []), 'pdfjs-dist'];
    }

    return config;
  },
};

export default nextConfig;
