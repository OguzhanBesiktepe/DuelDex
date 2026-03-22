"use client";

// PokemonStageFilter — dropdown for filtering Pokémon cards by evolution stage.
// Single-select: Basic, Stage 1, Stage 2, V, VMAX, VSTAR, ex, GX, EX.
// Selection is stored in the `stage` URL param.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { POKEMON_STAGES } from "@/lib/pokemonTypes";

const ACCENT = "#00AAFF";

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
          background: "#0E1220",
          border: `1px solid ${selected ? ACCENT + "60" : "#1A2035"}`,
          color: "#F0F2FF",
          minWidth: 140,
        }}
      >
        <span style={{ color: "#7A8BA8" }}>Stage:</span>
        <span className="flex-1 text-left" style={{ color: selected ? ACCENT : "#F0F2FF" }}>
          {label}
        </span>
        <span style={{ color: "#7A8BA8", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-xl z-20 p-2"
          style={{
            background: "#0E1220",
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
                color: !selected ? ACCENT : "#7A8BA8",
              }}
            >
              All Stages
            </button>
            <div style={{ height: 1, background: "#1A2035", margin: "4px 0" }} />
            {POKEMON_STAGES.map((s) => (
              <button
                key={s.value}
                onClick={() => select(s.value)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
                style={{
                  background: selected === s.value ? `${ACCENT}18` : "transparent",
                  color: selected === s.value ? ACCENT : "#7A8BA8",
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
