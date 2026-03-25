import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DuelDex",
    short_name: "DuelDex",
    description: "Browse and track Yu-Gi-Oh! and Pokémon TCG card prices. Search thousands of cards, view live market prices, save favorites, and build custom lists.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#080B14",
    theme_color: "#080B14",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
