import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "http", hostname: "image.tmdb.org" },
      // Jellyfin sert les affiches de la bibliothèque
      { protocol: "http", hostname: "localhost", port: "8096" },
    ],
  },
};

export default nextConfig;
