"use client";

// AttributeFilter — dropdown filter for the seven YGO monster attributes (LIGHT, DARK, etc.).
// Selecting an attribute pushes it into the URL search params so the server re-fetches with
// the attribute filter applied. Selecting the active attribute again clears it.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const ATTRIBUTES = [
  { label: "LIGHT", value: "LIGHT", color: "var(--gold)" },
  { label: "DARK", value: "DARK", color: "#9B6BFF" },
  { label: "WATER", value: "WATER", color: "var(--pkmn-accent)" },
  { label: "FIRE", value: "FIRE", color: "#FF4422" },
  { label: "EARTH", value: "EARTH", color: "#A0784A" },
  { label: "WIND", value: "WIND", color: "#44CC88" },
  { label: "DIVINE", value: "DIVINE", color: "#FFB347" },
];

export default function AttributeFilter({ selected }: { selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const select = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get("attribute") === value) {
        params.delete("attribute");
      } else {
        params.set("attribute", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
      setOpen(false);
    },
    [router, searchParams],
  );

  const clear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("attribute");
    params.delete("page");
    router.push(`?${params.toString()}`);
    setOpen(false);
  }, [router, searchParams]);

  const activeAttr = ATTRIBUTES.find((a) => a.value === selected);
  const label = activeAttr ? activeAttr.label : "All Attributes";
  const accentColor = activeAttr?.color ?? "var(--text-muted)";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{
          background: "var(--surface)",
          border: "1px solid #1A2035",
          color: "var(--text-primary)",
          minWidth: 160,
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>Attribute:</span>
        <span className="flex-1 text-left" style={{ color: accentColor }}>
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
              onClick={clear}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{
                background: !selected ? "#FF7A0018" : "transparent",
                color: !selected ? "var(--ygo-accent)" : "var(--text-muted)",
              }}
            >
              <span
                className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                style={{
                  borderColor: !selected ? "var(--ygo-accent)" : "#3A4A60",
                  background: !selected ? "var(--ygo-accent)" : "transparent",
                }}
              >
                {!selected && (
                  <span style={{ color: "var(--background)", fontSize: 9 }}>✓</span>
                )}
              </span>
              All Attributes
            </button>

            <div
              style={{ height: 1, background: "var(--border)", margin: "4px 0" }}
            />

            {ATTRIBUTES.map((attr) => {
              const active = selected === attr.value;
              return (
                <button
                  key={attr.value}
                  onClick={() => select(attr.value)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: active ? `${attr.color}18` : "transparent",
                    color: active ? attr.color : "var(--text-muted)",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: active ? attr.color : "#3A4A60",
                      background: active ? attr.color : "transparent",
                    }}
                  >
                    {active && (
                      <span style={{ color: "var(--background)", fontSize: 9 }}>✓</span>
                    )}
                  </span>
                  {attr.label}
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
