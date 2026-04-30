"use client";

// MonsterFilter — multi-select dropdown for YGO monster sub-types (Effect, Fusion, Synchro, etc.).
// Multiple types can be active simultaneously; each selection is appended to the `type` URL param.
// "All Types" clears all type params.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { MONSTER_TYPES } from "@/lib/monsterTypes";

export default function MonsterFilter({ selected }: { selected: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("type");
      if (current.includes(value)) {
        // URLSearchParams has no "delete one value" method, so we clear and re-append the rest
        params.delete("type");
        current
          .filter((t) => t !== value)
          .forEach((t) => params.append("type", t));
      } else {
        params.append("type", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const selectAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const allSelected = selected.length === 0;
  const label = allSelected
    ? "All Types"
    : selected.length === 1
      ? (MONSTER_TYPES.find((t) => t.value === selected[0])?.label ??
        selected[0])
      : `${selected.length} Types`;

  return (
    <div className="relative inline-block">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{
          background: "var(--surface)",
          border: "1px solid #1A2035",
          color: "var(--text-primary)",
          minWidth: 140,
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>Type:</span>
        <span className="flex-1 text-left" style={{ color: "var(--ygo-accent)" }}>
          {label}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown box */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-xl z-20 p-3"
          style={{
            background: "var(--surface)",
            border: "1px solid #1A2035",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: 200,
          }}
        >
          <div className="flex flex-col gap-1">
            {/* All option */}
            <button
              onClick={() => {
                selectAll();
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{
                background: allSelected ? "#FF7A0018" : "transparent",
                color: allSelected ? "var(--ygo-accent)" : "var(--text-muted)",
              }}
            >
              <span
                className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                style={{
                  borderColor: allSelected ? "var(--ygo-accent)" : "#3A4A60",
                  background: allSelected ? "var(--ygo-accent)" : "transparent",
                }}
              >
                {allSelected && (
                  <span style={{ color: "var(--background)", fontSize: 9 }}>✓</span>
                )}
              </span>
              All Types
            </button>

            <div
              style={{ height: 1, background: "var(--border)", margin: "4px 0" }}
            />

            {MONSTER_TYPES.map((t) => {
              const active = selected.includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => toggle(t.value)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: active ? "#FF7A0018" : "transparent",
                    color: active ? "var(--ygo-accent)" : "var(--text-muted)",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: active ? "var(--ygo-accent)" : "#3A4A60",
                      background: active ? "var(--ygo-accent)" : "transparent",
                    }}
                  >
                    {active && (
                      <span style={{ color: "var(--background)", fontSize: 9 }}>✓</span>
                    )}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
