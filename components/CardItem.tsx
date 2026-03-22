"use client";

// CardItem — individual card tile shown in the grid.
// Displays card image, name, type badge, rarity badge, and price.
// Border + glow color is driven by the card's rarity color for a gem-tier aesthetic.

import Link from "next/link";
import Image from "next/image";
import { getRarityColor } from "@/lib/rarityColors";
import { getYGOTypeColor } from "@/lib/typeColors";

interface CardItemProps {
  id: string;
  name: string;
  imageUrl: string;
  type?: string;
  rarity?: string;
  price?: string;
  ebayPrice?: string;
  minPrice?: number;
  maxPrice?: number;
  game: "yugioh" | "pokemon";
  from?: string;
}

export default function CardItem({
  id,
  name,
  imageUrl,
  type,
  rarity,
  price,
  ebayPrice,
  minPrice,
  maxPrice,
  game,
  from,
}: CardItemProps) {
  // Append ?from= so the detail page can show a contextual back-button label
  const href = `/${game}/card/${id}${from ? `?from=${encodeURIComponent(from)}` : ""}`;
  const rarityColor = getRarityColor(rarity, game);

  // Prefer TCGPlayer price; fall back to eBay if TCGPlayer is missing/zero
  const tcg = price && parseFloat(price) > 0 ? parseFloat(price) : null;
  const ebay =
    ebayPrice && parseFloat(ebayPrice) > 0 ? parseFloat(ebayPrice) : null;
  const fallbackPrice = tcg ?? ebay;
  const fallbackLabel = fallbackPrice ? (tcg ? null : "eBay") : null;

  // minPrice/maxPrice come from the card's set_price across all printings
  const hasRange = minPrice != null && minPrice > 0 && maxPrice != null && maxPrice > 0;
  // Only show a range when the spread is at least $0.01 (avoid "$1.00 – $1.00")
  const isRange = hasRange && maxPrice - minPrice >= 0.01;

  return (
    <Link href={href} className="group block">
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: "#0E1220",
          border: `2px solid ${rarityColor}90`,
          boxShadow: `0 0 16px ${rarityColor}25`,
        }}
      >
        {/* Card image */}
        <div className="relative w-full aspect-[3/4] bg-[#080B14]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-xs" style={{ color: "#3A4A60" }}>No Image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p
            className="text-sm font-semibold truncate mb-1"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-inter)" }}
          >
            {name}
          </p>

          <div className="flex items-center justify-between gap-1">
            {type && (
              <span
                className="text-[11px] truncate"
                style={{ color: game === "yugioh" ? getYGOTypeColor(type) : "#7A8BA8" }}
              >
                {type}
              </span>
            )}
            {/* Guard against rarity values that are pure numbers (some sets use numeric codes) */}
            {rarity && /[a-zA-Z]/.test(rarity) && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                style={{
                  background: `${rarityColor}20`,
                  color: rarityColor,
                  border: `1px solid ${rarityColor}50`,
                }}
              >
                {rarity}
              </span>
            )}
          </div>

          {(hasRange || fallbackPrice) && (
            <div className="mt-1.5">
              {isRange ? (
                <p className="text-xs font-semibold leading-tight" style={{ color: "#3ecf6a" }}>
                  ${minPrice!.toFixed(2)} – ${maxPrice!.toFixed(2)}
                </p>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold" style={{ color: "#3ecf6a" }}>
                    ${(hasRange ? minPrice! : fallbackPrice!).toFixed(2)}
                  </p>
                  {!hasRange && fallbackLabel && (
                    <span className="text-[10px]" style={{ color: "#7A8BA8" }}>
                      {fallbackLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover: brighten the rarity border + glow */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 2px ${rarityColor}, 0 0 32px ${rarityColor}45`,
          }}
        />
      </div>
    </Link>
  );
}
