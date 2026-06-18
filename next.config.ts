import type { NextConfig } from "next";
import path from "path";

// Static export for GitHub Pages (or any static host). basePath is set only for
// a *project* repo served under a subpath (https://user.github.io/<repo>/), via
// the NEXT_PUBLIC_BASE_PATH env var in the deploy workflow. For a user/root repo
// (user.github.io) or a custom domain, leave it empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // emits /create/index.html etc — friendly for GitHub Pages
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // /Programs holds ~28 nested projects; pin the root so Turbopack/FSEvents don't choke.
  turbopack: { root: __dirname },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
