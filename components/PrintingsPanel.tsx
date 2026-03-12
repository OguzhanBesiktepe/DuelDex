"use client";

// PrintingsPanel — shown on the YGO card detail page.
// Lists every printing of the card (set name, rarity, set-specific price).
// Clicking a row filters the Market Prices section to show that printing's TCGPlayer price.
// When the user is signed in, each row also has a ♥ button to favorite that specific printing.

import { useState, useMemo, useEffect } from "react";
import { getRarityColor } from "@/lib/rarityColors";
import { useAuth } from "@/lib/auth-context";
import {
  addFavorite,
  removeFavorite,
  getFavoritedSetCodesForCard,
} from "@/lib/firestore";

type CardSet = {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_price: string;
};

type CardPrice = {
  tcgplayer_price: string;
  ebay_price: string;
  cardmarket_price: string;
};

interface PrintingsPanelProps {
  sets: CardSet[];
  price: CardPrice | null;
  cardName: string;
  // Optional — when provided, favorite buttons appear on each printing row
  cardId?: string;
  cardImage?: string;
}

export default function PrintingsPanel({
  sets,
  price,
  cardName,
  cardId,
  cardImage,
}: PrintingsPanelProps) {
  const { user } = useAuth();

  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<number | null>(null);

  // Set codes that the user has already favorited for this card
  const [favoritedCodes, setFavoritedCodes] = useState<Set<string>>(new Set());
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  // Load which printings are already favorited
  useEffect(() => {
    if (!user || !cardId) return;
    getFavoritedSetCodesForCard(user.uid, cardId).then((codes) => {
      setFavoritedCodes(new Set(codes));
    });
  }, [user, cardId]);

  const handlePrintingFavorite = async (
    e: React.MouseEvent,
    s: CardSet
  ) => {
    e.stopPropagation(); // don't also select/deselect the row
    if (!user || !cardId || !cardImage) return;

    const code = s.set_code;
    setTogglingCode(code);

    if (favoritedCodes.has(code)) {
      await removeFavorite(user.uid, cardId, code);
      setFavoritedCodes((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    } else {
      await addFavorite(user.uid, {
        cardId,
        cardName,
        cardImage,
        game: "yugioh",
        priceWhenAdded: parseFloat(s.set_price) || 0,
        setName: s.set_name,
        setCode: s.set_code,
        setRarity: s.set_rarity,
      });
      setFavoritedCodes((prev) => new Set([...prev, code]));
    }

    setTogglingCode(null);
  };

  // Sort by set_price; $0 / unparseable prices always go to the bottom
  const sorted = useMemo(() => {
    return [...sets].sort((a, b) => {
      const pa = parseFloat(a.set_price);
      const pb = parseFloat(b.set_price);
      const aZero = isNaN(pa) || pa <= 0;
      const bZero = isNaN(pb) || pb <= 0;
      if (aZero && bZero) return 0;
      if (aZero) return 1;
      if (bZero) return -1;
      return sortDir === "asc" ? pa - pb : pb - pa;
    });
  }, [sets, sortDir]);

  const selectedSet = selected !== null ? sorted[selected] : null;
  const selectedPrice = selectedSet ? parseFloat(selectedSet.set_price) : null;

  const aggTCG = price ? parseFloat(price.tcgplayer_price) : 0;
  const aggEbay = price ? parseFloat(price.ebay_price) : 0;
  const aggCardmarket = price ? parseFloat(price.cardmarket_price) : 0;

  const displayTCG = selectedPrice && selectedPrice > 0 ? selectedPrice : aggTCG;
  const tcgIsPerPrinting = selectedPrice && selectedPrice > 0;

  const hasPrices = aggTCG > 0 || aggEbay > 0 || aggCardmarket > 0;

  const showFavoriteButtons = Boolean(user && cardId && cardImage);

  return (
    <div className="flex flex-col gap-6">
      {/* Market Prices */}
      {hasPrices && (
        <div
          className="rounded-xl p-4"
          style={{ background: "#0E1220", border: "1px solid #1A2035" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#7A8BA8" }}
            >
              Market Prices
            </p>
            {selectedSet && (() => {
              const rc = getRarityColor(selectedSet.set_rarity, "yugioh");
              return (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${rc}22`, color: rc, border: `1px solid ${rc}44` }}
                >
                  {selectedSet.set_rarity} · {selectedSet.set_code}
                </span>
              );
            })()}
          </div>

          <div className="flex flex-wrap gap-6">
            {displayTCG > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs" style={{ color: "#7A8BA8" }}>TCGPlayer</p>
                </div>
                <p className="text-xl font-bold" style={{ color: "#3ecf6a" }}>
                  ${displayTCG.toFixed(2)}
                </p>
              </div>
            )}

            {!tcgIsPerPrinting && aggEbay > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>eBay</p>
                <p className="text-xl font-bold" style={{ color: "#F0F2FF" }}>
                  ${aggEbay.toFixed(2)}
                </p>
              </div>
            )}

            {!tcgIsPerPrinting && aggCardmarket > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>Cardmarket</p>
                <p className="text-xl font-bold" style={{ color: "#F0F2FF" }}>
                  ${aggCardmarket.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printings */}
      {sets.length > 0 && (
        <div>
          {/* Header + sort controls */}
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p
              className="text-xs md:text-sm font-semibold uppercase tracking-wide"
              style={{ color: "#7A8BA8" }}
            >
              Printings ({sets.length})
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortDir("asc")}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: sortDir === "asc" ? "#FF7A0022" : "#0E1220",
                  color: sortDir === "asc" ? "#FF7A00" : "#7A8BA8",
                  border: `1px solid ${sortDir === "asc" ? "#FF7A0044" : "#1A2035"}`,
                }}
              >
                ↑ Low
              </button>
              <button
                onClick={() => setSortDir("desc")}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: sortDir === "desc" ? "#FF7A0022" : "#0E1220",
                  color: sortDir === "desc" ? "#FF7A00" : "#7A8BA8",
                  border: `1px solid ${sortDir === "desc" ? "#FF7A0044" : "#1A2035"}`,
                }}
              >
                ↓ High
              </button>
              {selected !== null && (
                <button
                  onClick={() => setSelected(null)}
                  className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    background: "#0E1220",
                    color: "#7A8BA8",
                    border: "1px solid #1A2035",
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-1 md:gap-2 max-h-40 md:max-h-80 overflow-y-auto">
            {sorted.map((s, i) => {
              const rowPrice = parseFloat(s.set_price);
              const isSelected = selected === i;
              const rc = getRarityColor(s.set_rarity, "yugioh");
              const isFav = favoritedCodes.has(s.set_code);
              const isToggling = togglingCode === s.set_code;

              return (
                <button
                  key={i}
                  onClick={() => setSelected(isSelected ? null : i)}
                  className="flex items-center justify-between text-xs md:text-sm px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg w-full text-left transition-colors"
                  style={{
                    background: isSelected ? `${rc}15` : "#0E1220",
                    border: `1px solid ${isSelected ? `${rc}60` : "#1A2035"}`,
                  }}
                >
                  {/* Set name */}
                  <span style={{ color: "#F0F2FF" }} className="truncate flex-1">
                    {s.set_name}
                  </span>

                  {/* Right side: rarity · price · favorite button */}
                  <div className="flex gap-3 md:gap-4 shrink-0 ml-2 items-center">
                    <span style={{ color: isSelected ? rc : "#7A8BA8" }}>
                      {s.set_rarity}
                    </span>
                    {rowPrice > 0 && (
                      <span
                        className="font-semibold"
                        style={{ color: isSelected ? rc : "#3ecf6a" }}
                      >
                        ${rowPrice.toFixed(2)}
                      </span>
                    )}

                    {/* Printing-specific favorite button — only shown when signed in */}
                    {showFavoriteButtons && (
                      <span
                        onClick={(e) => handlePrintingFavorite(e, s)}
                        title={isFav ? "Remove from favorites" : "Favorite this printing"}
                        className="transition-transform hover:scale-110"
                        style={{
                          color: isFav ? "#CC1F1F" : "#3A4A60",
                          opacity: isToggling ? 0.4 : 1,
                          cursor: "pointer",
                          fontSize: "1rem",
                          lineHeight: 1,
                        }}
                      >
                        {isFav ? "♥" : "♡"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <p className="mt-2 text-xs" style={{ color: "#7A8BA8" }}>
              Click a printing to update TCGPlayer price above. eBay &amp; Cardmarket show card-wide averages.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
