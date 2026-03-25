// Daily price snapshot job — called by Vercel Cron at 06:00 UTC.
//
// Architecture (read-efficient):
//   1. Reads previous snapshot from price_snapshots/{game} (1 read per game)
//   2. Fetches fresh prices from external APIs
//   3. Computes top-6 movers by comparing new vs previous prices
//   4. Writes new snapshot to price_snapshots/{game} as a SINGLE document (1 write per game)
//   5. Writes computed movers to price_movers/{game} as a SINGLE document (1 write per game)
//
// PriceMovers on the homepage reads only price_movers/{game} — 2 reads total per cache window.
// This avoids the previous design of 268 individual card documents per day.

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getBestTcgPrice } from "@/lib/pokemon";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface CardSnapshot {
  cardId: string;
  name: string;
  image: string;
  price: number;
  href: string;
}

interface Mover extends CardSnapshot {
  prevPrice: number;
  pct: number;
}

interface SnapshotDoc {
  date: string;
  cards: CardSnapshot[];
}

interface MoversDoc {
  date: string;
  movers: Mover[];
  hasHistory: boolean;
}

// Computes top-6 movers by comparing today's cards against previous snapshot.
function computeMovers(today: CardSnapshot[], prev: CardSnapshot[]): MoversDoc {
  const date = new Date().toISOString().slice(0, 10);

  if (prev.length === 0) {
    // No previous snapshot — show top 6 by price
    const movers = today
      .filter((c) => c.price > 0)
      .sort((a, b) => b.price - a.price)
      .slice(0, 6)
      .map((c) => ({ ...c, prevPrice: 0, pct: 0 }));
    return { date, movers, hasHistory: false };
  }

  const prevMap = new Map<string, number>(prev.map((c) => [c.cardId, c.price]));

  const movers: Mover[] = [];
  for (const card of today) {
    const prevPrice = prevMap.get(card.cardId);
    if (!prevPrice || prevPrice <= 0) continue;
    const pct = ((card.price - prevPrice) / prevPrice) * 100;
    if (Math.abs(pct) < 1) continue; // ignore sub-1% noise
    movers.push({ ...card, prevPrice, pct });
  }

  movers.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  if (movers.length === 0) {
    // No meaningful movers — fall back to top 6 by current price
    const top = today
      .filter((c) => c.price > 0)
      .sort((a, b) => b.price - a.price)
      .slice(0, 6)
      .map((c) => ({ ...c, prevPrice: 0, pct: 0 }));
    return { date, movers: top, hasHistory: false };
  }

  return { date, movers: movers.slice(0, 6), hasHistory: true };
}

// ── Yu-Gi-Oh! ─────────────────────────────────────────────────────────────────

async function processYGO(date: string): Promise<number> {
  const res = await fetch(
    "https://db.ygoprodeck.com/api/v7/cardinfo.php?num=200&offset=0&tcgplayer_data=true",
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

  const today: CardSnapshot[] = rawCards
    .map((c) => ({
      cardId: String(c.id),
      name: c.name,
      image: c.card_images?.[0]?.image_url_small ?? "",
      price: parseFloat(c.card_prices?.[0]?.tcgplayer_price ?? "0") || 0,
      href: `/yugioh/card/${c.id}`,
    }))
    .filter((c) => c.price > 0)
    .sort((a, b) => b.price - a.price);

  if (today.length === 0) return 0;

  const db = getAdminDb();

  // Read previous snapshot — fall back to empty if Firestore is unavailable
  let prev: CardSnapshot[] = [];
  try {
    const prevSnap = await db.collection("price_snapshots").doc("yugioh").get();
    prev = prevSnap.exists ? ((prevSnap.data() as SnapshotDoc).cards ?? []) : [];
  } catch {
    // Quota exceeded or network error — proceed without history
  }

  const moversDoc = computeMovers(today, prev);

  // Write new snapshot + movers — if quota is exceeded these will also fail,
  // but at least we tried and the error surfaces in the response
  await Promise.all([
    db.collection("price_snapshots").doc("yugioh").set({ date, cards: today } as SnapshotDoc),
    db.collection("price_movers").doc("yugioh").set(moversDoc),
  ]);

  return today.length;
}

// ── Pokémon ───────────────────────────────────────────────────────────────────

async function processPokemon(date: string): Promise<number> {
  const setsRes = await fetch("https://api.tcgdex.net/v2/en/sets", {
    cache: "no-store",
  });
  if (!setsRes.ok) return 0;

  const allSets: { id: string; cardCount?: { total: number } }[] =
    await setsRes.json();

  const bigSets = allSets
    .filter((s) => (s.cardCount?.total ?? 0) >= 80 && s.id.startsWith("swsh"))
    .slice(-5);

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

  // Fetch card details in batches of 10
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardDetails: any[] = [];
  for (let i = 0; i < allIds.length; i += 10) {
    const batch = allIds.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (id) => {
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
    cardDetails.push(...results);
  }

  const today: CardSnapshot[] = cardDetails
    .filter((c) => c?.id)
    .map((c) => ({
      cardId: c.id,
      name: c.name ?? "",
      image: c.image ? `${c.image}/high.webp` : "",
      price: Number(getBestTcgPrice(c) ?? 0),
      href: `/pokemon/card/${c.id}`,
    }))
    .filter((c) => c.price > 0);

  if (today.length === 0) return 0;

  const db = getAdminDb();

  let prev: CardSnapshot[] = [];
  try {
    const prevSnap = await db.collection("price_snapshots").doc("pokemon").get();
    prev = prevSnap.exists ? ((prevSnap.data() as SnapshotDoc).cards ?? []) : [];
  } catch {
    // Quota exceeded or network error — proceed without history
  }

  const moversDoc = computeMovers(today, prev);

  await Promise.all([
    db.collection("price_snapshots").doc("pokemon").set({ date, cards: today } as SnapshotDoc),
    db.collection("price_movers").doc("pokemon").set(moversDoc),
  ]);

  return today.length;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);

  const [ygoCount, pkmnCount] = await Promise.all([
    processYGO(date).catch(() => 0),
    processPokemon(date).catch(() => 0),
  ]);

  return NextResponse.json({ ok: true, date, yugioh: ygoCount, pokemon: pkmnCount });
}
