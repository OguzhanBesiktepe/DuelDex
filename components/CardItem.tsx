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
  const accent = game === "yugioh" ? "#FF7A00" : "#00AAFF";
  const rarityColor = getRarityColor(rarity, game);

  const tcg = price && parseFloat(price) > 0 ? parseFloat(price) : null;
  const ebay = ebayPrice && parseFloat(ebayPrice) > 0 ? parseFloat(ebayPrice) : null;
  const displayPrice = tcg ?? ebay;
  const priceLabel = displayPrice ? (tcg ? null : "eBay") : null;

  return (
    <Link href={href} className="group block">
      <div
        className="relative rounded-xl overflow-hidden transition-transform duration-200 group-hover:-translate-y-1"
        style={{
          background: "#0E1220",
          border: "1px solid #1A2035",
        }}
      >
        {/* Card image */}
        <div className="relative w-full aspect-[3/4] bg-[#080B14]">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
            unoptimized
          />
        </div>

        {/* Info */}
        <div className="p-2">
          <p
            className="text-xs font-semibold truncate"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-inter)" }}
          >
            {name}
          </p>

          <div className="flex items-center justify-between mt-1 gap-1">
            {type && (
              <span
                className="text-[10px] truncate"
                style={{ color: "#7A8BA8" }}
              >
                {type}
              </span>
            )}
            {rarity && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: `${rarityColor}22`,
                  color: rarityColor,
                  border: `1px solid ${rarityColor}44`,
                }}
              >
                {rarity}
              </span>
            )}
          </div>

          {displayPrice && (
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs font-bold" style={{ color: "#3ecf6a" }}>
                ${displayPrice.toFixed(2)}
              </p>
              {priceLabel && (
                <span className="text-[9px]" style={{ color: "#7A8BA8" }}>
                  {priceLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: accent }}
        />
      </div>
    </Link>
  );
}
