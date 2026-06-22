import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Electron production build
  // Remove this when running `next dev`
  ...(process.env.ELECTRON_BUILD === 'true' && {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
