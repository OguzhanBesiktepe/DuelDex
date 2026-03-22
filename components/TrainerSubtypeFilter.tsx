"use client";

// TrainerSubtypeFilter — horizontal chip row for filtering Trainer cards by subtype:
// Item, Supporter, Stadium, Tool. Single-select; stored in the `trainerType` URL param.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TRAINER_SUBTYPES } from "@/lib/pokemonTypes";

export default function TrainerSubtypeFilter({ selected }: { selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const select = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === selected) {
        // Clicking active chip clears the filter
        params.delete("trainerType");
      } else {
        params.set("trainerType", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, selected],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("trainerType");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#7A8BA8" }}>
        Trainer Type
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: !selected ? "#00AAFF25" : "#1A2035",
            color: !selected ? "#00AAFF" : "#7A8BA8",
            border: !selected ? "1px solid #00AAFF60" : "1px solid #1A2035",
          }}
        >
          All Trainers
        </button>
        {TRAINER_SUBTYPES.map((t) => {
          const active = selected === t.value;
          return (
            <button
              key={t.value}
              onClick={() => select(t.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: active ? `${t.color}25` : "#1A2035",
                color: active ? t.color : "#7A8BA8",
                border: active ? `1px solid ${t.color}70` : "1px solid #1A2035",
                boxShadow: active ? `0 0 8px ${t.color}30` : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
