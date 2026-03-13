// PriceMovers — server component rendered on the homepage.
// Reads yesterday's and today's price snapshots from Firestore (written by the
// daily cron job), computes the biggest movers, and renders two rows of 6 cards
// (Yu-Gi-Oh! in orange, Pokémon in blue) with the same spring hover as the hero.
//
// Returns null on day 1 (no yesterday to compare against) or if the cron hasn't
// run yet — the homepage simply omits the section rather than showing an error.

import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import styles from "./PriceMovers.module.css";

interface CardSnapshot {
  cardId: string;
  name: string;
  image: string;
  price: number;
  href: string;
}

interface Mover extends CardSnapshot {
  prevPrice: number;
  pct: number; // signed percentage change
}

function dateStringUTC(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

interface MoversResult {
  movers: Mover[];
  hasHistory: boolean;
}

async function getMovers(game: "yugioh" | "pokemon"): Promise<MoversResult> {
  try {
    const db = getAdminDb();
    const today = dateStringUTC(0);
    const yesterday = dateStringUTC(-1);

    const [todaySnap, yestSnap] = await Promise.all([
      db.collection("price_snapshots").doc(today).collection(game).get(),
      db.collection("price_snapshots").doc(yesterday).collection(game).get(),
    ]);

    if (todaySnap.empty) return { movers: [], hasHistory: false };

    // No yesterday data yet — show top 6 by current price
    if (yestSnap.empty) {
      const top: Mover[] = todaySnap.docs
        .map((d) => ({ ...(d.data() as CardSnapshot), prevPrice: 0, pct: 0 }))
        .filter((c) => c.price > 0)
        .sort((a, b) => b.price - a.price)
        .slice(0, 6);
      return { movers: top, hasHistory: false };
    }

    // Build cardId → yesterday's price lookup
    const yestMap = new Map<string, number>();
    for (const d of yestSnap.docs) {
      yestMap.set(d.id, (d.data() as CardSnapshot).price);
    }

    const movers: Mover[] = [];
    for (const d of todaySnap.docs) {
      const card = d.data() as CardSnapshot;
      const prev = yestMap.get(d.id);
      if (!prev || prev <= 0) continue;
      const pct = ((card.price - prev) / prev) * 100;
      if (Math.abs(pct) < 1) continue; // ignore sub-1% noise
      movers.push({ ...card, prevPrice: prev, pct });
    }

    // Biggest absolute movers first, show top 6
    movers.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    return { movers: movers.slice(0, 6), hasHistory: true };
  } catch {
    return { movers: [], hasHistory: false };
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MoverTile({ mover, showPct }: { mover: Mover; showPct: boolean }) {
  const up = mover.pct >= 0;
  return (
    <Link href={mover.href} className={styles.tile}>
      <div className={styles.imageWrap}>
        {mover.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mover.image} alt={mover.name} className={styles.cardImg} />
        )}
      </div>

      <div className="mt-2 px-0.5">
        <p
          className="truncate text-xs font-semibold leading-snug"
          style={{ color: "#F0F2FF" }}
        >
          {mover.name}
        </p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-xs font-bold" style={{ color: "#3ecf6a" }}>
            ${mover.price.toFixed(2)}
          </span>
          {showPct && (
            <span
              className={styles.badge}
              style={{
                background: up
                  ? "rgba(62,207,106,0.15)"
                  : "rgba(204,31,31,0.15)",
                color: up ? "#3ecf6a" : "#ff6b6b",
                border: `1px solid ${up ? "rgba(62,207,106,0.35)" : "rgba(204,31,31,0.35)"}`,
              }}
            >
              {up ? "▲" : "▼"} {Math.abs(mover.pct).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MoverRow({
  label,
  accent,
  movers,
  hasHistory,
  className,
}: {
  label: string;
  accent: string;
  movers: Mover[];
  hasHistory: boolean;
  className?: string;
}) {
  if (movers.length === 0) return null;
  return (
    <div className={className}>
      <p
        className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        {label}
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {movers.map((m) => (
          <MoverTile key={`${m.cardId}-${m.href}`} mover={m} showPct={hasHistory} />
        ))}
      </div>
    </div>
  );
}

// ── Page section ──────────────────────────────────────────────────────────────

export default async function PriceMovers() {
  const [ygoResult, pkmnResult] = await Promise.all([
    getMovers("yugioh"),
    getMovers("pokemon"),
  ]);

  const { movers: ygoMovers, hasHistory: ygoHistory } = ygoResult;
  const { movers: pkmnMovers, hasHistory: pkmnHistory } = pkmnResult;

  if (ygoMovers.length === 0 && pkmnMovers.length === 0) return null;

  // If neither game has history yet, label as "Top Cards" instead of "Price Movers"
  const hasAnyHistory = ygoHistory || pkmnHistory;
  const heading = hasAnyHistory ? "🔥 Price Movers" : "🔥 Top Cards Today";

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-12"
      style={{ borderTop: "1px solid #1A2035" }}
    >
      <h2
        className="mb-8 text-lg font-bold uppercase tracking-widest"
        style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
      >
        {heading}
      </h2>

      <MoverRow
        label="Yu-Gi-Oh!"
        accent="#FF7A00"
        movers={ygoMovers}
        hasHistory={ygoHistory}
        className={pkmnMovers.length > 0 ? "mb-10" : undefined}
      />
      <MoverRow label="Pokémon" accent="#00AAFF" movers={pkmnMovers} hasHistory={pkmnHistory} />
    </section>
  );
}
