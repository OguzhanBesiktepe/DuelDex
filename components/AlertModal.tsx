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

  if (!user) return null;

  const symbol = currency === "EUR" ? "€" : "$";
  const val = parseFloat(thresholdValue);
  const canSave = val > 0 && currentPrice > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (existingAlert) {
        await updateAlert(user.uid, existingAlert.id, { thresholdType, thresholdValue: val, direction });
      } else {
        await createAlert(user.uid, user.email ?? "", {
          cardId, cardName, cardImage, game,
          setCode, setName,
          thresholdType,
          thresholdValue: val,
          direction,
          baselinePrice: currentPrice,
          currency,
        });
      }
      onSaved();
      onClose();
    } catch {
      // noop — user can retry
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
        style={{ background: "#0E1220", border: "1px solid #1A2035", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold" style={{ color: "#F0F2FF" }}>
              {existingAlert ? "Edit Alert" : "Set Price Alert"}
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#7A8BA8", maxWidth: 220 }}>
              {cardName}{setCode ? ` · ${setCode}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none transition hover:opacity-60" style={{ color: "#7A8BA8" }}>✕</button>
        </div>

        {/* Baseline price */}
        <div className="rounded-lg px-4 py-3 mb-5" style={{ background: "#080B14", border: "1px solid #1A2035" }}>
          <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>Current baseline</p>
          <p className="text-lg font-bold" style={{ color: "#3ecf6a" }}>
            {currentPrice > 0 ? `${symbol}${(existingAlert?.baselinePrice ?? currentPrice).toFixed(2)}` : "No price data"}
          </p>
        </div>

        {/* Threshold type */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#7A8BA8" }}>Alert when price changes by</p>
        <div className="flex gap-2 mb-3">
          {(["percent", "amount"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setThresholdType(t)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                background: thresholdType === t ? "rgba(255,122,0,0.15)" : "#080B14",
                border: `1px solid ${thresholdType === t ? "#FF7A00" : "#1A2035"}`,
                color: thresholdType === t ? "#FF7A00" : "#7A8BA8",
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
                  background: thresholdValue === String(p) ? "rgba(255,122,0,0.15)" : "#080B14",
                  border: `1px solid ${thresholdValue === String(p) ? "#FF7A00" : "#1A2035"}`,
                  color: thresholdValue === String(p) ? "#FF7A00" : "#7A8BA8",
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
            style={{ background: "#080B14", border: "1px solid #1A2035", color: "#F0F2FF" }}
            placeholder={thresholdType === "percent" ? "e.g. 10" : "e.g. 5.00"}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#7A8BA8" }}>
            {thresholdType === "percent" ? "%" : symbol}
          </span>
        </div>

        {/* Direction */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#7A8BA8" }}>Direction</p>
        <div className="flex gap-2 mb-6">
          {(["up", "down", "both"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                background: direction === d ? "rgba(255,122,0,0.15)" : "#080B14",
                border: `1px solid ${direction === d ? "#FF7A00" : "#1A2035"}`,
                color: direction === d ? "#FF7A00" : "#7A8BA8",
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
            style={{ background: "#FF7A00", color: "#080B14" }}
          >
            {saving ? "Saving…" : existingAlert ? "Update Alert" : "Create Alert"}
          </button>

          {existingAlert && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
              style={{ color: "#CC1F1F", border: "1px solid rgba(204,31,31,0.3)" }}
            >
              {deleting ? "Deleting…" : "Delete Alert"}
            </button>
          )}

          {currentPrice <= 0 && (
            <p className="text-center text-xs mt-1" style={{ color: "#7A8BA8" }}>
              Alerts require a known price baseline
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
