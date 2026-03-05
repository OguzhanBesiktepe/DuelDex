"use client";

import Link from "next/link";
import Image from "next/image";

interface CardItemProps {
  id: string;
  name: string;
  imageUrl: string;
  type?: string;
  rarity?: string;
  price?: string;
  game: "yugioh" | "pokemon";
}

export default function CardItem({
  id,
  name,
  imageUrl,
  type,
  rarity,
  price,
  game,
}: CardItemProps) {
  const href = `/${game}/card/${id}`;
  const accent = game === "yugioh" ? "#FF7A00" : "#00AAFF";
  const hasPrice = price && parseFloat(price) > 0;

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
                  background: `${accent}22`,
                  color: accent,
                  border: `1px solid ${accent}44`,
                }}
              >
                {rarity}
              </span>
            )}
          </div>

          {hasPrice && (
            <p
              className="text-xs font-bold mt-1"
              style={{ color: "#3ecf6a" }}
            >
              ${parseFloat(price!).toFixed(2)}
            </p>
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
