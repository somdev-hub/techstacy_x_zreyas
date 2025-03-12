import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aceternity.com'
      },
      {
        protocol: 'https',
        hostname: 'api.microlink.io'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com'
      },
      {
        protocol: 'https',
        hostname: 'ui.aceternity.com'
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org'
      },
      {
        protocol: 'https',
        hostname: 'beautiful-gold-bison.myfilebase.com'
      },
      {
        protocol: 'https',
        hostname: 'techstacy-x-zreyas.s3.filebase.com'
      }
    ]
  }
};

export default nextConfig;
