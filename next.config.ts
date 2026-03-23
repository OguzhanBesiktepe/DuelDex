import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // YGO card images served from Cloudflare R2
        protocol: "https",
        hostname: "pub-8f7749aaa39e4c799999b63d69153e39.r2.dev",
      },
      {
        // TCGdex Pokémon card images (hotlinking allowed)
        protocol: "https",
        hostname: "assets.tcgdex.net",
      },
    ],
  },
};

export default nextConfig;
