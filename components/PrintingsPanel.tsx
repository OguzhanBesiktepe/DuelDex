"use client";

// PrintingsPanel — shown on the YGO card detail page.
// Lists every printing (set name, rarity, set-specific price).
// Each row has:
//   ♥ — favorite this specific printing
//   + — add this specific printing to a user list
// The list dropdown uses position:fixed so it is never clipped by the scroll container.

import { useState, useMemo, useEffect, useRef } from "react";
import { getRarityColor } from "@/lib/rarityColors";
import { useAuth } from "@/lib/auth-context";
import {
  addFavorite,
  removeFavorite,
  getFavoritedSetCodesForCard,
  getLists,
  createList,
  addToList,
  isCardInList,
  type ListMeta,
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

  // ── Sort / select state ────────────────────────────────────────────────────
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<number | null>(null);

  // ── Favorite state ─────────────────────────────────────────────────────────
  const [favoritedCodes, setFavoritedCodes] = useState<Set<string>>(new Set());
  const [togglingFavCode, setTogglingFavCode] = useState<string | null>(null);

  // ── List dropdown state ────────────────────────────────────────────────────
  // openForCode = the set_code of the row whose "+" menu is currently open
  const [openForCode, setOpenForCode] = useState<string | null>(null);
  const [openForSet, setOpenForSet] = useState<CardSet | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });

  const [lists, setLists] = useState<ListMeta[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [membership, setMembership] = useState<Record<string, boolean>>({}); // listId → bool
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  const showActions = Boolean(user && cardId && cardImage);

  // Load which printings are already favorited
  useEffect(() => {
    if (!user || !cardId) return;
    getFavoritedSetCodesForCard(user.uid, cardId).then((codes) => {
      setFavoritedCodes(new Set(codes));
    });
  }, [user, cardId]);

  // Close list dropdown on outside click
  useEffect(() => {
    if (!openForCode) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeListMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openForCode]);

  // ── Favorite handlers ──────────────────────────────────────────────────────
  const handlePrintingFavorite = async (e: React.MouseEvent, s: CardSet) => {
    e.stopPropagation();
    if (!user || !cardId || !cardImage) return;
    const code = s.set_code;
    setTogglingFavCode(code);
    if (favoritedCodes.has(code)) {
      await removeFavorite(user.uid, cardId, code);
      setFavoritedCodes((prev) => { const n = new Set(prev); n.delete(code); return n; });
    } else {
      await addFavorite(user.uid, {
        cardId, cardName, cardImage, game: "yugioh",
        priceWhenAdded: parseFloat(s.set_price) || 0,
        setName: s.set_name, setCode: s.set_code, setRarity: s.set_rarity,
      });
      setFavoritedCodes((prev) => new Set([...prev, code]));
    }
    setTogglingFavCode(null);
  };

  // ── List dropdown handlers ─────────────────────────────────────────────────
  const closeListMenu = () => {
    setOpenForCode(null);
    setOpenForSet(null);
    setCreatingList(false);
    setNewListName("");
    setMembership({});
  };

  const handleOpenListMenu = async (e: React.MouseEvent, s: CardSet) => {
    e.stopPropagation();
    if (!user || !cardId || !cardImage) return;

    // If already open for this row, close it
    if (openForCode === s.set_code) { closeListMenu(); return; }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Anchor to the right edge of the button, drop down below it
    // If too close to the bottom, flip above
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > 220 ? rect.bottom + 4 : rect.top - 224;
    setDropPos({ top, right: window.innerWidth - rect.right });
    setOpenForCode(s.set_code);
    setOpenForSet(s);
    setCreatingList(false);
    setNewListName("");
    setMembership({});

    // Load lists + check membership for this printing
    setListsLoading(true);
    const userLists = await getLists(user.uid);
    setLists(userLists);
    const checks = await Promise.all(
      userLists.map((l) => isCardInList(user.uid, l.id, cardId, s.set_code))
    );
    const m: Record<string, boolean> = {};
    userLists.forEach((l, i) => { m[l.id] = checks[i]; });
    setMembership(m);
    setListsLoading(false);
  };

  const handleAddToList = async (listId: string) => {
    if (!user || !cardId || !cardImage || !openForSet) return;
    if (membership[listId]) return;
    setAddingToListId(listId);
    await addToList(user.uid, listId, {
      cardId, cardName, cardImage, game: "yugioh",
      priceWhenAdded: parseFloat(openForSet.set_price) || 0,
      setName: openForSet.set_name,
      setCode: openForSet.set_code,
      setRarity: openForSet.set_rarity,
    });
    setMembership((prev) => ({ ...prev, [listId]: true }));
    setAddingToListId(null);
  };

  const handleCreateAndAdd = async () => {
    const name = newListName.trim();
    if (!name || !user || !cardId || !cardImage || !openForSet) return;
    const listId = await createList(user.uid, name);
    await addToList(user.uid, listId, {
      cardId, cardName, cardImage, game: "yugioh",
      priceWhenAdded: parseFloat(openForSet.set_price) || 0,
      setName: openForSet.set_name,
      setCode: openForSet.set_code,
      setRarity: openForSet.set_rarity,
    });
    setLists((prev) => [{ id: listId, name, createdAt: new Date() }, ...prev]);
    setMembership((prev) => ({ ...prev, [listId]: true }));
    setCreatingList(false);
    setNewListName("");
  };

  // ── Sort ───────────────────────────────────────────────────────────────────
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

  return (
    <div className="flex flex-col gap-6">

      {/* Market Prices */}
      {hasPrices && (
        <div className="rounded-xl p-4" style={{ background: "#0E1220", border: "1px solid #1A2035" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7A8BA8" }}>
              Market Prices
            </p>
            {selectedSet && (() => {
              const rc = getRarityColor(selectedSet.set_rarity, "yugioh");
              return (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${rc}22`, color: rc, border: `1px solid ${rc}44` }}>
                  {selectedSet.set_rarity} · {selectedSet.set_code}
                </span>
              );
            })()}
          </div>
          <div className="flex flex-wrap gap-6">
            {displayTCG > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>TCGPlayer</p>
                <p className="text-xl font-bold" style={{ color: "#3ecf6a" }}>${displayTCG.toFixed(2)}</p>
              </div>
            )}
            {!tcgIsPerPrinting && aggEbay > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>eBay</p>
                <p className="text-xl font-bold" style={{ color: "#F0F2FF" }}>${aggEbay.toFixed(2)}</p>
              </div>
            )}
            {!tcgIsPerPrinting && aggCardmarket > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#7A8BA8" }}>Cardmarket</p>
                <p className="text-xl font-bold" style={{ color: "#F0F2FF" }}>${aggCardmarket.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printings */}
      {sets.length > 0 && (
        <div>
          {/* Header + sort */}
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wide" style={{ color: "#7A8BA8" }}>
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
              >↑ Low</button>
              <button
                onClick={() => setSortDir("desc")}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: sortDir === "desc" ? "#FF7A0022" : "#0E1220",
                  color: sortDir === "desc" ? "#FF7A00" : "#7A8BA8",
                  border: `1px solid ${sortDir === "desc" ? "#FF7A0044" : "#1A2035"}`,
                }}
              >↓ High</button>
              {selected !== null && (
                <button
                  onClick={() => setSelected(null)}
                  className="px-2.5 py-1 rounded text-xs font-medium"
                  style={{ background: "#0E1220", color: "#7A8BA8", border: "1px solid #1A2035" }}
                >✕ Clear</button>
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
              const isListOpen = openForCode === s.set_code;

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

                  {/* Right side: rarity · price · ♥ · + */}
                  <div className="flex gap-2 md:gap-3 shrink-0 ml-2 items-center">
                    <span style={{ color: isSelected ? rc : "#7A8BA8" }}>{s.set_rarity}</span>
                    {rowPrice > 0 && (
                      <span className="font-semibold" style={{ color: isSelected ? rc : "#3ecf6a" }}>
                        ${rowPrice.toFixed(2)}
                      </span>
                    )}

                    {/* Favorite button */}
                    {showActions && (
                      <span
                        onClick={(e) => handlePrintingFavorite(e, s)}
                        title={isFav ? "Remove from favorites" : "Favorite this printing"}
                        className="transition-transform hover:scale-110"
                        style={{
                          color: isFav ? "#CC1F1F" : "#3A4A60",
                          opacity: togglingFavCode === s.set_code ? 0.4 : 1,
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          lineHeight: 1,
                        }}
                      >
                        {isFav ? "♥" : "♡"}
                      </span>
                    )}

                    {/* Add to List button */}
                    {showActions && (
                      <span
                        onClick={(e) => handleOpenListMenu(e, s)}
                        title="Add to list"
                        className="transition-transform hover:scale-110 font-bold"
                        style={{
                          color: isListOpen ? "#FF7A00" : "#3A4A60",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          lineHeight: 1,
                        }}
                      >
                        +
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

      {/* ── List dropdown — fixed position so it isn't clipped by overflow ── */}
      {openForCode && openForSet && (
        <>
          {/* Invisible backdrop to catch outside clicks */}
          <div className="fixed inset-0 z-40" onClick={closeListMenu} />

          <div
            ref={dropdownRef}
            className="fixed z-50 rounded-xl overflow-hidden"
            style={{
              top: dropPos.top,
              right: dropPos.right,
              width: 240,
              background: "#0E1220",
              border: "1px solid #1A2035",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {/* Dropdown header */}
            <div className="px-3 py-2.5" style={{ borderBottom: "1px solid #1A2035" }}>
              <p className="text-xs font-semibold truncate" style={{ color: "#F0F2FF" }}>
                {openForSet.set_name}
              </p>
              <p className="text-xs" style={{ color: "#7A8BA8" }}>
                {openForSet.set_rarity}
                {parseFloat(openForSet.set_price) > 0 && ` · $${parseFloat(openForSet.set_price).toFixed(2)}`}
              </p>
            </div>

            {/* List items */}
            {listsLoading ? (
              <p className="px-3 py-3 text-xs animate-pulse" style={{ color: "#7A8BA8" }}>
                Loading lists…
              </p>
            ) : lists.length === 0 && !creatingList ? (
              <p className="px-3 py-3 text-xs" style={{ color: "#7A8BA8" }}>
                No lists yet. Create one below.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto">
                {lists.map((list) => {
                  const alreadyIn = membership[list.id];
                  const isAdding = addingToListId === list.id;
                  return (
                    <button
                      key={list.id}
                      onClick={() => handleAddToList(list.id)}
                      disabled={alreadyIn || isAdding}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-xs text-left transition hover:bg-white/5 disabled:opacity-60"
                      style={{ color: "#F0F2FF" }}
                    >
                      <span className="truncate">{list.name}</span>
                      {alreadyIn && <span style={{ color: "#3ecf6a" }}>✓ Added</span>}
                      {isAdding && <span className="animate-pulse" style={{ color: "#7A8BA8" }}>Adding…</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create new list */}
            <div style={{ borderTop: "1px solid #1A2035" }}>
              {creatingList ? (
                <div className="flex flex-col gap-2 p-2">
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateAndAdd();
                      if (e.key === "Escape") { setCreatingList(false); setNewListName(""); }
                    }}
                    placeholder="List name…"
                    className="w-full rounded-md px-2 py-1.5 text-xs outline-none"
                    style={{ background: "#080B14", border: "1px solid #1A2035", color: "#F0F2FF" }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCreateAndAdd}
                      disabled={!newListName.trim()}
                      className="flex-1 rounded py-1.5 text-xs font-bold transition hover:opacity-90 disabled:opacity-40"
                      style={{ background: "#FF7A00", color: "#080B14" }}
                    >
                      Create &amp; Add
                    </button>
                    <button
                      onClick={() => { setCreatingList(false); setNewListName(""); }}
                      className="rounded px-2 py-1.5 text-xs transition hover:bg-white/5"
                      style={{ color: "#7A8BA8", border: "1px solid #1A2035" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingList(true)}
                  className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs transition hover:bg-white/5"
                  style={{ color: "#00AAFF" }}
                >
                  + Create new list
                </button>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
