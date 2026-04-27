"use client";

// PortfolioChart — renders on the list detail page.
// Timeline view: cumulative cost-basis area chart as cards were added, ending at today's current value.
// Breakdown view: horizontal bar chart comparing what was paid vs current price for each card.
// Supports date-range filtering, PNG export (html-to-image), and CSV export.

import { useRef, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import type { ListItem } from "@/lib/firestore";

type DateRange = "30d" | "90d" | "all";
type View = "timeline" | "breakdown";
type CurrencyTab = "usd" | "eur";

function itemKey(item: ListItem): string {
  return item.setCode ? `${item.cardId}__${item.setCode}` : item.cardId;
}

// Build cumulative cost-basis timeline data points for one game/currency
function buildTimelineData(
  items: ListItem[],
  currentPrices: Record<string, number | null>,
  game: "yugioh" | "pokemon",
  dateRange: DateRange,
) {
  const now = new Date();
  const cutoff =
    dateRange === "30d"
      ? new Date(now.getTime() - 30 * 86_400_000)
      : dateRange === "90d"
        ? new Date(now.getTime() - 90 * 86_400_000)
        : null;

  const filtered = items
    .filter((i) => i.game === game && (cutoff == null || i.dateAdded >= cutoff))
    .sort((a, b) => a.dateAdded.getTime() - b.dateAdded.getTime());

  if (filtered.length === 0) return [];

  // Merge cards added on the same calendar date into one data point
  const dateMap = new Map<string, { costBasis: number; cards: string[] }>();
  let running = 0;
  for (const item of filtered) {
    running += item.priceWhenAdded ?? 0;
    const key = item.dateAdded.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const entry = dateMap.get(key);
    if (entry) {
      entry.costBasis = running;
      entry.cards.push(item.cardName);
    } else {
      dateMap.set(key, { costBasis: running, cards: [item.cardName] });
    }
  }

  const points: {
    date: string;
    costBasis: number;
    currentValue: number | null;
    cards: string[];
  }[] = Array.from(dateMap.entries()).map(([date, d]) => ({
    date,
    costBasis: parseFloat(d.costBasis.toFixed(2)),
    currentValue: null,
    cards: d.cards,
  }));

  // Append today's current market value as the final data point
  const currentTotal = parseFloat(
    filtered.reduce((s, i) => s + (currentPrices[itemKey(i)] ?? 0), 0).toFixed(2),
  );
  const todayStr = now.toLocaleDateString("en-CA");
  const last = points[points.length - 1];
  if (last?.date === todayStr) {
    last.currentValue = currentTotal;
  } else {
    points.push({ date: todayStr, costBasis: last?.costBasis ?? 0, currentValue: currentTotal, cards: [] });
  }

  return points;
}

// Build per-card paid vs current breakdown
function buildBreakdownData(
  items: ListItem[],
  currentPrices: Record<string, number | null>,
  game: "yugioh" | "pokemon",
) {
  return items
    .filter((i) => i.game === game)
    .map((item) => {
      const current = currentPrices[itemKey(item)] ?? 0;
      const paid = item.priceWhenAdded ?? 0;
      return {
        name: item.cardName.length > 22 ? item.cardName.slice(0, 20) + "…" : item.cardName,
        fullName: item.cardName,
        setName: item.setName ?? "",
        dateAdded: item.dateAdded.toLocaleDateString(),
        paid: parseFloat(paid.toFixed(2)),
        current: parseFloat(current.toFixed(2)),
        gain: parseFloat((current - paid).toFixed(2)),
      };
    })
    .sort((a, b) => b.current - a.current);
}

// Custom tooltip for the timeline chart
function TimelineTooltip({
  active,
  payload,
  label,
  currency,
  data,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  currency: string;
  data: { date: string; cards: string[] }[];
}) {
  if (!active || !payload?.length) return null;
  const point = data.find((d) => d.date === label);
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs max-w-[200px]"
      style={{ background: "#0E1220", borderColor: "#1A2035" }}
    >
      <p className="mb-1.5 font-semibold" style={{ color: "#F0F2FF" }}>
        {label}
      </p>
      {payload.map((p) =>
        p.value == null ? null : (
          <p key={p.name} style={{ color: p.name === "costBasis" ? "#7A8BA8" : "#3ecf6a" }}>
            {p.name === "costBasis" ? "Cost Basis" : "Current Value"}:{" "}
            <span className="font-semibold">
              {currency}
              {p.value.toFixed(2)}
            </span>
          </p>
        ),
      )}
      {point?.cards && point.cards.length > 0 && (
        <div className="mt-1.5 pt-1.5" style={{ borderTop: "1px solid #1A2035" }}>
          <p style={{ color: "#7A8BA8" }}>Added:</p>
          {point.cards.map((c, i) => (
            <p key={i} className="truncate" style={{ color: "#F0F2FF" }}>
              • {c}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioChart({
  items,
  currentPrices,
  listName,
}: {
  items: ListItem[];
  currentPrices: Record<string, number | null>;
  listName: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("timeline");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [tab, setTab] = useState<CurrencyTab>("usd");

  const hasUSD = items.some((i) => i.game === "yugioh");
  const hasEUR = items.some((i) => i.game === "pokemon");
  // If the user only has one currency, force that tab
  const activeTab: CurrencyTab = hasUSD && hasEUR ? tab : hasUSD ? "usd" : "eur";

  const currency = activeTab === "usd" ? "$" : "€";
  const game = activeTab === "usd" ? "yugioh" : "pokemon";

  const timelineData = buildTimelineData(items, currentPrices, game, dateRange);
  const breakdownData = buildBreakdownData(items, currentPrices, game);

  // ── CSV export ────────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const currencyLabel = activeTab === "usd" ? "USD" : "EUR";
    const rows: string[][] = [
      [
        "Card Name",
        "Game",
        "Set",
        "Date Added",
        `Price When Added (${currencyLabel})`,
        `Current Price (${currencyLabel})`,
        "Change",
        "Change %",
      ],
    ];

    for (const item of items) {
      const current = currentPrices[itemKey(item)] ?? 0;
      const paid = item.priceWhenAdded ?? 0;
      const change = current - paid;
      const pct = paid > 0 ? ((change / paid) * 100).toFixed(1) : "N/A";
      rows.push([
        item.cardName,
        item.game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon",
        item.setName ?? "",
        item.dateAdded.toLocaleDateString(),
        paid.toFixed(2),
        current.toFixed(2),
        change.toFixed(2),
        pct,
      ]);
    }

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName.replace(/\s+/g, "_")}_portfolio.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, currentPrices, activeTab, listName]);

  // ── PNG export (dynamic import keeps html-to-image out of the server bundle) ──
  const exportPNG = useCallback(async () => {
    if (!chartRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(chartRef.current, { backgroundColor: "#0E1220" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${listName.replace(/\s+/g, "_")}_chart.png`;
    a.click();
  }, [listName]);

  if (!hasUSD && !hasEUR) return null;

  return (
    <div
      className="rounded-2xl border mb-6"
      style={{ background: "#0E1220", borderColor: "#1A2035" }}
    >
      {/* ── Header + controls ───────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #1A2035" }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
        >
          Portfolio Chart
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* USD / EUR tab — only shown when the list contains both games */}
          {hasUSD && hasEUR && (
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: "#1A2035" }}
            >
              {(["usd", "eur"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-3 py-1 text-xs font-semibold transition"
                  style={{
                    background: activeTab === t ? "#FF7A00" : "#080B14",
                    color: activeTab === t ? "#080B14" : "#7A8BA8",
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Timeline / Breakdown toggle */}
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "#1A2035" }}
          >
            {(["timeline", "breakdown"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 text-xs font-semibold capitalize transition"
                style={{
                  background: view === v ? "#1A2035" : "#080B14",
                  color: view === v ? "#F0F2FF" : "#7A8BA8",
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Date range filter — timeline only */}
          {view === "timeline" && (
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: "#1A2035" }}
            >
              {(["30d", "90d", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className="px-3 py-1 text-xs font-semibold transition"
                  style={{
                    background: dateRange === r ? "#1A2035" : "#080B14",
                    color: dateRange === r ? "#F0F2FF" : "#7A8BA8",
                  }}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
          )}

          {/* Export buttons */}
          <button
            onClick={exportPNG}
            className="px-3 py-1 text-xs font-semibold rounded-lg transition hover:opacity-80"
            style={{ background: "#080B14", color: "#7A8BA8", border: "1px solid #1A2035" }}
            title="Save chart as PNG image"
          >
            ↓ PNG
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-1 text-xs font-semibold rounded-lg transition hover:opacity-80"
            style={{ background: "#080B14", color: "#7A8BA8", border: "1px solid #1A2035" }}
            title="Export as CSV (Excel)"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {/* ── Chart area (captured for PNG) ───────────────────────────────────── */}
      <div ref={chartRef} className="px-4 pt-4 pb-2" style={{ background: "#0E1220" }}>
        {view === "timeline" ? (
          timelineData.length < 2 ? (
            <p className="text-center text-xs py-10" style={{ color: "#7A8BA8" }}>
              Add cards on different dates to build a timeline.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7A8BA8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7A8BA8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3ecf6a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3ecf6a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2035" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#7A8BA8", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#7A8BA8", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${currency}${v}`}
                    width={64}
                  />
                  <Tooltip
                    content={
                      <TimelineTooltip currency={currency} data={timelineData} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="costBasis"
                    stroke="#7A8BA8"
                    fill="url(#costGrad)"
                    strokeWidth={2}
                    dot={false}
                    name="costBasis"
                  />
                  <Area
                    type="monotone"
                    dataKey="currentValue"
                    stroke="#3ecf6a"
                    fill="url(#currentGrad)"
                    strokeWidth={2}
                    dot={{ fill: "#3ecf6a", r: 5, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#3ecf6a" }}
                    name="currentValue"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex gap-5 px-1 pb-2 pt-1 text-xs" style={{ color: "#7A8BA8" }}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block rounded"
                    style={{ width: 20, height: 2, background: "#7A8BA8" }}
                  />
                  Cost Basis
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block rounded-full"
                    style={{ width: 8, height: 8, background: "#3ecf6a" }}
                  />
                  Current Value
                </span>
              </div>
            </>
          )
        ) : breakdownData.length === 0 ? (
          <p className="text-center text-xs py-10" style={{ color: "#7A8BA8" }}>
            No cards in this currency.
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, breakdownData.length * 52)}
          >
            <BarChart
              layout="vertical"
              data={breakdownData}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2035" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#7A8BA8", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${currency}${v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#7A8BA8", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as (typeof breakdownData)[0];
                  if (!d) return null;
                  const gain = d.current - d.paid;
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 text-xs"
                      style={{ background: "#0E1220", borderColor: "#1A2035" }}
                    >
                      <p className="font-semibold mb-1" style={{ color: "#F0F2FF" }}>
                        {d.fullName}
                      </p>
                      {d.setName && (
                        <p className="mb-1" style={{ color: "#7A8BA8" }}>
                          {d.setName}
                        </p>
                      )}
                      <p style={{ color: "#7A8BA8" }}>
                        Added {d.dateAdded}
                      </p>
                      <p style={{ color: "#7A8BA8" }}>
                        Paid:{" "}
                        <span style={{ color: "#F0F2FF" }}>
                          {currency}
                          {d.paid.toFixed(2)}
                        </span>
                      </p>
                      <p style={{ color: "#7A8BA8" }}>
                        Now:{" "}
                        <span style={{ color: "#F0F2FF" }}>
                          {currency}
                          {d.current.toFixed(2)}
                        </span>
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: gain >= 0 ? "#3ecf6a" : "#CC1F1F" }}
                      >
                        {gain >= 0 ? "▲" : "▼"} {currency}
                        {Math.abs(gain).toFixed(2)}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(v) => (
                  <span style={{ color: "#7A8BA8", fontSize: 11 }}>
                    {v === "paid" ? "Paid" : "Current"}
                  </span>
                )}
              />
              {/* "Paid" bar — always steel-grey */}
              <Bar dataKey="paid" name="paid" fill="#1A2035" radius={[0, 4, 4, 0]} barSize={14} />
              {/* "Current" bar — green if gain, red if loss */}
              <Bar dataKey="current" name="current" radius={[0, 4, 4, 0]} barSize={14}>
                {breakdownData.map((d, i) => (
                  <Cell key={i} fill={d.gain >= 0 ? "#3ecf6a" : "#CC1F1F"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
