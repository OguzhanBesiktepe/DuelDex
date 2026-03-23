// Pokémon Trainer cards page — fetches all Trainer-type cards from TCGdex (cached 1h),
// paginates in JS, and supports filtering by trainer subtype (Item/Supporter/Stadium/Tool).

import { Suspense } from "react";
import CardGrid from "@/components/CardGrid";
import CategoryHero from "@/components/CategoryHero";
import TrainerSubtypeFilter from "@/components/TrainerSubtypeFilter";
import { fetchAllPokemonCards, fetchPokemonCardById } from "@/lib/pokemon";

const PER_PAGE = 24;

const TRAINER_HERO_IMAGES: [
  { src: string; alt: string },
  { src: string; alt: string },
  { src: string; alt: string },
] = [
  { src: "https://assets.tcgdex.net/en/base/base1/88/high.webp", alt: "Professor Oak" },
  { src: "https://assets.tcgdex.net/en/base/base1/71/high.webp", alt: "Computer Search" },
  { src: "https://assets.tcgdex.net/en/base/base1/91/high.webp", alt: "Bill" },
];

export const dynamic = "force-dynamic";

// Full-art rarities for Trainer cards — covers modern and Sword & Shield era full arts
const FULL_ART_RARITIES = [
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Rare Ultra",
];

export default async function TrainerPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    trainerType?: string;
    fullArt?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const selectedTrainerType = params.trainerType ?? "";
  const fullArt = params.fullArt === "1";

  let allCards: Awaited<ReturnType<typeof fetchAllPokemonCards>>;

  if (fullArt) {
    // Fetch each full-art rarity in parallel and merge, deduping by card id
    const batches = await Promise.all(
      FULL_ART_RARITIES.map((rarity) =>
        fetchAllPokemonCards("Trainer", {
          trainerType: selectedTrainerType || undefined,
          rarity,
        }),
      ),
    );
    const seen = new Set<string>();
    allCards = [];
    for (const batch of batches) {
      for (const card of batch) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          allCards.push(card);
        }
      }
    }
  } else {
    allCards = await fetchAllPokemonCards("Trainer", {
      trainerType: selectedTrainerType || undefined,
    });
  }

  // Filter out cards with no image before paginating so page counts stay consistent
  const withImages = allCards.filter((c) => !!c.image);
  const total = withImages.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const effectivePage = Math.min(page, totalPages);
  const pageCards = withImages.slice((effectivePage - 1) * PER_PAGE, effectivePage * PER_PAGE);

  // Fetch full card details in parallel to get rarity + price (cached 1h each).
  const details = await Promise.all(pageCards.map((c) => fetchPokemonCardById(c.id)));

  const mapped = details
    .filter((d) => d !== null)
    .map((d) => {
      const tcg = d!.pricing?.tcgplayer;
      const priceNum =
        tcg?.holofoil?.marketPrice ??
        tcg?.["reverse-holofoil"]?.marketPrice ??
        tcg?.normal?.marketPrice ??
        tcg?.["1stEditionHolofoil"]?.marketPrice ??
        null;
      return {
        id: d!.id,
        name: d!.name,
        imageUrl: d!.image ? `${d!.image}/low.webp` : "",
        rarity: d!.rarity,
        price: priceNum != null ? String(priceNum) : undefined,
      };
    })
    .filter((c) => !!c.imageUrl);

  const filterQuery =
    (selectedTrainerType ? `&trainerType=${encodeURIComponent(selectedTrainerType)}` : "") +
    (fullArt ? "&fullArt=1" : "");

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
              Trainer Cards
            </h1>
            <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
              Pokémon TCG &mdash; {total.toLocaleString()} cards
            </p>
          </div>
          <CategoryHero images={TRAINER_HERO_IMAGES} />
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: "#0E1220", border: "1px solid #1A2035" }}
        >
          <Suspense fallback={null}>
            <TrainerSubtypeFilter selected={selectedTrainerType} fullArt={fullArt} />
          </Suspense>
        </div>

        <CardGrid cards={mapped} game="pokemon" />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {effectivePage > 1 && (
              <a
                href={`?page=${effectivePage - 1}${filterQuery}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
              >
                Previous
              </a>
            )}
            <span className="text-sm" style={{ color: "#7A8BA8" }}>
              Page {effectivePage} of {totalPages} &middot; {total.toLocaleString()} cards
            </span>
            {effectivePage < totalPages && (
              <a
                href={`?page=${effectivePage + 1}${filterQuery}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
