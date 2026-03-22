// Pokémon set detail page — fetches all cards in a specific set via TCGdex
// and paginates them server-side using the `page` search param.

import { fetchPokemonSetDetail } from "@/lib/pokemon";
import CardGrid from "@/components/CardGrid";
import BackButton from "@/components/BackButton";
import { notFound } from "next/navigation";

const PER_PAGE = 24;

export default async function PokemonSetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { setId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const set = await fetchPokemonSetDetail(decodeURIComponent(setId));
  if (!set) notFound();

  const withImages = (set.cards ?? []).filter((c) => !!c.image);
  const totalPages = Math.max(1, Math.ceil(withImages.length / PER_PAGE));
  const effectivePage = Math.min(page, Math.max(1, totalPages));
  const pageCards = withImages.slice((effectivePage - 1) * PER_PAGE, effectivePage * PER_PAGE);

  const mapped = pageCards.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: `${c.image}/low.webp`,
  }));

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <BackButton label="Back to All Sets" href="/pokemon/sets" />

        {/* Set header */}
        <div
          className="flex flex-col sm:flex-row gap-6 mt-4 mb-8 p-5 rounded-xl"
          style={{ background: "#0E1220", border: "1px solid #1A2035" }}
        >
          <div className="flex flex-col justify-center min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#00AAFF" }}
            >
              {set.serie?.name ?? "Pokémon TCG"}
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              {set.name}
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <span
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{
                  background: "#00AAFF15",
                  color: "#00AAFF",
                  border: "1px solid #00AAFF30",
                }}
              >
                {set.id}
              </span>
              <span className="text-sm" style={{ color: "#7A8BA8" }}>
                {withImages.length} cards
              </span>
              {set.releaseDate && (
                <span className="text-sm" style={{ color: "#7A8BA8" }}>
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

        <CardGrid cards={mapped} game="pokemon" />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {effectivePage > 1 && (
              <a
                href={`?page=${effectivePage - 1}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
              >
                Previous
              </a>
            )}
            <span className="text-sm" style={{ color: "#7A8BA8" }}>
              Page {effectivePage} of {totalPages}
            </span>
            {effectivePage < totalPages && (
              <a
                href={`?page=${effectivePage + 1}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
