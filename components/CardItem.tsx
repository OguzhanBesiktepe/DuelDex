"use client";

import Link from "next/link";
import Image from "next/image";
import { getRarityColor } from "@/lib/rarityColors";

interface CardItemProps {
  id: string;
  name: string;
  imageUrl: string;
  type?: string;
  rarity?: string;
  price?: string;
  ebayPrice?: string;
  game: "yugioh" | "pokemon";
}

export default function CardItem({
  id,
  name,
  imageUrl,
  type,
  rarity,
  price,
  ebayPrice,
  game,
}: CardItemProps) {
  const href = `/${game}/card/${id}`;
  const rarityColor = getRarityColor(rarity, game);

  const tcg = price && parseFloat(price) > 0 ? parseFloat(price) : null;
  const ebay =
    ebayPrice && parseFloat(ebayPrice) > 0 ? parseFloat(ebayPrice) : null;
  const displayPrice = tcg ?? ebay;
  const priceLabel = displayPrice ? (tcg ? null : "eBay") : null;

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
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
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
                style={{ color: "#7A8BA8" }}
              >
                {type}
              </span>
            )}
            {rarity && (
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

          {displayPrice && (
            <div className="flex items-center gap-1 mt-1.5">
              <p className="text-sm font-bold" style={{ color: "#3ecf6a" }}>
                ${displayPrice.toFixed(2)}
              </p>
              {priceLabel && (
                <span className="text-[10px]" style={{ color: "#7A8BA8" }}>
                  {priceLabel}
                </span>
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
