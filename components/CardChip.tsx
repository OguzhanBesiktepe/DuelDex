"use client";

import Link from "next/link";

export interface CardResult {
  id: string;
  name: string;
  game: "yugioh" | "pokemon";
  price?: number;
  currency?: string;
  href: string;
  image?: string;
}

export default function CardChip({ card }: { card: CardResult }) {
  const sym = card.currency === "EUR" ? "€" : "$";
  const accentColor =
    card.game === "yugioh" ? "var(--ygo-accent)" : "var(--pkmn-accent)";
  const gameLabel = card.game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon";

  return (
    <Link
      href={card.href}
      className="flex items-center gap-2 rounded-xl px-2 py-2 shrink-0 transition-colors hover:bg-white/5"
      style={{
        background: "var(--background)",
        border: "1px solid var(--border)",
        maxWidth: 170,
        minWidth: 130,
      }}
    >
      {card.image && (
        <img
          src={card.image}
          alt={card.name}
          width={32}
          height={45}
          className="rounded shrink-0 object-contain"
          style={{ width: 32, height: 45 }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold truncate leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {card.name}
        </p>
        {card.price != null && card.price > 0 && (
          <p className="text-xs font-bold" style={{ color: "var(--price-color, #3ecf6a)" }}>
            {sym}{card.price.toFixed(2)}
          </p>
        )}
        <p className="text-[10px] mt-0.5" style={{ color: accentColor }}>
          {gameLabel} →
        </p>
      </div>
    </Link>
  );
}
