"use client";

// CardActions — shown on every card detail page when the user is signed in.
// Renders two buttons side by side:
//   ♥ Favorite  — toggles the card in the user's favorites
//   + Add to List — dropdown to pick an existing list or create a new one

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addFavorite,
  removeFavorite,
  isFavorited,
  getLists,
  createList,
  addToList,
  isCardInList,
  type Game,
  type ListMeta,
} from "@/lib/firestore";
import Link from "next/link";
import AlertButton from "@/components/AlertButton";

interface CardActionsProps {
  cardId: string;
  cardName: string;
  cardImage: string;
  game: Game;
  price: number; // 0 if unavailable (e.g. Pokémon via TCGdex)
}

export default function CardActions({
  cardId,
  cardName,
  cardImage,
  game,
  price,
}: CardActionsProps) {
  const { user } = useAuth();

  // ── Favorite state ───────────────────────────────────────────────────────────
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(true); // checking initial state
  const [animating, setAnimating] = useState(false);

  // ── List dropdown state ──────────────────────────────────────────────────────
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [lists, setLists] = useState<ListMeta[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [cardInLists, setCardInLists] = useState<Record<string, boolean>>({});
  const [creatingList, setCreatingList] = useState(false); // show new-list input
  const [newListName, setNewListName] = useState("");
  const [addingToList, setAddingToList] = useState<string | null>(null); // listId being added to

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if this card is already favorited on mount.
  // The catch ensures favLoading is cleared even if Firestore isn't set up yet.
  useEffect(() => {
    if (!user) return;
    isFavorited(user.uid, cardId)
      .then((result) => {
        setFavorited(result);
      })
      .catch(() => {
        // Firestore unavailable — default to not favorited, still allow clicking
      })
      .finally(() => {
        setFavLoading(false);
      });
  }, [user, cardId]);

  // Close list dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setListDropdownOpen(false);
        setCreatingList(false);
        setNewListName("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Favorite toggle ──────────────────────────────────────────────────────────
  // Must be defined before the early return to satisfy Rules of Hooks
  const handleFavoriteToggle = useCallback(async () => {
    if (!user) return;
    const wasAlreadyFavorited = favorited;
    setFavorited(!favorited);

    // Sparkle burst only fires when adding a favorite, not removing
    if (!wasAlreadyFavorited) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 700);
    }

    try {
      if (wasAlreadyFavorited) {
        await removeFavorite(user.uid, cardId);
      } else {
        await addFavorite(user.uid, {
          cardId,
          cardName,
          cardImage,
          game,
          priceWhenAdded: price,
        });
      }
    } catch {
      setFavorited(wasAlreadyFavorited);
    }
  }, [favorited, user, cardId, cardName, cardImage, game, price]);

  // Don't render anything for signed-out users
  if (!user) return null;

  // ── List dropdown ────────────────────────────────────────────────────────────
  const handleOpenListDropdown = async () => {
    if (listDropdownOpen) {
      setListDropdownOpen(false);
      return;
    }

    setListDropdownOpen(true);
    setListsLoading(true);

    // Load user's lists and check which ones already contain this card
    const userLists = await getLists(user.uid);
    setLists(userLists);

    // Check membership for each list in parallel
    const checks = await Promise.all(
      userLists.map((l) => isCardInList(user.uid, l.id, cardId))
    );
    const membership: Record<string, boolean> = {};
    userLists.forEach((l, i) => {
      membership[l.id] = checks[i];
    });
    setCardInLists(membership);
    setListsLoading(false);
  };

  const handleAddToList = async (listId: string) => {
    if (cardInLists[listId]) return; // already in this list
    setAddingToList(listId);

    await addToList(user.uid, listId, {
      cardId,
      cardName,
      cardImage,
      game,
      priceWhenAdded: price,
    });

    // Mark as added in local state without re-fetching
    setCardInLists((prev) => ({ ...prev, [listId]: true }));
    setAddingToList(null);
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) return;

    const listId = await createList(user.uid, name);

    // Add the card to the newly created list immediately
    await addToList(user.uid, listId, {
      cardId,
      cardName,
      cardImage,
      game,
      priceWhenAdded: price,
    });

    // Add the new list to local state
    setLists((prev) => [{ id: listId, name, createdAt: new Date() }, ...prev]);
    setCardInLists((prev) => ({ ...prev, [listId]: true }));
    setCreatingList(false);
    setNewListName("");
  };

  // 8 sparkle dots evenly spaced around a circle (angles in degrees)
  const SPARKLES = [
    { angle: 0,   color: "var(--primary-red)" },
    { angle: 45,  color: "var(--ygo-accent)" },
    { angle: 90,  color: "var(--gold)" },
    { angle: 135, color: "var(--ygo-accent)" },
    { angle: 180, color: "var(--primary-red)" },
    { angle: 225, color: "var(--ygo-accent)" },
    { angle: 270, color: "var(--gold)" },
    { angle: 315, color: "var(--ygo-accent)" },
  ];

  return (
    <>
      {/* Keyframe definitions — scoped via unique class names */}

      <style>{`
        @keyframes fav-heart-pop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.45); }
          65%  { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        @keyframes fav-sparkle {
          0%   { transform: translate(var(--sx), var(--sy)) scale(1); opacity: 1; }
          80%  { opacity: 0.6; }
          100% { transform: translate(calc(var(--sx) * 3.2), calc(var(--sy) * 3.2)) scale(0); opacity: 0; }
        }
        .fav-heart-animating {
          animation: fav-heart-pop 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }
        .fav-sparkle-dot {
          animation: fav-sparkle 0.6s ease-out forwards;
        }
      `}</style>

    <div className="flex flex-col gap-2 w-full">
    <div className="flex gap-2 w-full">
      {/* ── Favorite button ── */}
      <button
        onClick={handleFavoriteToggle}
        disabled={favLoading}
        title={favorited ? "Remove from favorites" : "Add to favorites"}
        className="relative flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 overflow-visible"
        style={{
          background: favorited ? "rgba(204,31,31,0.15)" : "var(--surface)",
          border: `1px solid ${favorited ? "var(--primary-red)" : "var(--border)"}`,
          color: favorited ? "var(--primary-red)" : "var(--text-muted)",
        }}
      >
        {/* Heart icon with pop animation */}
        <span
          className={`text-base select-none ${animating ? "fav-heart-animating" : ""}`}
          style={{ display: "inline-block" }}
        >
          {favorited ? "♥" : "♡"}
        </span>

        {/* Sparkle dots — rendered only during animation */}
        {animating && SPARKLES.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180;
          const sx = `${(Math.cos(rad) * 18).toFixed(1)}px`;
          const sy = `${(Math.sin(rad) * 18).toFixed(1)}px`;
          return (
            <span
              key={i}
              className="fav-sparkle-dot pointer-events-none absolute rounded-full"
              style={{
                width: 6,
                height: 6,
                background: s.color,
                top: "50%",
                left: "50%",
                marginTop: -3,
                marginLeft: -3,
                "--sx": sx,
                "--sy": sy,
              } as React.CSSProperties}
            />
          );
        })}

        {favorited ? "Favorited" : "Favorite"}
      </button>

      {/* ── Add to List dropdown ── */}
      <div ref={dropdownRef} className="relative flex-1">
        <button
          onClick={handleOpenListDropdown}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            background: "var(--surface)",
            border: "1px solid #1A2035",
            color: "var(--text-muted)",
          }}
        >
          <span>+</span> Add to List
        </button>

        {listDropdownOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Loading state */}
            {listsLoading && (
              <p
                className="px-4 py-3 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Loading lists…
              </p>
            )}

            {/* Existing lists */}
            {!listsLoading && lists.length > 0 && (
              <div className="py-1">
                {lists.map((list) => {
                  const alreadyIn = cardInLists[list.id];
                  const isAdding = addingToList === list.id;
                  return (
                    <button
                      key={list.id}
                      onClick={() => handleAddToList(list.id)}
                      disabled={alreadyIn || isAdding}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition hover:bg-white/5 disabled:opacity-60"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span className="truncate">{list.name}</span>
                      {/* Show checkmark if card is already in this list */}
                      {alreadyIn && (
                        <span style={{ color: "var(--price-color)" }}>✓ Added</span>
                      )}
                      {isAdding && (
                        <span
                          className="text-xs animate-pulse"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Adding…
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty state — no lists yet */}
            {!listsLoading && lists.length === 0 && !creatingList && (
              <p
                className="px-4 py-3 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No lists yet. Create one below.
              </p>
            )}

            <div
              className="border-t"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Inline new list creator */}
              {creatingList ? (
                <div className="flex flex-col gap-2 px-3 py-3">
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateList();
                      if (e.key === "Escape") {
                        setCreatingList(false);
                        setNewListName("");
                      }
                    }}
                    placeholder="List name…"
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid #1A2035",
                      color: "var(--text-primary)",
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim()}
                      className="flex-1 rounded-md py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                      style={{ background: "var(--ygo-accent)", color: "var(--background)" }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setCreatingList(false); setNewListName(""); }}
                      className="rounded-md px-3 py-2 text-sm transition hover:bg-white/5"
                      style={{ color: "var(--text-muted)", border: "1px solid #1A2035" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* "Create new list" button */
                <button
                  onClick={() => setCreatingList(true)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition hover:bg-white/5"
                  style={{ color: "var(--pkmn-accent)" }}
                >
                  <span>+</span> Create new list
                </button>
              )}

              {/* Quick link to view all lists */}
              <Link
                href="/lists"
                onClick={() => setListDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs transition hover:bg-white/5"
                style={{ color: "var(--text-muted)", borderTop: "1px solid #1A2035" }}
              >
                View all my lists →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Alert button — full width below the two main buttons */}
    <AlertButton
      cardId={cardId}
      cardName={cardName}
      cardImage={cardImage}
      game={game}
      currentPrice={price}
      currency={game === "yugioh" ? "USD" : "EUR"}
    />
    </div>
    </>
  );
}
