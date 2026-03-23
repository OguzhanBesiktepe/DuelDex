"use client";

// TrainerSubtypeFilter — horizontal chip row for filtering Trainer cards by subtype:
// Item, Supporter, Stadium, Tool. Single-select; stored in the `trainerType` URL param.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TRAINER_SUBTYPES } from "@/lib/pokemonTypes";

const FULL_ART_COLOR = "#E879F9";

export default function TrainerSubtypeFilter({
  selected,
  fullArt,
}: {
  selected: string;
  fullArt: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const select = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === selected) {
        params.delete("trainerType");
      } else {
        params.set("trainerType", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, selected],
  );

  const toggleFullArt = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (fullArt) {
      params.delete("fullArt");
    } else {
      params.set("fullArt", "1");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams, fullArt]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("trainerType");
    params.delete("fullArt");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const noneActive = !selected && !fullArt;

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: noneActive ? "#00AAFF25" : "#1A2035",
            color: noneActive ? "#00AAFF" : "#7A8BA8",
            border: noneActive ? "1px solid #00AAFF60" : "1px solid #1A2035",
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

        {/* Divider */}
        <span style={{ color: "#1A2035", fontSize: 18, lineHeight: 1 }}>|</span>

        {/* Full Art toggle */}
        <button
          onClick={toggleFullArt}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: fullArt ? `${FULL_ART_COLOR}25` : "#1A2035",
            color: fullArt ? FULL_ART_COLOR : "#7A8BA8",
            border: fullArt ? `1px solid ${FULL_ART_COLOR}70` : "1px solid #1A2035",
            boxShadow: fullArt ? `0 0 8px ${FULL_ART_COLOR}30` : "none",
          }}
        >
          ✦ Full Art
        </button>
      </div>
    </div>
  );
}
