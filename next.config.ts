import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   serverExternalPackages: [
    'yjs',
    'y-protocols',
  ],
};

export default nextConfig;
