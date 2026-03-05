"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { MONSTER_TYPES } from "@/lib/monsterTypes";

export default function MonsterFilter({ selected }: { selected: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("type");

      if (current.includes(value)) {
        // Remove it
        params.delete("type");
        current.filter((t) => t !== value).forEach((t) => params.append("type", t));
      } else {
        params.append("type", value);
      }

      // Reset to page 1 on filter change
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

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ background: "#0E1220", border: "1px solid #1A2035" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: "#7A8BA8" }}
      >
        Filter by Type
      </p>
      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <button
          onClick={selectAll}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{
            background: allSelected ? "#FF7A00" : "#1A2035",
            color: allSelected ? "#080B14" : "#7A8BA8",
            border: allSelected ? "1px solid #FF7A00" : "1px solid #1A2035",
          }}
        >
          All
        </button>

        {MONSTER_TYPES.map((t) => {
          const active = selected.includes(t.value);
          return (
            <button
              key={t.value}
              onClick={() => toggle(t.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: active ? "#FF7A00" : "#1A2035",
                color: active ? "#080B14" : "#7A8BA8",
                border: active ? "1px solid #FF7A00" : "1px solid #1A2035",
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
