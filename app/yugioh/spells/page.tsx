// Yu-Gi-Oh! Spells page — server component that fetches Spell Cards with optional sub-type
// filtering (Normal, Quick-Play, Continuous, Equip, Field, Ritual).
// Multiple sub-types are fetched in parallel and merged.

import { Suspense } from "react";
import CardGrid from "@/components/CardGrid";
import TypeFilter from "@/components/TypeFilter";
import CategoryHero from "@/components/CategoryHero";
import { SPELL_TYPES } from "@/lib/cardTypes";
import { fetchYGOCards, ygoImage } from "@/lib/yugioh";

const SPELL_HERO_IMAGES: [
  { src: string; alt: string },
  { src: string; alt: string },
  { src: string; alt: string },
] = [
  { src: ygoImage(83764718), alt: "Monster Reborn" },
  { src: ygoImage(55144522), alt: "Pot of Greed" },
  { src: ygoImage(12580477), alt: "Raigeki" },
];

export default async function SpellsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; subtype?: string | string[] }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 24;
  const offset = (page - 1) * perPage;

  const rawSubtypes = params.subtype;
  const selectedSubtypes: string[] = rawSubtypes
    ? Array.isArray(rawSubtypes)
      ? rawSubtypes
      : [rawSubtypes]
    : [];

  let cards, total: number;
  if (selectedSubtypes.length === 0) {
    // No sub-type filter — fetch all Spell Cards
    ({ cards, total } = await fetchYGOCards("Spell Card", perPage, offset));
  } else if (selectedSubtypes.length === 1) {
    // Single sub-type filter — pass it as the `race` param to the API
    ({ cards, total } = await fetchYGOCards(
      "Spell Card",
      perPage,
      offset,
      selectedSubtypes[0],
    ));
  } else {
    // Multiple sub-types — fetch each in parallel and merge
    const perSubtype = Math.ceil(perPage / selectedSubtypes.length);
    const results = await Promise.all(
      selectedSubtypes.map((s) =>
        fetchYGOCards("Spell Card", perSubtype, offset, s),
      ),
    );
    cards = results.flatMap((r) => r.cards).slice(0, perPage);
    total = results.reduce((sum, r) => sum + r.total, 0);
  }

  const totalPages = Math.ceil(total / perPage);
  const effectivePage = Math.min(page, Math.max(1, totalPages));
  const subtypeQuery = selectedSubtypes
    .map((s) => `&subtype=${encodeURIComponent(s)}`)
    .join("");

  const mapped = cards.map((c) => {
    const setPrices = (c.card_sets ?? [])
      .map((s) => parseFloat(s.set_price))
      .filter((p) => !isNaN(p) && p > 0);
    return {
      id: String(c.id),
      name: c.name,
      imageUrl: c.card_images[0]?.id ? ygoImage(c.card_images[0].id, true) : "",
      type: c.race,
      rarity: c.card_sets?.[0]?.set_rarity,
      price: c.card_prices?.[0]?.tcgplayer_price,
      ebayPrice: c.card_prices?.[0]?.ebay_price,
      minPrice: setPrices.length > 0 ? Math.min(...setPrices) : undefined,
      maxPrice: setPrices.length > 0 ? Math.max(...setPrices) : undefined,
    };
  });

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              Spell Cards
            </h1>
            <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
              Yu-Gi-Oh! &mdash; {total.toLocaleString()} cards
            </p>
          </div>
          <CategoryHero images={SPELL_HERO_IMAGES} />
        </div>

        <Suspense fallback={null}>
          <TypeFilter options={SPELL_TYPES} selected={selectedSubtypes} />
        </Suspense>

        <CardGrid cards={mapped} game="yugioh" />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {effectivePage > 1 && (
              <a
                href={`?page=${effectivePage - 1}${subtypeQuery}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  background: "#0E1220",
                  color: "#F0F2FF",
                  border: "1px solid #1A2035",
                }}
              >
                Previous
              </a>
            )}
            <span className="text-sm" style={{ color: "#7A8BA8" }}>
              Page {effectivePage} of {totalPages}
            </span>
            {effectivePage < totalPages && (
              <a
                href={`?page=${effectivePage + 1}${subtypeQuery}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  background: "#0E1220",
                  color: "#F0F2FF",
                  border: "1px solid #1A2035",
                }}
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
