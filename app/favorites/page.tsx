"use client";

// Favorites page — shows all cards the user has hearted, in a list view.
// Supports both generic card favorites and printing-specific favorites.
// Each row: card image | name + set/game badge | price when added | current price | +/- diff | remove

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getFavorites, removeFavorite, type FavoriteCard } from "@/lib/firestore";
import { getRarityColor } from "@/lib/rarityColors";

// Fetch the current price for a card.
// Pokémon: fetches from TCGdex and picks the best TCGPlayer market price across all variants.
// YGO: fetches from YGOPRODeck; if setCode is provided, uses that printing's price.
async function fetchCurrentPrice(
  game: "yugioh" | "pokemon",
  cardId: string,
  setCode?: string
): Promise<number> {
  try {
    if (game === "pokemon") {
      const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardId}`);
      if (!res.ok) return 0;
      const card = await res.json();
      const tcg = card?.pricing?.tcgplayer;
      if (!tcg) return 0;
      let best = 0;
      for (const variant of Object.values(tcg)) {
        const price = (variant as { marketPrice?: number } | undefined)?.marketPrice;
        if (price != null && price > best) best = price;
      }
      return best;
    }
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const card = data.data?.[0];
    if (!card) return 0;
    if (setCode) {
      const printing = (card.card_sets as { set_code: string; set_price: string }[] | undefined)
        ?.find((s) => s.set_code === setCode);
      if (printing) return parseFloat(printing.set_price ?? "0") || 0;
    }
    return parseFloat(card.card_prices?.[0]?.tcgplayer_price ?? "0") || 0;
  } catch {
    return 0;
  }
}

// Unique key per favorite entry (handles multiple printings of the same card)
function favKey(card: FavoriteCard): string {
  return card.setCode ? `${card.cardId}__${card.setCode}` : card.cardId;
}

// Format a price diff with a ▲/▼ prefix and appropriate color
function PriceDiff({ added, current }: { added: number; current: number | null }) {
  if (current === null) {
    return (
      <span className="text-xs animate-pulse" style={{ color: "#7A8BA8" }}>
        …
      </span>
    );
  }
  if (added === 0 && current === 0) {
    return <span className="text-xs" style={{ color: "#7A8BA8" }}>N/A</span>;
  }
  const diff = current - added;
  if (Math.abs(diff) < 0.01) {
    return <span className="text-xs" style={{ color: "#7A8BA8" }}>—</span>;
  }
  const positive = diff > 0;
  return (
    <span
      className="text-xs font-semibold"
      style={{ color: positive ? "#3ecf6a" : "#CC1F1F" }}
    >
      {positive ? "▲" : "▼"} ${Math.abs(diff).toFixed(2)}
    </span>
  );
}

type SortKey = "newest" | "oldest" | "name_az" | "name_za" | "price_asc" | "price_desc" | "change_asc" | "change_desc";
type GameFilter = "all" | "yugioh" | "pokemon";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name_az", label: "Name A → Z" },
  { value: "name_za", label: "Name Z → A" },
  { value: "price_asc", label: "Price (Low → High)" },
  { value: "price_desc", label: "Price (High → Low)" },
  { value: "change_asc", label: "Price Change ↓" },
  { value: "change_desc", label: "Price Change ↑" },
];

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  // keyed by favKey(card) — null means still loading
  const [currentPrices, setCurrentPrices] = useState<Record<string, number | null>>({});
  const [removing, setRemoving] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin");
  }, [user, authLoading, router]);

  // Load favorites from Firestore
  useEffect(() => {
    if (!user) return;
    getFavorites(user.uid).then((cards) => {
      setFavorites(cards);
      setPageLoading(false);

      // Fetch current prices in the background
      cards.forEach((card) => {
        const key = favKey(card);
        setCurrentPrices((prev) => ({ ...prev, [key]: null }));
        fetchCurrentPrice(card.game, card.cardId, card.setCode).then((price) => {
          setCurrentPrices((prev) => ({ ...prev, [key]: price }));
        });
      });
    });
  }, [user]);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleRemove = async (e: React.MouseEvent, card: FavoriteCard) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const key = favKey(card);
    setRemoving(key);
    await removeFavorite(user.uid, card.cardId, card.setCode);
    setFavorites((prev) => prev.filter((c) => favKey(c) !== key));
    setRemoving(null);
  };

  // Apply search + game filter + sort
  const displayed = useMemo(() => {
    let list = [...favorites];

    if (gameFilter !== "all") {
      list = list.filter((c) => c.game === gameFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.cardName.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return b.dateAdded.getTime() - a.dateAdded.getTime();
        case "oldest":
          return a.dateAdded.getTime() - b.dateAdded.getTime();
        case "name_az":
          return a.cardName.localeCompare(b.cardName);
        case "name_za":
          return b.cardName.localeCompare(a.cardName);
        case "price_asc": {
          const pa = currentPrices[favKey(a)] ?? a.priceWhenAdded;
          const pb = currentPrices[favKey(b)] ?? b.priceWhenAdded;
          return pa - pb;
        }
        case "price_desc": {
          const pa = currentPrices[favKey(a)] ?? a.priceWhenAdded;
          const pb = currentPrices[favKey(b)] ?? b.priceWhenAdded;
          return pb - pa;
        }
        case "change_asc": {
          const da = (currentPrices[favKey(a)] ?? a.priceWhenAdded) - a.priceWhenAdded;
          const db2 = (currentPrices[favKey(b)] ?? b.priceWhenAdded) - b.priceWhenAdded;
          return da - db2;
        }
        case "change_desc": {
          const da = (currentPrices[favKey(a)] ?? a.priceWhenAdded) - a.priceWhenAdded;
          const db2 = (currentPrices[favKey(b)] ?? b.priceWhenAdded) - b.priceWhenAdded;
          return db2 - da;
        }
        default:
          return 0;
      }
    });

    return list;
  }, [favorites, gameFilter, search, sortKey, currentPrices]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort";

  if (authLoading || pageLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#080B14" }}
      >
        <p className="animate-pulse text-sm" style={{ color: "#7A8BA8" }}>
          Loading favorites…
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            My Favorites
          </h1>
          <p className="text-sm" style={{ color: "#7A8BA8" }}>
            {favorites.length === 0
              ? "No favorites yet."
              : `${favorites.length} card${favorites.length === 1 ? "" : "s"} saved`}
          </p>
        </div>

        {/* Filters row */}
        {favorites.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5 items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                style={{ color: "#7A8BA8" }}
              >
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search favorites…"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: "#0E1220",
                  border: "1px solid #1A2035",
                  color: "#F0F2FF",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "#7A8BA8" }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Game filter pills */}
            {(["all", "yugioh", "pokemon"] as GameFilter[]).map((g) => {
              const active = gameFilter === g;
              const accent = g === "yugioh" ? "#FF7A00" : g === "pokemon" ? "#00AAFF" : "#7A8BA8";
              const label = g === "all" ? "All Games" : g === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon";
              return (
                <button
                  key={g}
                  onClick={() => setGameFilter(g)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition"
                  style={{
                    background: active ? `${accent}22` : "#0E1220",
                    border: `1px solid ${active ? accent : "#1A2035"}`,
                    color: active ? accent : "#7A8BA8",
                  }}
                >
                  {label}
                </button>
              );
            })}

            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: "#0E1220",
                  border: "1px solid #1A2035",
                  color: "#F0F2FF",
                  minWidth: 160,
                }}
              >
                <span style={{ color: "#7A8BA8" }}>Sort:</span>
                <span className="flex-1 text-left" style={{ color: "#FF7A00" }}>{sortLabel}</span>
                <span style={{ color: "#7A8BA8", fontSize: 10 }}>{sortOpen ? "▲" : "▼"}</span>
              </button>
              {sortOpen && (
                <div
                  className="absolute top-full right-0 mt-1 rounded-xl z-20 p-2"
                  style={{
                    background: "#0E1220",
                    border: "1px solid #1A2035",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    minWidth: 190,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition"
                      style={{
                        background: sortKey === opt.value ? "#FF7A0018" : "transparent",
                        color: sortKey === opt.value ? "#FF7A00" : "#7A8BA8",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {favorites.length === 0 && (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#1A2035", background: "#0E1220" }}
          >
            <p className="text-4xl mb-4">♡</p>
            <p className="text-sm mb-4" style={{ color: "#7A8BA8" }}>
              Heart any card on its detail page to save it here.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/yugioh/monsters"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{ background: "#FF7A00", color: "#080B14" }}
              >
                Browse Yu-Gi-Oh!
              </Link>
              <Link
                href="/pokemon/pokemon"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{ background: "#00AAFF", color: "#080B14" }}
              >
                Browse Pokémon
              </Link>
            </div>
          </div>
        )}

        {/* No results from filter */}
        {favorites.length > 0 && displayed.length === 0 && (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ borderColor: "#1A2035", background: "#0E1220" }}
          >
            <p className="text-sm" style={{ color: "#7A8BA8" }}>
              No cards match your filters.
            </p>
          </div>
        )}

        {/* Favorites list */}
        {displayed.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#1A2035" }}
          >
            {displayed.map((card, i) => {
              const key = favKey(card);
              const currentPrice = currentPrices[key] ?? null;
              const cardHref =
                card.game === "yugioh"
                  ? `/yugioh/card/${card.cardId}?from=${encodeURIComponent("/favorites")}`
                  : `/pokemon/card/${card.cardId}?from=${encodeURIComponent("/favorites")}`;

              // Printing-specific badge info
              const rarityColor = card.setRarity
                ? getRarityColor(card.setRarity, "yugioh")
                : null;

              return (
                <Link
                  key={key}
                  href={cardHref}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.04] cursor-pointer"
                  style={{
                    background: "#0E1220",
                    borderBottom: i < displayed.length - 1 ? "1px solid #1A2035" : "none",
                    display: "flex",
                  }}
                >
                  {/* Card image */}
                  <div className="shrink-0">
                    <img
                      src={card.cardImage}
                      alt={card.cardName}
                      className="rounded object-contain"
                      style={{ width: 56, height: 80 }}
                    />
                  </div>

                  {/* Name + badge */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "#F0F2FF" }}
                    >
                      {card.cardName}
                    </p>

                    {/* Printing-specific: show set name + rarity */}
                    {card.setCode && card.setName ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,122,0,0.1)",
                            color: "#FF7A00",
                          }}
                        >
                          {card.setName}
                        </span>
                        {card.setRarity && rarityColor && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `${rarityColor}18`,
                              color: rarityColor,
                            }}
                          >
                            {card.setRarity}
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Generic favorite — just show game badge */
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block"
                        style={{
                          background:
                            card.game === "yugioh"
                              ? "rgba(255,122,0,0.15)"
                              : "rgba(0,170,255,0.15)",
                          color: card.game === "yugioh" ? "#FF7A00" : "#00AAFF",
                        }}
                      >
                        {card.game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon"}
                      </span>
                    )}
                  </div>

                  {/* Price when added */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>
                      Added {card.dateAdded.toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#3ecf6a" }}>
                      {card.priceWhenAdded > 0
                        ? `$${card.priceWhenAdded.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>

                  {/* Current price */}
                  <div className="text-right shrink-0 w-16">
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>Now</p>
                    <p className="text-sm font-semibold" style={{ color: "#F0F2FF" }}>
                      {currentPrice === null ? (
                        <span className="animate-pulse text-xs" style={{ color: "#7A8BA8" }}>…</span>
                      ) : currentPrice > 0 ? (
                        `$${currentPrice.toFixed(2)}`
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>

                  {/* Price diff */}
                  <div className="shrink-0 w-14 text-right">
                    <PriceDiff
                      added={card.priceWhenAdded}
                      current={currentPrices[key] ?? null}
                    />
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, card)}
                    disabled={removing === key}
                    title="Remove from favorites"
                    className="shrink-0 text-lg transition hover:scale-110 disabled:opacity-40"
                    style={{ color: "#CC1F1F" }}
                  >
                    {removing === key ? "…" : "♥"}
                  </button>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
