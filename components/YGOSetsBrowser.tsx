"use client";

// YGOSetsBrowser — client-side search + sort + pagination for the full list of YGO sets.
// All filtering is done in-memory since the full set list is loaded once server-side.

import { useState, useMemo } from "react";
import Link from "next/link";
import type { YGOSet } from "@/lib/yugioh";
import Pagination from "./Pagination";

const PER_PAGE = 24;

export default function YGOSetsBrowser({ sets }: { sets: YGOSet[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "az">("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = q
      ? sets.filter(
          (s) =>
            s.set_name.toLowerCase().includes(q) ||
            s.set_code.toLowerCase().includes(q),
        )
      : [...sets];

    if (sort === "az") {
      list = list.sort((a, b) => {
        // Push sets whose names start with a digit (e.g. "25th Anniversary Rarity Collection")
        // to the bottom so they don't float above alphabetically sorted named sets.
        const aIsNum = /^\d/.test(a.set_name);
        const bIsNum = /^\d/.test(b.set_name);
        if (aIsNum && !bIsNum) return 1;
        if (!aIsNum && bIsNum) return -1;
        return a.set_name.localeCompare(b.set_name);
      });
    } else {
      list = list.sort((a, b) => {
        if (!a.tcg_date) return 1;
        if (!b.tcg_date) return -1;
        return new Date(b.tcg_date).getTime() - new Date(a.tcg_date).getTime();
      });
    }

    return list;
  }, [sets, query, sort]);

  // Clamp current page so it never exceeds the last valid page (e.g. after a search narrows results)
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
                background: sort === opt ? "#FF7A0022" : "#0E1220",
                color: sort === opt ? "#FF7A00" : "#7A8BA8",
                border: `1px solid ${sort === opt ? "#FF7A0044" : "#1A2035"}`,
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
            key={set.set_code}
            href={`/yugioh/sets/${encodeURIComponent(set.set_code)}`}
            className="group flex items-center justify-between gap-4 px-4 py-3 rounded-lg transition-all duration-200"
            style={{
              background: "#0E1220",
              border: "1px solid #1A2035",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#FF7A0040";
              (e.currentTarget as HTMLElement).style.background = "#0E1525";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1A2035";
              (e.currentTarget as HTMLElement).style.background = "#0E1220";
            }}
          >
            <span
              className="text-sm font-semibold leading-tight"
              style={{ color: "#F0F2FF", flex: 1, minWidth: 0 }}
            >
              {set.set_name}
            </span>

            <div className="flex items-center gap-3 shrink-0">
              {set.tcg_date && (
                <span className="text-xs hidden sm:block" style={{ color: "#7A8BA8" }}>
                  {new Date(set.tcg_date).getFullYear()}
                </span>
              )}
              <span className="text-xs" style={{ color: "#7A8BA8" }}>
                {set.num_of_cards} cards
              </span>
              <span className="text-xs font-mono" style={{ color: "#4A5568" }}>
                {set.set_code}
              </span>
              <span style={{ color: "#FF7A0060" }} className="group-hover:text-[#FF7A00] transition-colors text-xs">
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
        accent="#FF7A00"
        onPage={(p) => setPage(p)}
      />
    </div>
  );
}
