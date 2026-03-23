"use client";

// PokemonSetDetailClient — client component for the set detail page.
// Receives all cards with full metadata (types, rarity) fetched server-side,
// then handles energy-type filtering, rarity filtering, and pagination in-memory.

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { POKEMON_ENERGY_TYPES } from "@/lib/pokemonTypes";
import { getRarityColor } from "@/lib/rarityColors";

const PER_PAGE = 24;

export interface SetCard {
  id: string;
  name: string;
  imageUrl: string;
  types?: string[];
  rarity?: string;
  stage?: string;
  price?: string;
}

export default function PokemonSetDetailClient({ cards }: { cards: SetCard[] }) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>("");
  const [page, setPage] = useState(1);

  // Collect unique rarities present in this set for the rarity filter
  const uniqueRarities = useMemo(() => {
    const seen = new Set<string>();
    for (const c of cards) {
      if (c.rarity && /[a-zA-Z]/.test(c.rarity)) seen.add(c.rarity);
    }
    // Sort by rarity tier (Common → Secret) using the color map as a proxy
    return Array.from(seen).sort();
  }, [cards]);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const typeMatch =
        selectedTypes.length === 0 ||
        selectedTypes.some((t) => c.types?.includes(t));
      const rarityMatch = !selectedRarity || c.rarity === selectedRarity;
      return typeMatch && rarityMatch;
    });
  }, [cards, selectedTypes, selectedRarity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const effectivePage = Math.min(page, totalPages);
  const pageCards = filtered.slice((effectivePage - 1) * PER_PAGE, effectivePage * PER_PAGE);

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
    setPage(1);
  }

  function clearTypes() {
    setSelectedTypes([]);
    setPage(1);
  }

  function selectRarity(value: string) {
    setSelectedRarity((prev) => (prev === value ? "" : value));
    setPage(1);
  }

  // Only show energy types that actually appear in this set
  const availableTypes = POKEMON_ENERGY_TYPES.filter((t) =>
    cards.some((c) => c.types?.includes(t.value)),
  );

  return (
    <div>
      {/* ── Filters ── */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: "#0E1220", border: "1px solid #1A2035" }}
      >
        {/* Energy type filter — only shown if the set has typed Pokémon */}
        {availableTypes.length > 0 && (
          <div className="mb-4">
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "#7A8BA8" }}
            >
              Energy Type
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearTypes}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: selectedTypes.length === 0 ? "#00AAFF25" : "#1A2035",
                  color: selectedTypes.length === 0 ? "#00AAFF" : "#7A8BA8",
                  border: selectedTypes.length === 0 ? "1px solid #00AAFF60" : "1px solid #1A2035",
                }}
              >
                All Types
              </button>
              {availableTypes.map((t) => {
                const active = selectedTypes.includes(t.value);
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleType(t.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1"
                    style={{
                      background: active ? `${t.color}25` : "#1A2035",
                      color: active ? t.color : "#7A8BA8",
                      border: active ? `1px solid ${t.color}70` : "1px solid #1A2035",
                      boxShadow: active ? `0 0 8px ${t.color}30` : "none",
                    }}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rarity filter */}
        {uniqueRarities.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "#7A8BA8" }}
            >
              Rarity
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedRarity(""); setPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: !selectedRarity ? "#00AAFF25" : "#1A2035",
                  color: !selectedRarity ? "#00AAFF" : "#7A8BA8",
                  border: !selectedRarity ? "1px solid #00AAFF60" : "1px solid #1A2035",
                }}
              >
                All Rarities
              </button>
              {uniqueRarities.map((r) => {
                const active = selectedRarity === r;
                const color = getRarityColor(r, "pokemon");
                return (
                  <button
                    key={r}
                    onClick={() => selectRarity(r)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active ? `${color}25` : "#1A2035",
                      color: active ? color : "#7A8BA8",
                      border: active ? `1px solid ${color}70` : "1px solid #1A2035",
                      boxShadow: active ? `0 0 8px ${color}30` : "none",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Results count ── */}
      <p className="text-xs mb-4" style={{ color: "#7A8BA8" }}>
        {filtered.length === cards.length
          ? `${cards.length} cards`
          : `${filtered.length} of ${cards.length} cards`}
      </p>

      {/* ── Card grid ── */}
      {pageCards.length === 0 ? (
        <div
          className="flex items-center justify-center py-24 text-sm"
          style={{ color: "#7A8BA8" }}
        >
          No cards match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {pageCards.map((card) => {
            const rarityColor = getRarityColor(card.rarity, "pokemon");
            return (
              <Link key={card.id} href={`/pokemon/card/${card.id}`} className="group block">
                <div
                  className="relative rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: "#0E1220",
                    border: `2px solid ${rarityColor}90`,
                    boxShadow: `0 0 16px ${rarityColor}25`,
                  }}
                >
                  <div className="relative w-full aspect-[3/4] bg-[#080B14]">
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <p
                      className="text-sm font-semibold truncate mb-1"
                      style={{ color: "#F0F2FF" }}
                    >
                      {card.name}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      {card.types && card.types.length > 0 && (
                        <span className="text-[11px] truncate" style={{ color: "#7A8BA8" }}>
                          {card.types.join(" / ")}
                        </span>
                      )}
                      {card.rarity && /[a-zA-Z]/.test(card.rarity) && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                          style={{
                            background: `${rarityColor}20`,
                            color: rarityColor,
                            border: `1px solid ${rarityColor}50`,
                          }}
                        >
                          {card.rarity}
                        </span>
                      )}
                    </div>
                    {card.price && (
                      <p className="text-xs font-bold mt-1.5" style={{ color: "#3ecf6a" }}>
                        ${parseFloat(card.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 2px ${rarityColor}, 0 0 32px ${rarityColor}45` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
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
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
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
