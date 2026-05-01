"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getFirestore, collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

interface PricePoint {
  date: string;
  price: number;
  currency: string;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const currency = payload[0]?.payload?.currency ?? "USD";
  const sym = currency === "EUR" ? "€" : "$";
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-bold" style={{ color: "var(--price-color, #3ecf6a)" }}>
        {sym}{Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

export default function PriceHistoryChart({
  cardId,
  game,
}: {
  cardId: string;
  game: "yugioh" | "pokemon";
}) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const db = getDb();
        const col = collection(db, "price_history", game, cardId);
        const q = query(col, orderBy("date", "desc"), limit(30));
        const snap = await getDocs(q);
        if (cancelled) return;

        const points: PricePoint[] = snap.docs
          .map((d) => d.data() as PricePoint)
          .reverse();

        setData(points);
      } catch {
        // Firestore unavailable — leave data empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [cardId, game]);

  const displayed = range === 7 ? data.slice(-7) : data;

  const formatDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(m)}/${parseInt(day)}`;
  };

  const currency = data[0]?.currency ?? "USD";
  const sym = currency === "EUR" ? "€" : "$";

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 flex items-center justify-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", height: 180 }}
      >
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading price history…
        </span>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div
        className="rounded-2xl p-6 flex flex-col items-center justify-center gap-2"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", height: 180 }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Price History
        </span>
        <span className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Not enough data yet — history builds daily once this card is tracked by the price snapshot.
        </span>
      </div>
    );
  }

  const minPrice = Math.min(...displayed.map((d) => d.price));
  const maxPrice = Math.max(...displayed.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.15 || 0.5;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-cinzel, serif)" }}
        >
          Price History
        </span>
        <div className="flex gap-1">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-2 py-0.5 rounded text-xs font-medium transition"
              style={{
                background: range === r ? "var(--ygo-accent)" : "var(--border)",
                color: range === r ? "#080B14" : "var(--text-muted)",
              }}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={displayed} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(v) => `${sym}${Number(v).toFixed(2)}`}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--price-color, #3ecf6a)"
            strokeWidth={2}
            dot={displayed.length <= 7 ? { r: 3, fill: "var(--price-color, #3ecf6a)", strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: "var(--price-color, #3ecf6a)", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
