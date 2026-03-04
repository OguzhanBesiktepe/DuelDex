import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // YGOPRODeck card images (self-host on R2 before going to production)
        protocol: "https",
        hostname: "images.ygoprodeck.com",
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
