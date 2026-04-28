"use client";

// RecordView — invisible client component dropped into card detail pages.
// On mount it writes the card to localStorage so the homepage can show "Recently Viewed".
// Renders nothing — purely a side-effect component.

import { useEffect } from "react";

interface Props {
  cardId: string;
  game: "yugioh" | "pokemon";
  name: string;
  image: string;
}

interface StoredCard {
  cardId: string;
  game: "yugioh" | "pokemon";
  name: string;
  image: string;
  viewedAt: number;
}

const KEY = "dd_recently_viewed";
const MAX = 20;

export default function RecordView({ cardId, game, name, image }: Props) {
  useEffect(() => {
    try {
      const existing: StoredCard[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      // Remove any existing entry for this card so it moves to the front
      const filtered = existing.filter(
        (c) => !(c.cardId === cardId && c.game === game)
      );
      const updated = [
        { cardId, game, name, image, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable (private browsing, storage full) — fail silently
    }
  }, [cardId, game, name, image]);

  return null;
}
