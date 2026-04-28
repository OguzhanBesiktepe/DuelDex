"use client";

// Portfolio Analytics page — aggregates all of the user's lists into one view.
// Shows summary stats (total invested vs current value) and the full PortfolioChart
// fed with every card across every list, plus a per-list breakdown at the bottom.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getLists,
  getListItems,
  type ListMeta,
  type ListItem,
} from "@/lib/firestore";
import PortfolioChart from "@/components/PortfolioChart";

function itemKey(item: ListItem): string {
  return item.setCode ? `${item.cardId}__${item.setCode}` : item.cardId;
}

async function fetchCurrentPrice(
  game: "yugioh" | "pokemon",
  cardId: string,
  setCode?: string,
): Promise<number> {
  try {
    if (game === "pokemon") {
      const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardId}`);
      if (!res.ok) return 0;
      const card = await res.json();
      const tcg = card?.pricing?.tcgplayer;
      if (tcg) {
        let best = 0;
        for (const variant of Object.values(tcg)) {
          const price = (variant as { marketPrice?: number } | undefined)?.marketPrice;
          if (price != null && price > best) best = price;
        }
        if (best > 0) return best;
      }
      return card?.pricing?.cardmarket?.trend ?? 0;
    }
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`,
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const card = data.data?.[0];
    if (!card) return 0;
    if (setCode) {
      const printing = (
        card.card_sets as { set_code: string; set_price: string }[] | undefined
      )?.find((s) => s.set_code === setCode);
      if (printing) return parseFloat(printing.set_price ?? "0") || 0;
    }
    return parseFloat(card.card_prices?.[0]?.tcgplayer_price ?? "0") || 0;
  } catch {
    return 0;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1"
      style={{ background: "#0E1220", borderColor: "#1A2035" }}
    >
      <p className="text-xs" style={{ color: "#7A8BA8" }}>
        {label}
      </p>
      <p
        className="text-xl font-bold"
        style={{
          color:
            positive === undefined
              ? "#F0F2FF"
              : positive
                ? "#3ecf6a"
                : "#CC1F1F",
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: "#7A8BA8" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [lists, setLists] = useState<ListMeta[]>([]);
  // All items keyed by listId so we can compute per-list stats
  const [itemsByList, setItemsByList] = useState<Record<string, ListItem[]>>({});
  const [currentPrices, setCurrentPrices] = useState<Record<string, number | null>>({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const userLists = await getLists(user!.uid);
      setLists(userLists);

      // Fetch all items from all lists in parallel
      const results = await Promise.all(
        userLists.map((l) => getListItems(user!.uid, l.id)),
      );

      const byList: Record<string, ListItem[]> = {};
      userLists.forEach((l, i) => { byList[l.id] = results[i]; });
      setItemsByList(byList);
      setPageLoading(false);

      // Deduplicate items by key before fetching prices
      const allItems = results.flat();
      const seen = new Set<string>();
      const unique = allItems.filter((item) => {
        const k = itemKey(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // Initialise all prices as null (loading)
      setCurrentPrices(
        Object.fromEntries(unique.map((i) => [itemKey(i), null])),
      );

      // Fetch prices in batches of 6 to avoid hammering the APIs
      for (let i = 0; i < unique.length; i += 6) {
        const batch = unique.slice(i, i + 6);
        await Promise.all(
          batch.map((item) =>
            fetchCurrentPrice(item.game, item.cardId, item.setCode).then(
              (price) => {
                setCurrentPrices((prev) => ({ ...prev, [itemKey(item)]: price }));
              },
            ),
          ),
        );
      }
    }
    load();
  }, [user]);

  if (authLoading || pageLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#080B14" }}
      >
        <p className="animate-pulse text-sm" style={{ color: "#7A8BA8" }}>
          Loading portfolio…
        </p>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const allItems = Object.values(itemsByList).flat();
  const totalCards = allItems.length;

  const allPricesLoaded =
    totalCards > 0 &&
    allItems.every((item) => currentPrices[itemKey(item)] !== undefined && currentPrices[itemKey(item)] !== null);

  const ygoAll = allItems.filter((i) => i.game === "yugioh");
  const pkmAll = allItems.filter((i) => i.game === "pokemon");

  const investedUSD = ygoAll.reduce((s, i) => s + (i.priceWhenAdded ?? 0), 0);
  const investedEUR = pkmAll.reduce((s, i) => s + (i.priceWhenAdded ?? 0), 0);
  const currentUSD = ygoAll.reduce((s, i) => s + (currentPrices[itemKey(i)] ?? 0), 0);
  const currentEUR = pkmAll.reduce((s, i) => s + (currentPrices[itemKey(i)] ?? 0), 0);
  const gainUSD = currentUSD - investedUSD;
  const gainEUR = currentEUR - investedEUR;

  // Per-list summary
  const listSummaries = lists.map((list) => {
    const items = itemsByList[list.id] ?? [];
    const ygo = items.filter((i) => i.game === "yugioh");
    const pkm = items.filter((i) => i.game === "pokemon");
    const listInvestedUSD = ygo.reduce((s, i) => s + (i.priceWhenAdded ?? 0), 0);
    const listInvestedEUR = pkm.reduce((s, i) => s + (i.priceWhenAdded ?? 0), 0);
    const listCurrentUSD = ygo.reduce((s, i) => s + (currentPrices[itemKey(i)] ?? 0), 0);
    const listCurrentEUR = pkm.reduce((s, i) => s + (currentPrices[itemKey(i)] ?? 0), 0);
    return {
      list,
      itemCount: items.length,
      investedUSD: listInvestedUSD,
      investedEUR: listInvestedEUR,
      currentUSD: listCurrentUSD,
      currentEUR: listCurrentEUR,
      gainUSD: listCurrentUSD - listInvestedUSD,
      gainEUR: listCurrentEUR - listInvestedEUR,
      hasUSD: ygo.length > 0,
      hasEUR: pkm.length > 0,
    };
  });

  const hasAnyCards = totalCards > 0;
  const hasUSD = ygoAll.length > 0;
  const hasEUR = pkmAll.length > 0;

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            Portfolio Analytics
          </h1>
          <p className="text-sm" style={{ color: "#7A8BA8" }}>
            {lists.length} list{lists.length === 1 ? "" : "s"} · {totalCards} card{totalCards === 1 ? "" : "s"}
          </p>
        </div>

        {/* Empty state */}
        {!hasAnyCards && (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#1A2035", background: "#0E1220" }}
          >
            <p className="text-4xl mb-4">📊</p>
            <p className="text-sm mb-4" style={{ color: "#7A8BA8" }}>
              No cards in any list yet. Add cards to a list to start tracking your portfolio.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/lists"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{ background: "#FF7A00", color: "#080B14" }}
              >
                My Lists
              </Link>
            </div>
          </div>
        )}

        {hasAnyCards && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {hasUSD && (
                <>
                  <StatCard
                    label="Invested (USD)"
                    value={`$${investedUSD.toFixed(2)}`}
                  />
                  <StatCard
                    label="Current (USD)"
                    value={
                      allPricesLoaded
                        ? `$${currentUSD.toFixed(2)}`
                        : "…"
                    }
                  />
                  <StatCard
                    label="Gain / Loss (USD)"
                    value={
                      allPricesLoaded
                        ? `${gainUSD >= 0 ? "▲" : "▼"} $${Math.abs(gainUSD).toFixed(2)}`
                        : "…"
                    }
                    positive={allPricesLoaded ? gainUSD >= 0 : undefined}
                  />
                  <StatCard
                    label="YGO Cards"
                    value={String(ygoAll.length)}
                  />
                </>
              )}
              {hasEUR && (
                <>
                  <StatCard
                    label="Invested (EUR)"
                    value={`€${investedEUR.toFixed(2)}`}
                  />
                  <StatCard
                    label="Current (EUR)"
                    value={
                      allPricesLoaded
                        ? `€${currentEUR.toFixed(2)}`
                        : "…"
                    }
                  />
                  <StatCard
                    label="Gain / Loss (EUR)"
                    value={
                      allPricesLoaded
                        ? `${gainEUR >= 0 ? "▲" : "▼"} €${Math.abs(gainEUR).toFixed(2)}`
                        : "…"
                    }
                    positive={allPricesLoaded ? gainEUR >= 0 : undefined}
                  />
                  <StatCard
                    label="Pokémon Cards"
                    value={String(pkmAll.length)}
                  />
                </>
              )}
            </div>

            {/* Portfolio chart — all items combined, shown once prices load */}
            {allPricesLoaded && (
              <PortfolioChart
                items={allItems}
                currentPrices={currentPrices}
                listName="Portfolio"
              />
            )}

            {!allPricesLoaded && (
              <div
                className="rounded-2xl border p-8 mb-6 text-center"
                style={{ background: "#0E1220", borderColor: "#1A2035" }}
              >
                <p className="animate-pulse text-sm" style={{ color: "#7A8BA8" }}>
                  Fetching current prices… chart will appear shortly
                </p>
              </div>
            )}

            {/* Per-list breakdown */}
            <div className="mb-4">
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: "#7A8BA8", textTransform: "uppercase", letterSpacing: "0.1em" }}
              >
                My Lists
              </h2>
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "#1A2035" }}
              >
                {listSummaries.length === 0 && (
                  <p className="px-5 py-4 text-sm" style={{ color: "#7A8BA8" }}>
                    No lists yet.
                  </p>
                )}
                {listSummaries.map((s, i) => (
                  <Link
                    key={s.list.id}
                    href={`/lists/${s.list.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.04]"
                    style={{
                      background: "#0E1220",
                      borderBottom:
                        i < listSummaries.length - 1
                          ? "1px solid #1A2035"
                          : "none",
                      display: "flex",
                    }}
                  >
                    {/* List name + card count */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "#F0F2FF" }}
                      >
                        {s.list.name}
                      </p>
                      <p className="text-xs" style={{ color: "#7A8BA8" }}>
                        {s.itemCount} card{s.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    {/* USD stats */}
                    {s.hasUSD && (
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs" style={{ color: "#7A8BA8" }}>
                          USD
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#3ecf6a" }}
                        >
                          ${s.investedUSD.toFixed(2)}
                        </p>
                        {allPricesLoaded && (
                          <p
                            className="text-xs font-semibold"
                            style={{
                              color: s.gainUSD >= 0 ? "#3ecf6a" : "#CC1F1F",
                            }}
                          >
                            {s.gainUSD >= 0 ? "▲" : "▼"} $
                            {Math.abs(s.gainUSD).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* EUR stats */}
                    {s.hasEUR && (
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs" style={{ color: "#7A8BA8" }}>
                          EUR
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#3ecf6a" }}
                        >
                          €{s.investedEUR.toFixed(2)}
                        </p>
                        {allPricesLoaded && (
                          <p
                            className="text-xs font-semibold"
                            style={{
                              color: s.gainEUR >= 0 ? "#3ecf6a" : "#CC1F1F",
                            }}
                          >
                            {s.gainEUR >= 0 ? "▲" : "▼"} €
                            {Math.abs(s.gainEUR).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Arrow */}
                    <span className="text-sm shrink-0" style={{ color: "#1A2035" }}>
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
