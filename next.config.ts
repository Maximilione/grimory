import type { NextConfig } from "next";
import path from "path";

// /Programs holds ~28 nested projects; without pinning the root Next/Turbopack
// walks them all and FSEvents chokes. Pin root + tracing root to this folder.
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
