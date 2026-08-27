import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
