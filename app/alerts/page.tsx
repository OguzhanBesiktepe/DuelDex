"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getAlerts,
  updateAlert,
  deleteAlert,
  type PriceAlertWithId,
} from "@/lib/alerts";
import {
  getPortfolioAlertSettings,
  setPortfolioAlertSettings,
  savePushSubscription,
  removePushSubscription,
} from "@/lib/firestore";
import AlertModal from "@/components/AlertModal";
import Link from "next/link";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── Manual alerts ────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState<PriceAlertWithId[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [editingAlert, setEditingAlert] = useState<PriceAlertWithId | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Portfolio auto-alerts ────────────────────────────────────────────────
  const [portfolioEnabled, setPortfolioEnabled] = useState(false);
  const [portfolioThreshold, setPortfolioThreshold] = useState(10);
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  // ── Push notifications ───────────────────────────────────────────────────
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [currentSub, setCurrentSub] = useState<PushSubscription | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) router.push("/signin");
  }, [user, authLoading, router]);

  // Load manual alerts
  const loadAlerts = useCallback(async () => {
    if (!user) return;
    setAlertsLoading(true);
    const data = await getAlerts(user.uid);
    setAlerts(data);
    setAlertsLoading(false);
  }, [user]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Load portfolio alert settings
  useEffect(() => {
    if (!user) return;
    getPortfolioAlertSettings(user.uid).then(({ enabled, threshold }) => {
      setPortfolioEnabled(enabled);
      setPortfolioThreshold(threshold);
      setPortfolioLoading(false);
    });
  }, [user]);

  // Check push notification support and current subscription
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushSupported(true);
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      setCurrentSub(sub);
      setPushEnabled(Boolean(sub));
    });
  }, []);

  const handleSavePortfolio = async () => {
    if (!user) return;
    setPortfolioSaving(true);
    await setPortfolioAlertSettings(user.uid, portfolioEnabled, portfolioThreshold);
    setPortfolioSaving(false);
  };

  const handleToggleAlert = async (alert: PriceAlertWithId) => {
    if (!user) return;
    setTogglingId(alert.id);
    await updateAlert(user.uid, alert.id, { enabled: !alert.enabled });
    setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, enabled: !a.enabled } : a));
    setTogglingId(null);
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!user) return;
    setDeletingId(alertId);
    await deleteAlert(user.uid, alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setDeletingId(null);
  };

  const handleEnablePush = async () => {
    if (!user) return;
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushLoading(false); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as unknown as BufferSource,
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await savePushSubscription(user.uid, json);
      setCurrentSub(sub);
      setPushEnabled(true);
    } catch {
      // User denied or browser error
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    if (!user || !currentSub) return;
    setPushLoading(true);
    try {
      await currentSub.unsubscribe();
      await removePushSubscription(user.uid, currentSub.endpoint);
      setCurrentSub(null);
      setPushEnabled(false);
    } finally {
      setPushLoading(false);
    }
  };

  if (authLoading || !user) return null;

  const symbol = (currency: "USD" | "EUR") => currency === "EUR" ? "€" : "$";

  return (
    <div className="min-h-screen" style={{ background: "#080B14" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
        >
          My Alerts
        </h1>
        <p className="text-sm mb-8" style={{ color: "#7A8BA8" }}>
          Get notified when your cards move in price.
        </p>

        {/* ── Portfolio Auto-Alerts ── */}
        <section className="rounded-xl p-5 mb-6" style={{ background: "#0E1220", border: "1px solid #1A2035" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold" style={{ color: "#F0F2FF" }}>
              Portfolio Auto-Alerts
            </h2>
            {/* Toggle */}
            <button
              onClick={() => setPortfolioEnabled(!portfolioEnabled)}
              disabled={portfolioLoading}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50"
              style={{ background: portfolioEnabled ? "#FF7A00" : "#1A2035" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: portfolioEnabled ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: "#7A8BA8" }}>
            Automatically alert you when any card in your portfolio moves by the threshold below.
          </p>

          {portfolioEnabled && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#7A8BA8" }}>
                Threshold
              </p>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPortfolioThreshold(p)}
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    style={{
                      background: portfolioThreshold === p ? "rgba(255,122,0,0.15)" : "#080B14",
                      border: `1px solid ${portfolioThreshold === p ? "#FF7A00" : "#1A2035"}`,
                      color: portfolioThreshold === p ? "#FF7A00" : "#7A8BA8",
                    }}
                  >
                    ±{p}%
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={portfolioThreshold}
                    onChange={(e) => setPortfolioThreshold(Number(e.target.value))}
                    className="w-16 rounded-lg px-3 py-2 text-sm outline-none text-center"
                    style={{ background: "#080B14", border: "1px solid #1A2035", color: "#F0F2FF" }}
                  />
                  <span className="text-sm" style={{ color: "#7A8BA8" }}>%</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSavePortfolio}
            disabled={portfolioSaving || portfolioLoading}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "#FF7A00", color: "#080B14" }}
          >
            {portfolioSaving ? "Saving…" : "Save Settings"}
          </button>
        </section>

        {/* ── Push Notifications ── */}
        {pushSupported && (
          <section className="rounded-xl p-5 mb-6" style={{ background: "#0E1220", border: "1px solid #1A2035" }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold" style={{ color: "#F0F2FF" }}>
                Push Notifications
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: pushEnabled ? "rgba(62,207,106,0.15)" : "rgba(122,139,168,0.15)",
                  color: pushEnabled ? "#3ecf6a" : "#7A8BA8",
                }}
              >
                {pushEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: "#7A8BA8" }}>
              Get instant notifications on this device — even when the app is closed.
            </p>
            {pushEnabled ? (
              <button
                onClick={handleDisablePush}
                disabled={pushLoading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
                style={{ color: "#CC1F1F", border: "1px solid rgba(204,31,31,0.3)" }}
              >
                {pushLoading ? "Disabling…" : "Disable Push Notifications"}
              </button>
            ) : (
              <button
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="w-full py-2.5 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "#FF7A00", color: "#080B14" }}
              >
                {pushLoading ? "Enabling…" : "Enable Push Notifications"}
              </button>
            )}
          </section>
        )}

        {/* ── Manual Card Alerts ── */}
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#F0F2FF" }}>
            Manual Card Alerts
          </h2>

          {alertsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "#0E1220" }} />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div
              className="rounded-xl px-6 py-10 text-center"
              style={{ background: "#0E1220", border: "1px solid #1A2035" }}
            >
              <p className="text-3xl mb-3">🔕</p>
              <p className="text-sm font-semibold mb-1" style={{ color: "#F0F2FF" }}>No manual alerts yet</p>
              <p className="text-xs mb-4" style={{ color: "#7A8BA8" }}>
                Go to any card page and tap the bell icon to set a price alert.
              </p>
              <div className="flex gap-2 justify-center">
                <Link
                  href="/yugioh/monsters"
                  className="inline-block px-4 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
                  style={{ background: "#FF7A00", color: "#080B14" }}
                >
                  Browse Yu-Gi-Oh!
                </Link>
                <Link
                  href="/pokemon/pokemon"
                  className="inline-block px-4 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
                  style={{ background: "#00AAFF", color: "#080B14" }}
                >
                  Browse Pokémon
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alerts.map((alert) => {
                const sym = symbol(alert.currency);
                const thresholdLabel =
                  alert.thresholdType === "percent"
                    ? `±${alert.thresholdValue}%`
                    : `±${sym}${alert.thresholdValue.toFixed(2)}`;
                const dirLabel =
                  alert.direction === "up" ? "▲ Up only" : alert.direction === "down" ? "▼ Down only" : "Both directions";

                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: "#0E1220",
                      border: `1px solid ${alert.enabled ? "#1A2035" : "rgba(122,139,168,0.2)"}`,
                      opacity: alert.enabled ? 1 : 0.6,
                    }}
                  >
                    {/* Card image */}
                    <img
                      src={alert.cardImage}
                      alt={alert.cardName}
                      width={36}
                      height={50}
                      className="rounded object-cover shrink-0"
                      style={{ width: 36, height: 50 }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#F0F2FF" }}>
                        {alert.cardName}
                      </p>
                      <p className="text-xs" style={{ color: "#7A8BA8" }}>
                        {alert.setCode ? `${alert.setCode} · ` : ""}{thresholdLabel} · {dirLabel}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#3ecf6a" }}>
                        Baseline: {sym}{alert.baselinePrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit */}
                      <button
                        onClick={() => setEditingAlert(alert)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition hover:bg-white/5"
                        style={{ color: "#7A8BA8", border: "1px solid #1A2035" }}
                      >
                        Edit
                      </button>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggleAlert(alert)}
                        disabled={togglingId === alert.id}
                        className="relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50"
                        style={{ background: alert.enabled ? "#FF7A00" : "#1A2035" }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                          style={{ transform: alert.enabled ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        disabled={deletingId === alert.id}
                        className="px-2 py-1.5 rounded-lg text-xs transition hover:bg-white/5 disabled:opacity-40"
                        style={{ color: "#CC1F1F" }}
                      >
                        {deletingId === alert.id ? "…" : "✕"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit modal */}
      {editingAlert && (
        <AlertModal
          cardId={editingAlert.cardId}
          cardName={editingAlert.cardName}
          cardImage={editingAlert.cardImage}
          game={editingAlert.game}
          currentPrice={editingAlert.baselinePrice}
          currency={editingAlert.currency}
          setCode={editingAlert.setCode}
          setName={editingAlert.setName}
          existingAlert={editingAlert}
          onClose={() => setEditingAlert(null)}
          onSaved={loadAlerts}
        />
      )}
    </div>
  );
}
