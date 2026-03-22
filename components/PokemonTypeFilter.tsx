"use client";

// PokemonTypeFilter — horizontal energy-type chip row for filtering Pokémon cards by TCG type.
// Multi-select: clicking a chip toggles it. Clicking the active chip deselects it.
// Selection is stored in the `poketype` URL param to avoid collision with other params.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { POKEMON_ENERGY_TYPES } from "@/lib/pokemonTypes";

export default function PokemonTypeFilter({ selected }: { selected: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("poketype");
      if (current.includes(value)) {
        params.delete("poketype");
        current.filter((t) => t !== value).forEach((t) => params.append("poketype", t));
      } else {
        params.append("poketype", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("poketype");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const allSelected = selected.length === 0;

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#7A8BA8" }}>
        Energy Type
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: allSelected ? "#00AAFF25" : "#1A2035",
            color: allSelected ? "#00AAFF" : "#7A8BA8",
            border: allSelected ? "1px solid #00AAFF60" : "1px solid #1A2035",
          }}
        >
          All Types
        </button>
        {POKEMON_ENERGY_TYPES.map((t) => {
          const active = selected.includes(t.value);
          return (
            <button
              key={t.value}
              onClick={() => toggle(t.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1"
              style={{
                background: active ? `${t.color}25` : "#1A2035",
                color: active ? t.color : "#7A8BA8",
                border: active ? `1px solid ${t.color}70` : "1px solid #1A2035",
                boxShadow: active ? `0 0 8px ${t.color}30` : "none",
              }}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
