"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { RARITY_GROUPS } from "@/lib/rarityGroups";

interface RarityFilterProps {
  selected: string[];
}

export default function RarityFilter({ selected }: RarityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggle = useCallback(
    (label: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("rarity");

      if (current.includes(label)) {
        params.delete("rarity");
        current.filter((r) => r !== label).forEach((r) => params.append("rarity", r));
      } else {
        params.append("rarity", label);
      }

      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("rarity");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const allSelected = selected.length === 0;

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: "#0E1220", border: "1px solid #1A2035" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: "#7A8BA8" }}
      >
        Filter by Rarity
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{
            background: allSelected ? "#6B7280" : "#1A2035",
            color: allSelected ? "#080B14" : "#7A8BA8",
            border: allSelected ? "1px solid #6B7280" : "1px solid #1A2035",
          }}
        >
          All
        </button>

        {RARITY_GROUPS.map((group) => {
          const active = selected.includes(group.label);
          return (
            <button
              key={group.label}
              onClick={() => toggle(group.label)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: active ? `${group.color}25` : "#1A2035",
                color: active ? group.color : "#7A8BA8",
                border: active ? `1px solid ${group.color}80` : "1px solid #1A2035",
                boxShadow: active ? `0 0 8px ${group.color}30` : "none",
              }}
            >
              {group.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
