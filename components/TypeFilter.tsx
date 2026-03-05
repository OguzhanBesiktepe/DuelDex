"use client";

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

export default function TypeFilter({ options, selected, accent = "#FF7A00" }: TypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("subtype");
      if (current.includes(value)) {
        params.delete("subtype");
        current.filter((t) => t !== value).forEach((t) => params.append("subtype", t));
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
          background: "#0E1220",
          border: "1px solid #1A2035",
          color: "#F0F2FF",
          minWidth: 140,
        }}
      >
        <span style={{ color: "#7A8BA8" }}>Type:</span>
        <span className="flex-1 text-left" style={{ color: accent }}>{label}</span>
        <span style={{ color: "#7A8BA8", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-xl z-20 p-3"
          style={{
            background: "#0E1220",
            border: "1px solid #1A2035",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: 180,
          }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { selectAll(); setOpen(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{
                background: allSelected ? `${accent}18` : "transparent",
                color: allSelected ? accent : "#7A8BA8",
              }}
            >
              <span
                className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                style={{
                  borderColor: allSelected ? accent : "#3A4A60",
                  background: allSelected ? accent : "transparent",
                }}
              >
                {allSelected && <span style={{ color: "#080B14", fontSize: 9 }}>✓</span>}
              </span>
              All Types
            </button>

            <div style={{ height: 1, background: "#1A2035", margin: "4px 0" }} />

            {options.map((t) => {
              const active = selected.includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => toggle(t.value)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: active ? `${accent}18` : "transparent",
                    color: active ? accent : "#7A8BA8",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: active ? accent : "#3A4A60",
                      background: active ? accent : "transparent",
                    }}
                  >
                    {active && <span style={{ color: "#080B14", fontSize: 9 }}>✓</span>}
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
