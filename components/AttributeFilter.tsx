"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const ATTRIBUTES = [
  { label: "LIGHT", value: "LIGHT", color: "#FFD700" },
  { label: "DARK", value: "DARK", color: "#9B6BFF" },
  { label: "WATER", value: "WATER", color: "#00AAFF" },
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
  const accentColor = activeAttr?.color ?? "#7A8BA8";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{
          background: "#0E1220",
          border: "1px solid #1A2035",
          color: "#F0F2FF",
          minWidth: 160,
        }}
      >
        <span style={{ color: "#7A8BA8" }}>Attribute:</span>
        <span className="flex-1 text-left" style={{ color: accentColor }}>
          {label}
        </span>
        <span style={{ color: "#7A8BA8", fontSize: 10 }}>
          {open ? "▲" : "▼"}
        </span>
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
              onClick={clear}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors"
              style={{
                background: !selected ? "#FF7A0018" : "transparent",
                color: !selected ? "#FF7A00" : "#7A8BA8",
              }}
            >
              <span
                className="w-3 h-3 rounded-sm border flex items-center justify-center shrink-0"
                style={{
                  borderColor: !selected ? "#FF7A00" : "#3A4A60",
                  background: !selected ? "#FF7A00" : "transparent",
                }}
              >
                {!selected && (
                  <span style={{ color: "#080B14", fontSize: 9 }}>✓</span>
                )}
              </span>
              All Attributes
            </button>

            <div
              style={{ height: 1, background: "#1A2035", margin: "4px 0" }}
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
                    color: active ? attr.color : "#7A8BA8",
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
                      <span style={{ color: "#080B14", fontSize: 9 }}>✓</span>
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
