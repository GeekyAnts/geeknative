import type { NextConfig } from "next";

// A static site for GitHub Pages: https://geekyants.github.io/geeknative/
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/geeknative",
  trailingSlash: true,
  images: { unoptimized: true },
  // Opening the dev server at 127.0.0.1 is otherwise blocked, and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
