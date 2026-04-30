"use client";

// Modal for creating or editing a manual price alert on a specific card.
// Renders as a fixed full-screen overlay so it is never clipped by overflow containers.

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  createAlert,
  updateAlert,
  deleteAlert,
  type PriceAlertWithId,
  type AlertThresholdType,
  type AlertDirection,
} from "@/lib/alerts";

interface AlertModalProps {
  cardId: string;
  cardName: string;
  cardImage: string;
  game: "yugioh" | "pokemon";
  currentPrice: number;
  currency: "USD" | "EUR";
  setCode?: string;
  setName?: string;
  existingAlert: PriceAlertWithId | null;
  onClose: () => void;
  onSaved: () => void;
}

const QUICK_PERCENTS = [5, 10, 15, 20];

export default function AlertModal({
  cardId, cardName, cardImage, game, currentPrice, currency,
  setCode, setName, existingAlert, onClose, onSaved,
}: AlertModalProps) {
  const { user } = useAuth();
  const [thresholdType, setThresholdType] = useState<AlertThresholdType>(
    existingAlert?.thresholdType ?? "percent"
  );
  const [thresholdValue, setThresholdValue] = useState(
    existingAlert?.thresholdValue?.toString() ?? "10"
  );
  const [direction, setDirection] = useState<AlertDirection>(
    existingAlert?.direction ?? "both"
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const symbol = currency === "EUR" ? "€" : "$";
  const val = parseFloat(thresholdValue);
  const canSave = val > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (existingAlert) {
        await updateAlert(user.uid, existingAlert.id, { thresholdType, thresholdValue: val, direction });
      } else {
        await createAlert(user.uid, user.email ?? "", {
          cardId, cardName, cardImage, game,
          ...(setCode !== undefined ? { setCode } : {}),
          ...(setName !== undefined ? { setName } : {}),
          thresholdType,
          thresholdValue: val,
          direction,
          baselinePrice: currentPrice,
          currency,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Alert save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save alert. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAlert) return;
    setDeleting(true);
    try {
      await deleteAlert(user.uid, existingAlert.id);
      onSaved();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--surface)", border: "1px solid #1A2035", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {existingAlert ? "Edit Alert" : "Set Price Alert"}
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)", maxWidth: 220 }}>
              {cardName}{setCode ? ` · ${setCode}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none transition hover:opacity-60" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>

        {/* Baseline price */}
        <div className="rounded-lg px-4 py-3 mb-5" style={{ background: "var(--background)", border: "1px solid #1A2035" }}>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Current baseline</p>
          <p className="text-lg font-bold" style={{ color: "var(--price-color)" }}>
            {currentPrice > 0 ? `${symbol}${(existingAlert?.baselinePrice ?? currentPrice).toFixed(2)}` : "No price data"}
          </p>
        </div>

        {/* Threshold type */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Alert when price changes by</p>
        <div className="flex gap-2 mb-3">
          {(["percent", "amount"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setThresholdType(t)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                background: thresholdType === t ? "rgba(255,122,0,0.15)" : "var(--background)",
                border: `1px solid ${thresholdType === t ? "var(--ygo-accent)" : "var(--border)"}`,
                color: thresholdType === t ? "var(--ygo-accent)" : "var(--text-muted)",
              }}
            >
              {t === "percent" ? "Percentage %" : `Fixed ${symbol}`}
            </button>
          ))}
        </div>

        {/* Quick % presets */}
        {thresholdType === "percent" && (
          <div className="flex gap-1.5 mb-3">
            {QUICK_PERCENTS.map((p) => (
              <button
                key={p}
                onClick={() => setThresholdValue(String(p))}
                className="flex-1 py-1.5 rounded-md text-xs font-bold transition-colors"
                style={{
                  background: thresholdValue === String(p) ? "rgba(255,122,0,0.15)" : "var(--background)",
                  border: `1px solid ${thresholdValue === String(p) ? "var(--ygo-accent)" : "var(--border)"}`,
                  color: thresholdValue === String(p) ? "var(--ygo-accent)" : "var(--text-muted)",
                }}
              >
                {p}%
              </button>
            ))}
          </div>
        )}

        {/* Value input */}
        <div className="relative mb-4">
          <input
            type="number"
            min="0.01"
            step={thresholdType === "percent" ? "1" : "0.01"}
            value={thresholdValue}
            onChange={(e) => setThresholdValue(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={{ background: "var(--background)", border: "1px solid #1A2035", color: "var(--text-primary)" }}
            placeholder={thresholdType === "percent" ? "e.g. 10" : "e.g. 5.00"}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {thresholdType === "percent" ? "%" : symbol}
          </span>
        </div>

        {/* Direction */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Direction</p>
        <div className="flex gap-2 mb-6">
          {(["up", "down", "both"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                background: direction === d ? "rgba(255,122,0,0.15)" : "var(--background)",
                border: `1px solid ${direction === d ? "var(--ygo-accent)" : "var(--border)"}`,
                color: direction === d ? "var(--ygo-accent)" : "var(--text-muted)",
              }}
            >
              {d === "up" ? "▲ Up" : d === "down" ? "▼ Down" : "Both"}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full py-3 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--ygo-accent)", color: "var(--background)" }}
          >
            {saving ? "Saving…" : existingAlert ? "Update Alert" : "Create Alert"}
          </button>

          {existingAlert && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
              style={{ color: "var(--primary-red)", border: "1px solid rgba(204,31,31,0.3)" }}
            >
              {deleting ? "Deleting…" : "Delete Alert"}
            </button>
          )}

          {error && (
            <p className="text-center text-xs mt-1 px-2 py-2 rounded-lg" style={{ color: "var(--primary-red)", background: "rgba(204,31,31,0.1)", border: "1px solid rgba(204,31,31,0.3)" }}>
              {error}
            </p>
          )}
          {currentPrice <= 0 && !error && (
            <p className="text-center text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              No price data — alert will use $0.00 as baseline
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
