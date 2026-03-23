// Search results page — runs both YGO and Pokémon searches in parallel and renders
// the combined results in two labelled sections. Each API has its own normalisation logic
// to handle punctuation differences (see lib/yugioh.ts searchYGOCards).

import CardGrid from "@/components/CardGrid";
import { searchYGOCards, ygoImage } from "@/lib/yugioh";
import { searchPokemonCards } from "@/lib/pokemon";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div style={{ background: "#080B14", minHeight: "100vh" }}>
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <p className="text-lg" style={{ color: "#7A8BA8" }}>
            Enter a card name in the search bar above.
          </p>
        </div>
      </div>
    );
  }

  const [ygoResults, pkmnResults] = await Promise.all([
    searchYGOCards(query),
    searchPokemonCards(query),
  ]);

  const ygoCards = ygoResults.map((c) => ({
    id: String(c.id),
    name: c.name,
    imageUrl: c.card_images[0]?.id ? ygoImage(c.card_images[0].id, true) : "",
    type: c.race,
    rarity: c.card_sets?.[0]?.set_rarity,
    price: c.card_prices?.[0]?.tcgplayer_price,
    ebayPrice: c.card_prices?.[0]?.ebay_price,
  }));

  const pkmnCards = pkmnResults.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image ? `${c.image}/low.webp` : "",
  }));

  const totalResults = ygoCards.length + pkmnCards.length;

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="text-2xl font-bold"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            Search Results
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
            {totalResults === 0
              ? `No results for "${query}"`
              : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`}
          </p>
        </div>

        {ygoCards.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-base font-semibold mb-4 pb-2"
              style={{
                color: "#FF7A00",
                borderBottom: "1px solid #1A2035",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              Yu-Gi-Oh! &mdash; {ygoCards.length} card{ygoCards.length !== 1 ? "s" : ""}
            </h2>
            <CardGrid cards={ygoCards} game="yugioh" from={`/search?q=${encodeURIComponent(query)}`} />
          </section>
        )}

        {pkmnCards.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-base font-semibold mb-4 pb-2"
              style={{
                color: "#00AAFF",
                borderBottom: "1px solid #1A2035",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              Pokémon &mdash; {pkmnCards.length} card{pkmnCards.length !== 1 ? "s" : ""}
            </h2>
            <CardGrid cards={pkmnCards} game="pokemon" from={`/search?q=${encodeURIComponent(query)}`} />
          </section>
        )}

        {totalResults === 0 && (
          <div className="py-24 text-center">
            <p className="text-sm" style={{ color: "#7A8BA8" }}>
              Try a different name — partial matches work (e.g. &quot;blue eyes&quot; or &quot;charizard&quot;).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
