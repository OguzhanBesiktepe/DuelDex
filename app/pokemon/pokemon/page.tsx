// Pokémon cards page — fetches all Pokémon-type cards from TCGdex (cached 1h),
// paginates in JS, and supports filtering by energy type and evolution stage.

import { Suspense } from "react";
import CardGrid from "@/components/CardGrid";
import CategoryHero from "@/components/CategoryHero";
import PokemonTypeFilter from "@/components/PokemonTypeFilter";
import PokemonStageFilter from "@/components/PokemonStageFilter";
import { fetchAllPokemonCards, fetchPokemonCardById, getBestTcgPrice } from "@/lib/pokemon";
import type { PokemonCardSummary } from "@/lib/pokemon";
import Pagination from "@/components/Pagination";

const PER_PAGE = 24;

const POKEMON_HERO_IMAGES: [
  { src: string; alt: string },
  { src: string; alt: string },
  { src: string; alt: string },
] = [
  { src: "https://assets.tcgdex.net/en/base/base1/4/high.webp", alt: "Charizard" },
  { src: "https://assets.tcgdex.net/en/base/base1/10/high.webp", alt: "Mewtwo" },
  { src: "https://assets.tcgdex.net/en/base/base1/58/high.webp", alt: "Pikachu" },
];

export const dynamic = "force-dynamic";

export default async function PokemonPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    poketype?: string | string[];
    stage?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const rawTypes = params.poketype;
  const selectedTypes: string[] = rawTypes
    ? Array.isArray(rawTypes) ? rawTypes : [rawTypes]
    : [];
  const selectedStage = params.stage ?? "";

  // Fetch the full filtered list(s) — each result is cached separately by Next.js for 1h.
  // Multiple types: fetch each in parallel and merge the full lists before paginating.
  let allCards: PokemonCardSummary[];
  if (selectedTypes.length > 1) {
    const results = await Promise.all(
      selectedTypes.map((t) =>
        fetchAllPokemonCards("Pokemon", {
          types: t,
          stage: selectedStage || undefined,
        }),
      ),
    );
    allCards = results.flat();
  } else {
    allCards = await fetchAllPokemonCards("Pokemon", {
      types: selectedTypes[0] || undefined,
      stage: selectedStage || undefined,
    });
  }

  // Filter out cards with no image before paginating so page counts stay consistent
  const withImages = allCards.filter((c) => !!c.image);
  const total = withImages.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const effectivePage = Math.min(page, totalPages);
  const pageCards = withImages.slice((effectivePage - 1) * PER_PAGE, effectivePage * PER_PAGE);

  // Fetch full card details in parallel to get rarity + TCGPlayer price.
  // Each result is independently cached by Next.js for 1 hour.
  const details = await Promise.all(pageCards.map((c) => fetchPokemonCardById(c.id)));

  const mapped = details
    .filter((d) => d !== null)
    .map((d) => {
      const priceNum = getBestTcgPrice(d!);
      return {
        id: d!.id,
        name: d!.name,
        imageUrl: d!.image ? `${d!.image}/low.webp` : "",
        type: d!.types?.[0],
        rarity: d!.rarity,
        price: priceNum != null ? String(priceNum) : undefined,
      };
    })
    .filter((c) => !!c.imageUrl);

  const typeQuery = selectedTypes.map((t) => `&poketype=${encodeURIComponent(t)}`).join("");
  const filterQuery = typeQuery + (selectedStage ? `&stage=${encodeURIComponent(selectedStage)}` : "");

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              Pokémon
            </h1>
            <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
              Pokémon TCG &mdash; {total.toLocaleString()} cards
            </p>
          </div>
          <CategoryHero images={POKEMON_HERO_IMAGES} />
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: "#0E1220", border: "1px solid #1A2035" }}
        >
          <Suspense fallback={null}>
            <PokemonTypeFilter selected={selectedTypes} />
          </Suspense>
          <div className="flex flex-wrap gap-3 items-center mt-3">
            <Suspense fallback={null}>
              <PokemonStageFilter selected={selectedStage} />
            </Suspense>
          </div>
        </div>

        <CardGrid cards={mapped} game="pokemon" from="/pokemon/pokemon" />

        {/* Pagination */}
        <Pagination
          page={effectivePage}
          totalPages={totalPages}
          total={total}
          countLabel="cards"
          accent="#00AAFF"
          filterSuffix={filterQuery}
        />
      </div>
    </div>
  );
}
