"use client";

// Favorites page — shows all cards the user has hearted, in a list view.
// Each row: card image | name + game badge | price when added | current price | +/- diff | remove

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getFavorites, removeFavorite, type FavoriteCard } from "@/lib/firestore";

// Fetch the current TCGPlayer price for a YGO card from the YGOPRODeck API.
// Returns 0 for Pokémon cards since TCGdex doesn't provide pricing.
async function fetchCurrentPrice(
  game: "yugioh" | "pokemon",
  cardId: string
): Promise<number> {
  if (game === "pokemon") return 0;
  try {
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return parseFloat(data.data?.[0]?.card_prices?.[0]?.tcgplayer_price ?? "0");
  } catch {
    return 0;
  }
}

// Format a price diff with a + or - prefix and appropriate color
function PriceDiff({ added, current }: { added: number; current: number | null }) {
  // Show a spinner while current price is still loading
  if (current === null) {
    return (
      <span className="text-xs animate-pulse" style={{ color: "#7A8BA8" }}>
        …
      </span>
    );
  }
  // No pricing data for this card (Pokémon)
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

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  // currentPrices maps cardId → current price (null = still fetching)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number | null>>({});
  const [removing, setRemoving] = useState<string | null>(null);

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

      // Fetch current prices in the background; null means "still loading" for the spinner
      cards.forEach((card) => {
        setCurrentPrices((prev) => ({ ...prev, [card.cardId]: null }));
        fetchCurrentPrice(card.game, card.cardId).then((price) => {
          setCurrentPrices((prev) => ({ ...prev, [card.cardId]: price }));
        });
      });
    });
  }, [user]);

  const handleRemove = async (cardId: string) => {
    if (!user) return;
    setRemoving(cardId);
    await removeFavorite(user.uid, cardId);
    // Remove from local state without re-fetching the whole list
    setFavorites((prev) => prev.filter((c) => c.cardId !== cardId));
    setRemoving(null);
  };

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
        <div className="mb-8">
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

        {/* Favorites list */}
        {favorites.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#1A2035" }}
          >
            {favorites.map((card, i) => {
              const currentPrice = currentPrices[card.cardId] ?? null;
              const cardHref =
                card.game === "yugioh"
                  ? `/yugioh/card/${card.cardId}`
                  : `/pokemon/card/${card.cardId}`;

              return (
                <div
                  key={card.cardId}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.02]"
                  style={{
                    background: "#0E1220",
                    borderBottom:
                      i < favorites.length - 1 ? "1px solid #1A2035" : "none",
                  }}
                >
                  {/* Card image */}
                  <Link href={cardHref} className="shrink-0">
                    <img
                      src={card.cardImage}
                      alt={card.cardName}
                      className="rounded object-contain"
                      style={{ width: 40, height: 56 }}
                    />
                  </Link>

                  {/* Name + game badge */}
                  <div className="flex-1 min-w-0">
                    <Link href={cardHref}>
                      <p
                        className="text-sm font-semibold truncate hover:underline"
                        style={{ color: "#F0F2FF" }}
                      >
                        {card.cardName}
                      </p>
                    </Link>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background:
                          card.game === "yugioh"
                            ? "rgba(255,122,0,0.15)"
                            : "rgba(0,170,255,0.15)",
                        color:
                          card.game === "yugioh" ? "#FF7A00" : "#00AAFF",
                      }}
                    >
                      {card.game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon"}
                    </span>
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
                  <div className="text-right shrink-0 hidden md:block w-20">
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
                  <div className="shrink-0 hidden md:block w-16 text-right">
                    <PriceDiff
                      added={card.priceWhenAdded}
                      current={currentPrices[card.cardId] ?? null}
                    />
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(card.cardId)}
                    disabled={removing === card.cardId}
                    title="Remove from favorites"
                    className="shrink-0 text-lg transition hover:scale-110 disabled:opacity-40"
                    style={{ color: "#CC1F1F" }}
                  >
                    {removing === card.cardId ? "…" : "♥"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
