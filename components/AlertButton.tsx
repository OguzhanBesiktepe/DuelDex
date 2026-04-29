"use client";

// Bell icon button for setting a manual price alert on a specific card.
// Shows filled/orange bell when an active alert exists, outlined bell otherwise.

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAlertsForCard, type PriceAlertWithId } from "@/lib/alerts";
import AlertModal from "@/components/AlertModal";

interface AlertButtonProps {
  cardId: string;
  cardName: string;
  cardImage: string;
  game: "yugioh" | "pokemon";
  currentPrice: number;
  currency?: "USD" | "EUR";
  setCode?: string;
  setName?: string;
}

export default function AlertButton({
  cardId, cardName, cardImage, game, currentPrice,
  currency, setCode, setName,
}: AlertButtonProps) {
  const { user } = useAuth();
  const [existingAlert, setExistingAlert] = useState<PriceAlertWithId | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const resolvedCurrency = currency ?? (game === "yugioh" ? "USD" : "EUR");

  const loadAlert = () => {
    if (!user) return;
    getAlertsForCard(user.uid, cardId, game).then((alerts) => {
      const match = alerts.find((a) => (a.setCode ?? "") === (setCode ?? ""));
      setExistingAlert(match ?? null);
    });
  };

  useEffect(loadAlert, [user, cardId, game, setCode]);

  if (!user) return null;

  const hasAlert = Boolean(existingAlert && existingAlert.enabled);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        title={hasAlert ? "Edit price alert" : "Set price alert"}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
        style={{
          background: hasAlert ? "rgba(255,122,0,0.1)" : "#0E1220",
          border: `1px solid ${hasAlert ? "rgba(255,122,0,0.4)" : "#1A2035"}`,
          color: hasAlert ? "#FF7A00" : "#7A8BA8",
        }}
      >
        <span>{hasAlert ? "🔔" : "🔕"}</span>
        {hasAlert ? "Alert On" : "Set Alert"}
      </button>

      {modalOpen && (
        <AlertModal
          cardId={cardId}
          cardName={cardName}
          cardImage={cardImage}
          game={game}
          currentPrice={currentPrice}
          currency={resolvedCurrency}
          setCode={setCode}
          setName={setName}
          existingAlert={existingAlert}
          onClose={() => setModalOpen(false)}
          onSaved={loadAlert}
        />
      )}
    </>
  );
}
