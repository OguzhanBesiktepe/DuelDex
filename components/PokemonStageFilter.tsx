"use client";

// PokemonStageFilter — dropdown for filtering Pokémon cards by evolution stage.
// Single-select: Basic, Stage 1, Stage 2, V, VMAX, VSTAR, ex, GX, EX.
// Selection is stored in the `stage` URL param.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { POKEMON_STAGES } from "@/lib/pokemonTypes";

const ACCENT = "var(--pkmn-accent)";

export default function PokemonStageFilter({ selected }: { selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const select = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("stage", value);
      } else {
        params.delete("stage");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
      setOpen(false);
    },
    [router, searchParams],
  );

  const label = selected
    ? (POKEMON_STAGES.find((s) => s.value === selected)?.label ?? selected)
    : "All Stages";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{
          background: "var(--surface)",
          border: `1px solid ${selected ? ACCENT + "60" : "var(--border)"}`,
          color: "var(--text-primary)",
          minWidth: 140,
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>Stage:</span>
        <span className="flex-1 text-left" style={{ color: selected ? ACCENT : "var(--text-primary)" }}>
          {label}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-xl z-20 p-2"
          style={{
            background: "var(--surface)",
            border: "1px solid #1A2035",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: 150,
          }}
        >
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => select("")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{
                background: !selected ? `${ACCENT}18` : "transparent",
                color: !selected ? ACCENT : "var(--text-muted)",
              }}
            >
              All Stages
            </button>
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            {POKEMON_STAGES.map((s) => (
              <button
                key={s.value}
                onClick={() => select(s.value)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
                style={{
                  background: selected === s.value ? `${ACCENT}18` : "transparent",
                  color: selected === s.value ? ACCENT : "var(--text-muted)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}
