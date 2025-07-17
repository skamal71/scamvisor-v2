import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  // Ensure static files are served correctly
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/(.*\\.mp4)",
        headers: [
          {
            key: "Content-Type",
            value: "video/mp4",
          },
          {
            key: "Accept-Ranges",
            value: "bytes",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
