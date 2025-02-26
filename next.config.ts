import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "aceternity.com",
      "api.microlink.io",
      "images.unsplash.com",
      "assets.aceternity.com",
      "ui.aceternity.com",
      "upload.wikimedia.org"
    ]
  }
};

export default nextConfig;
