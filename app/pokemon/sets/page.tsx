// Pokémon Sets browser page — fetches all sets from TCGdex and passes them
// to PokemonSetsBrowser for client-side search + sort + pagination.

import { fetchPokemonSets } from "@/lib/pokemon";
import PokemonSetsBrowser from "@/components/PokemonSetsBrowser";
import CategoryHero from "@/components/CategoryHero";

// Pack art images — swap these for real booster pack art once you have the files.
// Recommended source: https://bulbapedia.bulbagarden.net (search "<Set Name> booster pack")
// Download 3 pack images, save to /public (e.g. /pokemon-swsh-pack.png), then replace the srcs below.
//
// Current placeholder: TCGdex set logo art (stylised set name graphics, available via CDN).
const SETS_HERO_IMAGES: [
  { src: string; alt: string },
  { src: string; alt: string },
  { src: string; alt: string },
] = [
  { src: "/shiningfate.png", alt: "Shining Fates" },
  { src: "/151.png",         alt: "Pokémon 151" },
  { src: "/baseset.png",     alt: "Shadowless" },
];

export default async function PokemonSetsPage() {
  const sets = await fetchPokemonSets();

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              Pokémon Sets
            </h1>
            <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
              {sets.length} sets
            </p>
          </div>
          <CategoryHero images={SETS_HERO_IMAGES} variant="packs" packHeight={300} />
        </div>

        <PokemonSetsBrowser sets={sets} />
      </div>
    </div>
  );
}
