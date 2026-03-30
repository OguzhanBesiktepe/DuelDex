"use client";

// SetDetailClient — client-side filter + sort + pagination for a single YGO set's cards.
// Receives the full card list server-side and handles All / Monsters / Spells / Traps tabs
// plus price sorting, all without further network requests.

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import CardGrid from "./CardGrid";
import Pagination from "./Pagination";

interface SetCard {
  id: string;
  name: string;
  imageUrl: string;
  type?: string;
  cardType: string; // raw API type e.g. "Effect Monster", "Spell Card"
  rarity?: string;
  price?: string;
  ebayPrice?: string;
  minPrice?: number;
  maxPrice?: number;
}

const PER_PAGE = 24;

type TypeFilter = "all" | "monsters" | "spells" | "traps";
type SortOption = "default" | "price-desc" | "price-asc";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "monsters", label: "Monsters" },
  { value: "spells", label: "Spells" },
  { value: "traps", label: "Traps" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "price-asc", label: "Price: Low → High" },
];

// Helper used for price sorting — mirrors the display priority in CardItem.
function getPrice(card: SetCard): number {
  // Match what CardItem displays: prefer maxPrice (set-specific high end),
  // then minPrice, then generic TCGPlayer price
  if (card.maxPrice != null && card.maxPrice > 0) return card.maxPrice;
  if (card.minPrice != null && card.minPrice > 0) return card.minPrice;
  const p = parseFloat(card.price ?? "0");
  return isNaN(p) ? 0 : p;
}

export default function SetDetailClient({ cards, setCode, initialPage = 1 }: { cards: SetCard[]; setCode: string; initialPage?: number }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [page, setPage] = useState(initialPage);

  function changePage(newPage: number) {
    setPage(newPage);
    router.replace(`?page=${newPage}`, { scroll: false });
    window.scrollTo(0, 0);
  }

  const filtered = useMemo(() => {
    let list = [...cards];

    if (typeFilter === "monsters") {
      list = list.filter((c) => c.cardType.toLowerCase().includes("monster"));
    } else if (typeFilter === "spells") {
      list = list.filter((c) => c.cardType.toLowerCase().includes("spell"));
    } else if (typeFilter === "traps") {
      list = list.filter((c) => c.cardType.toLowerCase().includes("trap"));
    }

    if (sort === "price-desc") {
      list = [...list].sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sort === "price-asc") {
      list = [...list].sort((a, b) => getPrice(a) - getPrice(b));
    }

    return list;
  }, [cards, typeFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const effectivePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((effectivePage - 1) * PER_PAGE, effectivePage * PER_PAGE);

  function handleTypeFilter(t: TypeFilter) {
    setTypeFilter(t);
    setPage(1);
  }

  function handleSort(s: SortOption) {
    setSort(s);
    setPage(1);
  }

  // cardType was only needed for filtering here; CardGrid doesn't need it
  const gridCards = paginated.map(({ cardType: _, ...rest }) => rest);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Type filters */}
        <div className="flex gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleTypeFilter(f.value)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                background: typeFilter === f.value ? "#FF7A0022" : "#0E1220",
                color: typeFilter === f.value ? "#FF7A00" : "#7A8BA8",
                border: `1px solid ${typeFilter === f.value ? "#FF7A0044" : "#1A2035"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 hidden sm:block" style={{ background: "#1A2035" }} />

        {/* Sort */}
        <div className="flex gap-2">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSort(s.value)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                background: sort === s.value ? "#FF7A0022" : "#0E1220",
                color: sort === s.value ? "#FF7A00" : "#7A8BA8",
                border: `1px solid ${sort === s.value ? "#FF7A0044" : "#1A2035"}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-sm" style={{ color: "#7A8BA8" }}>
          {filtered.length} cards
        </span>
      </div>

      <CardGrid cards={gridCards} game="yugioh" from={`/yugioh/sets/${encodeURIComponent(setCode)}?page=${effectivePage}`} />

      {/* Pagination */}
      <Pagination
        page={effectivePage}
        totalPages={totalPages}
        accent="#FF7A00"
        onPage={changePage}
      />
    </div>
  );
}
