// Daily price snapshot job — called by Vercel Cron at 06:00 UTC.
// Fetches the top 100 YGO cards by price from YGOPRODeck and the top-numbered
// (rarest) cards from the 5 most recent large Pokémon sets via TCGdex,
// then writes a price snapshot document for each card into Firestore under:
//   price_snapshots/{YYYY-MM-DD}/yugioh/{cardId}
//   price_snapshots/{YYYY-MM-DD}/pokemon/{cardId}
//
// Secured by a Bearer token — only Vercel Cron (which sends the CRON_SECRET
// header automatically) and manual calls with the correct secret can trigger it.

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Returns today's date as "YYYY-MM-DD" in UTC
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CardSnapshot {
  cardId: string;
  name: string;
  image: string;
  price: number;
  href: string;
}

// ── Yu-Gi-Oh! ─────────────────────────────────────────────────────────────────

async function snapshotYGO(date: string): Promise<number> {
  const res = await fetch(
    "https://db.ygoprodeck.com/api/v7/cardinfo.php?num=100&offset=0&sort=new&tcgplayer_data=true",
    { cache: "no-store" },
  );
  if (!res.ok) return 0;

  const data = await res.json();
  const rawCards: {
    id: number;
    name: string;
    card_images: { image_url_small: string }[];
    card_prices: { tcgplayer_price: string }[];
  }[] = data.data ?? [];

  // Sort by TCGPlayer price descending so we store the most valuable cards
  const cards = rawCards
    .filter((c) => parseFloat(c.card_prices?.[0]?.tcgplayer_price ?? "0") > 0)
    .sort(
      (a, b) =>
        parseFloat(b.card_prices?.[0]?.tcgplayer_price ?? "0") -
        parseFloat(a.card_prices?.[0]?.tcgplayer_price ?? "0"),
    );

  const db = getAdminDb();
  const batch = db.batch();
  let count = 0;

  for (const card of cards) {
    const price = parseFloat(card.card_prices?.[0]?.tcgplayer_price ?? "0");
    if (price <= 0) continue;

    const ref = db
      .collection("price_snapshots")
      .doc(date)
      .collection("yugioh")
      .doc(String(card.id));

    const snap: CardSnapshot = {
      cardId: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url_small ?? "",
      price,
      href: `/yugioh/card/${card.id}`,
    };
    batch.set(ref, snap);
    count++;
  }

  await batch.commit();
  return count;
}

// ── Pokémon ───────────────────────────────────────────────────────────────────

async function snapshotPokemon(date: string): Promise<number> {
  // Step 1 — fetch all sets, keep the 5 most recent with ≥ 80 cards
  const setsRes = await fetch("https://api.tcgdex.net/v2/en/sets", {
    cache: "no-store",
  });
  if (!setsRes.ok) return 0;

  const allSets: { id: string; cardCount?: { total: number } }[] =
    await setsRes.json();

  const bigSets = allSets
    .filter((s) => (s.cardCount?.total ?? 0) >= 80)
    .slice(-5); // last 5 = most recently released

  // Step 2 — for each set, grab the 15 highest-numbered cards (likely rarest)
  const cardIdBatches = await Promise.all(
    bigSets.map(async (s) => {
      try {
        const r = await fetch(`https://api.tcgdex.net/v2/en/sets/${s.id}`, {
          cache: "no-store",
        });
        if (!r.ok) return [] as string[];
        const d: { cards?: { id: string; localId: string }[] } = await r.json();
        return (d.cards ?? [])
          .filter((c) => !isNaN(parseInt(c.localId, 10)))
          .sort((a, b) => parseInt(b.localId, 10) - parseInt(a.localId, 10))
          .slice(0, 15)
          .map((c) => c.id);
      } catch {
        return [] as string[];
      }
    }),
  );

  const allIds = cardIdBatches.flat();

  // Step 3 — fetch individual card details in parallel to get price data
  const cardDetails = await Promise.all(
    allIds.map(async (id) => {
      try {
        const r = await fetch(`https://api.tcgdex.net/v2/en/cards/${id}`, {
          cache: "no-store",
        });
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    }),
  );

  const db = getAdminDb();
  const batch = db.batch();
  let count = 0;

  for (const card of cardDetails) {
    if (!card?.id) continue;
    // Prefer holofoil price; fall back to normal
    const price = card.variants?.holofoil ?? card.variants?.normal ?? 0;
    if (!price || Number(price) <= 0) continue;

    const ref = db
      .collection("price_snapshots")
      .doc(date)
      .collection("pokemon")
      .doc(card.id);

    const snap: CardSnapshot = {
      cardId: card.id,
      name: card.name ?? "",
      image: card.image ? `${card.image}/high.webp` : "",
      price: Number(price),
      href: `/pokemon/card/${card.id}`,
    };
    batch.set(ref, snap);
    count++;
  }

  await batch.commit();
  return count;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayUTC();

  const [ygoCount, pkmnCount] = await Promise.all([
    snapshotYGO(date).catch(() => 0),
    snapshotPokemon(date).catch(() => 0),
  ]);

  return NextResponse.json({ ok: true, date, yugioh: ygoCount, pokemon: pkmnCount });
}
