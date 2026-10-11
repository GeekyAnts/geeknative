import type { NextConfig } from "next";

// A static site for GitHub Pages: https://geekyants.github.io/geeknative/
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/geeknative",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
