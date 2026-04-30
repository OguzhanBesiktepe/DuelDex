"use client";

// TypeFilter — generic multi-select dropdown for Spell or Trap sub-types (Normal, Continuous, etc.).
// Reused for both Spells and Traps pages; the `options` prop controls which types are listed.
// Selections are stored in the `subtype` URL param.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface TypeOption {
  label: string;
  value: string;
}

interface TypeFilterProps {
  options: TypeOption[];
  selected: string[];
  accent?: string;
}

export default function TypeFilter({
  options,
  selected,
  accent = "var(--ygo-accent)",
}: TypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("subtype");
      if (current.includes(value)) {
        params.delete("subtype");
        current
          .filter((t) => t !== value)
          .forEach((t) => params.append("subtype", t));
      } else {
        params.append("subtype", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const selectAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("subtype");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const allSelected = selected.length === 0;
  const label = allSelected
    ? "All Types"
    : selected.length === 1
      ? (options.find((t) => t.value === selected[0])?.label ?? selected[0])
      : `${selected.length} Types`;

  return (
    <div className="relative inline-block mb-6">
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
        <span className="flex-1 text-left" style={{ color: accent }}>
          {label}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-xl z-20 p-3"
          style={{
            background: "var(--surface)",
            border: "1px solid #1A2035",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: 180,
          }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                selectAll();
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{
                background: allSelected ? `${accent}18` : "transparent",
                color: allSelected ? accent : "var(--text-muted)",
              }}
            >
              <span
                className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                style={{
                  borderColor: allSelected ? accent : "#3A4A60",
                  background: allSelected ? accent : "transparent",
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

            {options.map((t) => {
              const active = selected.includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => toggle(t.value)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: active ? `${accent}18` : "transparent",
                    color: active ? accent : "var(--text-muted)",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: active ? accent : "#3A4A60",
                      background: active ? accent : "transparent",
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

      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
