"use client";

// PokemonSetsBrowser — client-side search + sort + pagination for all Pokémon TCG sets.
// All filtering is done in-memory since the full set list is loaded once server-side.

import { useState, useMemo } from "react";
import Pagination from "./Pagination";
import Link from "next/link";
import type { PokemonSet } from "@/lib/pokemon";

const PER_PAGE = 24;

export default function PokemonSetsBrowser({ sets }: { sets: PokemonSet[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "az">("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    // TCGdex's /sets list endpoint omits releaseDate; the API returns sets oldest→newest,
    // so we use the original index as a chronological fallback.
    const originalIdx = new Map(sets.map((s, i) => [s.id, i]));

    const q = query.toLowerCase().trim();
    let list = q
      ? sets.filter((s) => s.name.toLowerCase().includes(q))
      : [...sets];

    if (sort === "az") {
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = list.sort((a, b) => {
        if (a.releaseDate && b.releaseDate) {
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        }
        // Fall back to reversed API order (higher original index = newer set)
        return (originalIdx.get(b.id) ?? 0) - (originalIdx.get(a.id) ?? 0);
      });
    }

    return list;
  }, [sets, query, sort]);

  const effectivePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PER_PAGE)));
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((effectivePage - 1) * PER_PAGE, effectivePage * PER_PAGE);

  function handleQueryChange(q: string) {
    setQuery(q);
    setPage(1);
  }

  function handleSortChange(s: "newest" | "az") {
    setSort(s);
    setPage(1);
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search sets..."
          className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
          style={{
            background: "#0E1220",
            border: "1px solid #1A2035",
            color: "#F0F2FF",
          }}
        />
        <div className="flex gap-2 shrink-0">
          {(["newest", "az"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleSortChange(opt)}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                background: sort === opt ? "#00AAFF22" : "#0E1220",
                color: sort === opt ? "#00AAFF" : "#7A8BA8",
                border: `1px solid ${sort === opt ? "#00AAFF44" : "#1A2035"}`,
              }}
            >
              {opt === "newest" ? "Newest First" : "A–Z"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm" style={{ color: "#7A8BA8" }}>
          No sets found.
        </p>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {paginated.map((set) => (
          <Link
            key={set.id}
            href={`/pokemon/sets/${encodeURIComponent(set.id)}`}
            className="group flex items-center justify-between gap-4 px-4 py-3 rounded-lg transition-all duration-200"
            style={{
              background: "#0E1220",
              border: "1px solid #1A2035",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#00AAFF40";
              (e.currentTarget as HTMLElement).style.background = "#0E1525";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1A2035";
              (e.currentTarget as HTMLElement).style.background = "#0E1220";
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {set.serie?.name && (
                <span
                  className="hidden sm:block text-xs px-2 py-0.5 rounded shrink-0"
                  style={{
                    background: "#00AAFF15",
                    color: "#00AAFF",
                    border: "1px solid #00AAFF30",
                    fontSize: "10px",
                  }}
                >
                  {set.serie.name}
                </span>
              )}
              <span
                className="text-sm font-semibold leading-tight truncate"
                style={{ color: "#F0F2FF" }}
              >
                {set.name}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {set.releaseDate && (
                <span className="text-xs hidden sm:block" style={{ color: "#7A8BA8" }}>
                  {new Date(set.releaseDate).getFullYear()}
                </span>
              )}
              {set.cardCount?.total != null && (
                <span className="text-xs" style={{ color: "#7A8BA8" }}>
                  {set.cardCount.total} cards
                </span>
              )}
              <span
                style={{ color: "#00AAFF60" }}
                className="group-hover:text-[#00AAFF] transition-colors text-xs"
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        page={effectivePage}
        totalPages={totalPages}
        total={filtered.length}
        countLabel="sets"
        accent="#00AAFF"
        onPage={(p) => setPage(p)}
      />
    </div>
  );
}
