"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function LevelFilter({ selected }: { selected: number | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const select = useCallback(
    (level: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (Number(params.get("level")) === level) {
        params.delete("level");
      } else {
        params.set("level", String(level));
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs mr-1" style={{ color: "#7A8BA8" }}>Level:</span>
      {LEVELS.map((lvl) => {
        const active = selected === lvl;
        return (
          <button
            key={lvl}
            onClick={() => select(lvl)}
            className="flex items-center gap-0.5 px-2 h-7 rounded-md text-xs font-bold transition-all"
            style={{
              background: active ? "#FFD70022" : "#0E1220",
              color: active ? "#FFD700" : "#7A8BA8",
              border: active ? "1px solid #FFD700" : "1px solid #1A2035",
            }}
          >
            <span style={{ fontSize: 11, lineHeight: 1 }}>★</span>
            {lvl}
          </button>
        );
      })}
    </div>
  );
}
