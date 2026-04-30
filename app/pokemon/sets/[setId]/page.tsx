// Pokémon set detail page — fetches all cards in the set with full metadata
// (types, rarity, price) in parallel, then passes everything to PokemonSetDetailClient
// for instant client-side filtering by energy type and rarity.

import { fetchPokemonSetDetail, fetchPokemonCardById, getBestTcgPrice, getCardMarketPrice } from "@/lib/pokemon";
import PokemonSetDetailClient from "@/components/PokemonSetDetailClient";
import BackButton from "@/components/BackButton";
import { notFound } from "next/navigation";
import type { SetCard } from "@/components/PokemonSetDetailClient";

export default async function PokemonSetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { setId } = await params;
  const { page } = await searchParams;
  const initialPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const set = await fetchPokemonSetDetail(decodeURIComponent(setId));
  if (!set) notFound();

  // Filter to cards with images, then fetch full details for all of them in parallel.
  // Each card detail is cached by Next.js for 1 hour, so subsequent loads are instant.
  const summaries = (set.cards ?? []).filter((c) => !!c.image);

  const details = await Promise.all(summaries.map((c) => fetchPokemonCardById(c.id)));

  const cards: SetCard[] = details
    .filter((d) => d !== null && !!d!.image)
    .map((d) => {
      const tcgPrice = getBestTcgPrice(d!);
      const cmPrice = tcgPrice == null ? getCardMarketPrice(d!) : null;
      const priceNum = tcgPrice ?? cmPrice;
      return {
        id: d!.id,
        name: d!.name,
        imageUrl: `${d!.image}/low.webp`,
        types: d!.types,
        rarity: d!.rarity,
        stage: d!.stage,
        price: priceNum != null ? String(priceNum) : undefined,
        priceCurrency: (cmPrice != null ? "EUR" : "USD") as "USD" | "EUR",
      };
    });

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <BackButton label="Back to All Sets" href="/pokemon/sets" />

        {/* Set header */}
        <div
          className="flex flex-col sm:flex-row gap-6 mt-4 mb-8 p-5 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid #1A2035" }}
        >
          <div className="flex flex-col justify-center min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--pkmn-accent)" }}
            >
              {set.serie?.name ?? "Pokémon TCG"}
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-cinzel)" }}
            >
              {set.name}
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <span
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{
                  background: "#00AAFF15",
                  color: "var(--pkmn-accent)",
                  border: "1px solid #00AAFF30",
                }}
              >
                {set.id}
              </span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {cards.length} cards
              </span>
              {set.releaseDate && (
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Released{" "}
                  {new Date(set.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <PokemonSetDetailClient cards={cards} setId={setId} initialPage={initialPage} />
      </div>
    </div>
  );
}
