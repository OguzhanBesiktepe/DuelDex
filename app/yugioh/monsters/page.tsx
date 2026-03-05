import { Suspense } from "react";
import CardGrid from "@/components/CardGrid";
import MonsterFilter from "@/components/MonsterFilter";
import AttributeFilter from "@/components/AttributeFilter";
import LevelFilter from "@/components/LevelFilter";
import { MONSTER_TYPES } from "@/lib/monsterTypes";
import { fetchYGOCards } from "@/lib/yugioh";

const ALL_MONSTER_TYPES = MONSTER_TYPES.map((t) => t.value);

// Deterministic shuffle: same page always produces same card order
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchMonsterCards(
  types: string[],
  page: number,
  attribute?: string,
  level?: number,
) {
  const isAll = types.length === 0;
  const typesToFetch = isAll ? ALL_MONSTER_TYPES : types;
  const perPage = 24;
  const perType = Math.ceil(perPage / typesToFetch.length);
  const offset = (page - 1) * perType;

  const results = await Promise.all(
    typesToFetch.map((type) => fetchYGOCards(type, perType, offset, undefined, attribute, level))
  );

  const merged = seededShuffle(results.flatMap((r) => r.cards), page).slice(0, perPage);
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const totalPages = Math.ceil(total / perPage);

  return { cards: merged, total, totalPages };
}

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string | string[]; attribute?: string; level?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const rawTypes = params.type;
  const selectedTypes: string[] = rawTypes
    ? Array.isArray(rawTypes) ? rawTypes : [rawTypes]
    : [];

  const selectedAttribute = params.attribute ?? "";
  const selectedLevel = params.level ? parseInt(params.level, 10) : null;

  const { cards, total, totalPages } = await fetchMonsterCards(
    selectedTypes,
    page,
    selectedAttribute || undefined,
    selectedLevel ?? undefined,
  );

  const mapped = cards.map((c) => ({
    id: String(c.id),
    name: c.name,
    imageUrl: c.card_images[0]?.image_url_small ?? c.card_images[0]?.image_url ?? "",
    type: c.race,
    rarity: c.card_sets?.[0]?.set_rarity,
    price: c.card_prices?.[0]?.tcgplayer_price,
    ebayPrice: c.card_prices?.[0]?.ebay_price,
  }));

  const typeQuery = selectedTypes.map((t) => `&type=${encodeURIComponent(t)}`).join("");
  const filterQuery =
    typeQuery +
    (selectedAttribute ? `&attribute=${encodeURIComponent(selectedAttribute)}` : "") +
    (selectedLevel ? `&level=${selectedLevel}` : "");

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h1
            className="text-2xl font-bold"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            Monster Cards
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
            Yu-Gi-Oh! &mdash; {total.toLocaleString()} cards
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Suspense fallback={null}>
              <MonsterFilter selected={selectedTypes} />
            </Suspense>
            <Suspense fallback={null}>
              <AttributeFilter selected={selectedAttribute} />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <LevelFilter selected={selectedLevel} />
          </Suspense>
        </div>

        <CardGrid cards={mapped} game="yugioh" />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${filterQuery}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
              >
                Previous
              </a>
            )}
            <span className="text-sm" style={{ color: "#7A8BA8" }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${filterQuery}`}
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
