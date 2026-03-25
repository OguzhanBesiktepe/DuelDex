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
    screenshots: [
      {
        src: "/screenshots/Homepage.jpg",
        sizes: "430x932",
        type: "image/jpeg",
        // @ts-expect-error – 'platform' is valid per W3C spec but not yet in Next.js types
        platform: "narrow",
        label: "DuelDex Homepage — Featured Sets",
      },
      {
        src: "/screenshots/Monsters.jpg",
        sizes: "430x932",
        type: "image/jpeg",
        // @ts-expect-error – 'platform' is valid per W3C spec but not yet in Next.js types
        platform: "narrow",
        label: "Browse Yu-Gi-Oh! Monster Cards",
      },
      {
        src: "/screenshots/Spells.jpg",
        sizes: "430x932",
        type: "image/jpeg",
        // @ts-expect-error – 'platform' is valid per W3C spec but not yet in Next.js types
        platform: "narrow",
        label: "Browse Yu-Gi-Oh! Spell Cards",
      },
      {
        src: "/screenshots/Pokemonsters.jpg",
        sizes: "430x932",
        type: "image/jpeg",
        // @ts-expect-error – 'platform' is valid per W3C spec but not yet in Next.js types
        platform: "narrow",
        label: "Browse Pokémon Cards",
      },
      {
        src: "/screenshots/Charizard.jpg",
        sizes: "430x932",
        type: "image/jpeg",
        // @ts-expect-error – 'platform' is valid per W3C spec but not yet in Next.js types
        platform: "narrow",
        label: "Card Detail with Live Pricing",
      },
      {
        src: "/screenshots/Browser.jpg",
        sizes: "430x932",
        type: "image/jpeg",
        // @ts-expect-error – 'platform' is valid per W3C spec but not yet in Next.js types
        platform: "narrow",
        label: "Card Grid Browser",
      },
    ] as MetadataRoute.Manifest["icons"],
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
