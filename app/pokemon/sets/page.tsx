// Pokémon Sets browser page — fetches all sets from TCGdex and passes them
// to PokemonSetsBrowser for client-side search + sort + pagination.

import { fetchPokemonSets } from "@/lib/pokemon";
import PokemonSetsBrowser from "@/components/PokemonSetsBrowser";
import CategoryHero from "@/components/CategoryHero";

const SETS_HERO_IMAGES: [
  { src: string; alt: string },
  { src: string; alt: string },
  { src: string; alt: string },
] = [
  { src: "https://assets.tcgdex.net/en/base/base1/4/high.webp", alt: "Charizard — Base Set" },
  { src: "https://assets.tcgdex.net/en/base/base1/10/high.webp", alt: "Mewtwo — Base Set" },
  { src: "https://assets.tcgdex.net/en/base/base1/58/high.webp", alt: "Pikachu — Base Set" },
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
              {sets.length} sets · Click any set to browse its cards
            </p>
          </div>
          <CategoryHero images={SETS_HERO_IMAGES} />
        </div>

        <PokemonSetsBrowser sets={sets} />
      </div>
    </div>
  );
}
