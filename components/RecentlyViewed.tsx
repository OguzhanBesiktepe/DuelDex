"use client";

// RecentlyViewed — reads the localStorage history written by RecordView and renders
// a horizontal scroll row of recently visited cards. Hidden for users with no history.
// Shows 8 cards on mobile, 12 on desktop. Cards are larger on mobile for easier tapping.
// A right-edge fade hints that the row is scrollable.

import { useEffect, useState } from "react";
import Link from "next/link";

interface StoredCard {
  cardId: string;
  game: "yugioh" | "pokemon";
  name: string;
  image: string;
  viewedAt: number;
}

const KEY = "dd_recently_viewed";

export default function RecentlyViewed() {
  const [cards, setCards] = useState<StoredCard[]>([]);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    // Reduce count on small screens
    if (window.innerWidth < 768) setLimit(8);
    try {
      const stored: StoredCard[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      setCards(stored);
    } catch {}
  }, []);

  const visible = cards.slice(0, limit);
  if (visible.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-4 py-10">
      <p
        className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
        style={{ color: "var(--text-muted)" }}
      >
        Recently Viewed
      </p>

      {/* Wrapper provides the fade-out right edge hint */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {visible.map((card) => (
            <Link
              key={`${card.game}-${card.cardId}`}
              href={`/${card.game}/card/${card.cardId}?from=${encodeURIComponent("/")}`}
              className="shrink-0 flex flex-col gap-2 group"
              style={{ width: "clamp(80px, 22vw, 100px)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image}
                alt={card.name}
                className="rounded-md w-full object-cover transition-opacity duration-200 group-hover:opacity-70"
                style={{ aspectRatio: "3/4", background: "var(--surface)" }}
              />
              <p
                className="text-xs font-medium text-center leading-tight line-clamp-2"
                style={{ color: "var(--text-muted)" }}
              >
                {card.name}
              </p>
              <span
                className="text-xs text-center font-bold uppercase tracking-wider"
                style={{ color: card.game === "yugioh" ? "var(--ygo-accent)" : "var(--pkmn-accent)" }}
              >
                {card.game === "yugioh" ? "YGO" : "PKM"}
              </span>
            </Link>
          ))}
        </div>

        {/* Right-edge fade to hint scrollability */}
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-16"
          style={{
            background: "linear-gradient(to right, transparent, #080B14)",
          }}
        />
      </div>
    </section>
  );
}
