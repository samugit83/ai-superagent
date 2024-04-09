/** @type {import('next').NextConfig} */
const nextConfig = {  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    }
  }};

export default nextConfig;
