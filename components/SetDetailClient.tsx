"use client";

import { useState, useMemo } from "react";
import CardGrid from "./CardGrid";

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

function getPrice(card: SetCard): number {
  // Match what CardItem displays: prefer maxPrice (set-specific high end),
  // then minPrice, then generic TCGPlayer price
  if (card.maxPrice != null && card.maxPrice > 0) return card.maxPrice;
  if (card.minPrice != null && card.minPrice > 0) return card.minPrice;
  const p = parseFloat(card.price ?? "0");
  return isNaN(p) ? 0 : p;
}

export default function SetDetailClient({ cards }: { cards: SetCard[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [page, setPage] = useState(1);

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

  // Strip cardType before passing to CardGrid
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

      <CardGrid cards={gridCards} game="yugioh" />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => { setPage((p) => p - 1); window.scrollTo(0, 0); }}
            disabled={effectivePage === 1}
            className="px-3 py-1.5 rounded text-sm disabled:opacity-30"
            style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: "#7A8BA8" }}>
            Page {effectivePage} of {totalPages}
          </span>
          <button
            onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }}
            disabled={effectivePage === totalPages}
            className="px-3 py-1.5 rounded text-sm disabled:opacity-30"
            style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
