"use client";

// Individual list detail page — shows all cards in a specific list.
// Features:
//   - List view: card image | name + game badge | price when added | current price | +/- diff | remove
//   - Total value tally at the top (sum of current prices, refreshed on load)
//   - Remove individual cards

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getList,
  getListItems,
  removeFromList,
  type ListMeta,
  type ListItem,
} from "@/lib/firestore";

// Fetch the current TCGPlayer price for a YGO card.
// Returns 0 for Pokémon cards (TCGdex has no pricing).
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

// Renders the price difference between when the card was added and now
function PriceDiff({ added, current }: { added: number; current: number | null }) {
  if (current === null) {
    return <span className="text-xs animate-pulse" style={{ color: "#7A8BA8" }}>…</span>;
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
    <span className="text-xs font-semibold" style={{ color: positive ? "#3ecf6a" : "#CC1F1F" }}>
      {positive ? "▲" : "▼"} ${Math.abs(diff).toFixed(2)}
    </span>
  );
}

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<ListMeta | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  // currentPrices: cardId → fetched live price (null = still loading)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number | null>>({});

  // Redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin");
  }, [user, authLoading, router]);

  // Load list metadata + items from Firestore
  useEffect(() => {
    if (!user) return;

    async function load() {
      const [listMeta, listItems] = await Promise.all([
        getList(user!.uid, listId),
        getListItems(user!.uid, listId),
      ]);

      if (!listMeta) {
        // List doesn't exist or doesn't belong to this user
        router.replace("/lists");
        return;
      }

      setList(listMeta);
      setItems(listItems);
      setPageLoading(false);

      // Fetch current prices in the background after items load
      listItems.forEach((item) => {
        setCurrentPrices((prev) => ({ ...prev, [item.cardId]: null }));
        fetchCurrentPrice(item.game, item.cardId).then((price) => {
          setCurrentPrices((prev) => ({ ...prev, [item.cardId]: price }));
        });
      });
    }

    load();
  }, [user, listId, router]);

  const handleRemove = async (cardId: string) => {
    if (!user) return;
    setRemoving(cardId);
    await removeFromList(user.uid, listId, cardId);
    setItems((prev) => prev.filter((i) => i.cardId !== cardId));
    setRemoving(null);
  };

  // Sum current prices (treats null / unloaded prices as 0 for the running total)
  const totalCurrentValue = items.reduce((sum, item) => {
    const price = currentPrices[item.cardId];
    return sum + (price ?? 0);
  }, 0);

  // Sum prices snapshotted when each card was added
  const totalAddedValue = items.reduce(
    (sum, item) => sum + (item.priceWhenAdded ?? 0),
    0
  );

  // True once every card in the list has a resolved current price (even if 0)
  const allPricesLoaded =
    items.length > 0 &&
    items.every((item) => currentPrices[item.cardId] !== null);

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#080B14" }}>
        <p className="animate-pulse text-sm" style={{ color: "#7A8BA8" }}>Loading list…</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-1 text-sm mb-6 transition hover:underline"
          style={{ color: "#7A8BA8" }}
        >
          ← Back to My Lists
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            {list?.name}
          </h1>
          <p className="text-sm" style={{ color: "#7A8BA8" }}>
            {items.length} card{items.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Value summary strip */}
        {items.length > 0 && (
          <div
            className="rounded-xl border p-4 mb-6 flex flex-wrap gap-6"
            style={{ background: "#0E1220", borderColor: "#1A2035" }}
          >
            {/* Value when cards were added */}
            <div>
              <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>
                Total value (when added)
              </p>
              <p className="text-xl font-bold" style={{ color: "#3ecf6a" }}>
                {totalAddedValue > 0 ? `$${totalAddedValue.toFixed(2)}` : "N/A"}
              </p>
            </div>

            {/* Current total value */}
            <div>
              <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>
                Current total value
              </p>
              <p className="text-xl font-bold" style={{ color: "#F0F2FF" }}>
                {!allPricesLoaded ? (
                  <span className="text-sm animate-pulse" style={{ color: "#7A8BA8" }}>
                    Fetching prices…
                  </span>
                ) : totalCurrentValue > 0 ? (
                  `$${totalCurrentValue.toFixed(2)}`
                ) : (
                  "N/A"
                )}
              </p>
            </div>

            {/* Overall diff */}
            {allPricesLoaded && totalAddedValue > 0 && totalCurrentValue > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>
                  Overall change
                </p>
                <p
                  className="text-xl font-bold"
                  style={{
                    color:
                      totalCurrentValue >= totalAddedValue ? "#3ecf6a" : "#CC1F1F",
                  }}
                >
                  {totalCurrentValue >= totalAddedValue ? "▲" : "▼"} $
                  {Math.abs(totalCurrentValue - totalAddedValue).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#1A2035", background: "#0E1220" }}
          >
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm mb-4" style={{ color: "#7A8BA8" }}>
              This list is empty. Add cards from any card detail page.
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

        {/* Items list */}
        {items.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#1A2035" }}>
            {items.map((item, i) => {
              const cardHref =
                item.game === "yugioh"
                  ? `/yugioh/card/${item.cardId}`
                  : `/pokemon/card/${item.cardId}`;
              const currentPrice = currentPrices[item.cardId] ?? null;

              return (
                <div
                  key={item.cardId}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.02]"
                  style={{
                    background: "#0E1220",
                    borderBottom: i < items.length - 1 ? "1px solid #1A2035" : "none",
                  }}
                >
                  {/* Card image */}
                  <Link href={cardHref} className="shrink-0">
                    <img
                      src={item.cardImage}
                      alt={item.cardName}
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
                        {item.cardName}
                      </p>
                    </Link>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background:
                          item.game === "yugioh"
                            ? "rgba(255,122,0,0.15)"
                            : "rgba(0,170,255,0.15)",
                        color: item.game === "yugioh" ? "#FF7A00" : "#00AAFF",
                      }}
                    >
                      {item.game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon"}
                    </span>
                  </div>

                  {/* Price when added */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>
                      Added {item.dateAdded.toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#3ecf6a" }}>
                      {item.priceWhenAdded > 0
                        ? `$${item.priceWhenAdded.toFixed(2)}`
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
                    <PriceDiff added={item.priceWhenAdded} current={currentPrice} />
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item.cardId)}
                    disabled={removing === item.cardId}
                    title="Remove from list"
                    className="shrink-0 rounded-lg px-2 py-1 text-xs transition hover:bg-red-900/20 disabled:opacity-40"
                    style={{ color: "#CC1F1F", border: "1px solid rgba(204,31,31,0.3)" }}
                  >
                    {removing === item.cardId ? "…" : "Remove"}
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
