// PriceMovers — server component rendered on the homepage.
// Reads pre-computed mover results from price_movers/{game} in Firestore.
// The cron job does all the heavy computation — this component makes 2 reads total.

import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import styles from "./PriceMovers.module.css";

interface Mover {
  cardId: string;
  name: string;
  image: string;
  price: number;
  href: string;
  prevPrice: number;
  pct: number;
}

interface MoversDoc {
  date: string;
  movers: Mover[];
  hasHistory: boolean;
}

interface MoversResult {
  movers: Mover[];
  hasHistory: boolean;
}

async function getMovers(game: "yugioh" | "pokemon"): Promise<MoversResult> {
  try {
    const db = getAdminDb();
    const snap = await db.collection("price_movers").doc(game).get();
    if (!snap.exists) return { movers: [], hasHistory: false };
    const data = snap.data() as MoversDoc;
    return { movers: data.movers ?? [], hasHistory: data.hasHistory ?? false };
  } catch (err) {
    console.error(`[PriceMovers] getMovers(${game}) failed:`, err);
    return { movers: [], hasHistory: false };
  }
}

// Cached per game — 5 min TTL so empty results recover quickly after cron runs
const getCachedYGOMovers = unstable_cache(
  () => getMovers("yugioh"),
  ["price-movers-yugioh"],
  { revalidate: 300 },
);
const getCachedPkmnMovers = unstable_cache(
  () => getMovers("pokemon"),
  ["price-movers-pokemon"],
  { revalidate: 300 },
);

// ── Sub-components ─────────────────────────────────────────────────────────────

function MoverTile({ mover, showPct }: { mover: Mover; showPct: boolean }) {
  const up = mover.pct >= 0;
  return (
    <Link href={`${mover.href}?from=%2F`} className={styles.tile}>
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
  sublabel,
  accent,
  movers,
  hasHistory,
  className,
}: {
  label: string;
  sublabel: string;
  accent: string;
  movers: Mover[];
  hasHistory: boolean;
  className?: string;
}) {
  if (movers.length === 0) return null;
  return (
    <div className={className}>
      <div className="mb-4 flex items-baseline gap-3">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {label}
        </p>
        <span
          className="text-xs uppercase tracking-[0.15em]"
          style={{ color: "#7A8BA8" }}
        >
          {sublabel}
        </span>
      </div>
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
    getCachedYGOMovers(),
    getCachedPkmnMovers(),
  ]);

  const { movers: ygoMovers, hasHistory: ygoHistory } = ygoResult;
  const { movers: pkmnMovers, hasHistory: pkmnHistory } = pkmnResult;

  if (ygoMovers.length === 0 && pkmnMovers.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-12"
      style={{ borderTop: "1px solid #1A2035" }}
    >
      <h2
        className="mb-8 text-lg font-bold uppercase tracking-widest"
        style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
      >
        🔥 Market Today
      </h2>

      <MoverRow
        label="Yu-Gi-Oh!"
        sublabel={ygoHistory ? "Price Movers" : "Top Cards"}
        accent="#FF7A00"
        movers={ygoMovers}
        hasHistory={ygoHistory}
        className={pkmnMovers.length > 0 ? "mb-10" : undefined}
      />
      <MoverRow
        label="Pokémon"
        sublabel={pkmnHistory ? "Price Movers" : "Top Cards"}
        accent="#00AAFF"
        movers={pkmnMovers}
        hasHistory={pkmnHistory}
      />
    </section>
  );
}
