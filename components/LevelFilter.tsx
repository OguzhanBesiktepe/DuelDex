"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const MAX = 12;

// YGO-style 5-pointed star inside an orange circle
function YGOStar({ fill, size = 26 }: { fill: string; size?: number }) {
  const dim = fill === "dim";
  const points = "12,3 14.4,9.6 21.5,9.6 15.9,13.9 18,20.5 12,16.5 6,20.5 8.1,13.9 2.5,9.6 9.6,9.6";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        display: "block",
        filter: dim ? "none" : "drop-shadow(0 0 4px #FF8C0099)",
      }}
    >
      {/* Outer circle */}
      <circle
        cx="12"
        cy="12"
        r="11"
        fill={dim ? "#0E1220" : "#CC5500"}
        stroke={dim ? "#2A3550" : "#FF7A00"}
        strokeWidth="1.5"
      />
      {/* Inner circle highlight */}
      {!dim && (
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="#E06000"
          opacity="0.6"
        />
      )}
      {/* Star */}
      <polygon
        points={points}
        fill={dim ? "#2A3550" : "#FFD700"}
        stroke={dim ? "none" : "#FF8C00"}
        strokeWidth="0.5"
      />
    </svg>
  );
}

export default function LevelFilter({ selected }: { selected: number | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hovered, setHovered] = useState<number | null>(null);

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

  // Preview level on hover, fall back to selected
  const displayLevel = hovered ?? selected ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs shrink-0" style={{ color: "#7A8BA8" }}>Level:</span>

      <div className="flex items-center gap-0.5">
        {Array.from({ length: MAX }, (_, i) => {
          const lvl = i + 1;
          const isActive = lvl <= displayLevel;
          const isSelected = selected !== null && lvl <= selected;

          return (
            <button
              key={lvl}
              onClick={() => select(lvl)}
              onMouseEnter={() => setHovered(lvl)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`Level ${lvl}`}
              style={{ padding: 1, background: "none", border: "none", cursor: "pointer" }}
            >
              <YGOStar
                fill={isActive ? (isSelected || hovered !== null ? "active" : "lit") : "dim"}
                size={20}
              />
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <span className="text-xs font-bold" style={{ color: "#FFD700" }}>
          {selected}
        </span>
      )}
    </div>
  );
}
