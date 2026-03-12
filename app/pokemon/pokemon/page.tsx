// Pokémon cards page — fetches Pokémon-type cards (not Trainers or Energy) from TCGdex
// and renders them in a paginated grid. `force-dynamic` is set because TCGdex doesn't
// return a total count so we can't pre-compute the last page.

import CardGrid from "@/components/CardGrid";
import { fetchPokemonCards } from "@/lib/pokemon";

export const dynamic = "force-dynamic";

export default async function PokemonPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const { cards } = await fetchPokemonCards("Pokemon", page, 24);

  const mapped = cards.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image ? `${c.image}/low.webp` : "",
  }));

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            Pokémon
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
            Pokémon TCG &mdash; Page {page}
          </p>
        </div>

        <CardGrid cards={mapped} game="pokemon" />

        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <a
              href={`?page=${page - 1}`}
              className="px-3 py-1.5 rounded text-sm"
              style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
            >
              Previous
            </a>
          )}
          <span className="text-sm" style={{ color: "#7A8BA8" }}>
            Page {page}
          </span>
          {/* Show "Next" only if a full page was returned — TCGdex has no total count */}
          {cards.length === 24 && (
            <a
              href={`?page=${page + 1}`}
              className="px-3 py-1.5 rounded text-sm"
              style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
            >
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
