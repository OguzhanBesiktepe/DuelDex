"use client";

// CardActions — shown on every card detail page when the user is signed in.
// Renders two buttons side by side:
//   ♥ Favorite  — toggles the card in the user's favorites
//   + Add to List — dropdown to pick an existing list or create a new one

import { useState, useEffect, useRef } from "react";
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

  // Don't render anything for signed-out users
  if (!user) return null;

  // ── Favorite toggle ──────────────────────────────────────────────────────────
  const handleFavoriteToggle = async () => {
    // Optimistic update — flip the UI immediately so it feels instant
    const wasAlreadyFavorited = favorited;
    setFavorited(!favorited);

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
      // If Firestore fails, revert the optimistic update
      setFavorited(wasAlreadyFavorited);
    }
  };

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

  return (
    <div className="flex gap-2 w-full">
      {/* ── Favorite button ── */}
      <button
        onClick={handleFavoriteToggle}
        disabled={favLoading}
        title={favorited ? "Remove from favorites" : "Add to favorites"}
        className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
        style={{
          background: favorited ? "rgba(204,31,31,0.15)" : "#0E1220",
          border: `1px solid ${favorited ? "#CC1F1F" : "#1A2035"}`,
          color: favorited ? "#CC1F1F" : "#7A8BA8",
        }}
      >
        {/* Filled heart when favorited, outline when not */}
        <span className="text-base">{favorited ? "♥" : "♡"}</span>
        {favorited ? "Favorited" : "Favorite"}
      </button>

      {/* ── Add to List dropdown ── */}
      <div ref={dropdownRef} className="relative flex-1">
        <button
          onClick={handleOpenListDropdown}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            background: "#0E1220",
            border: "1px solid #1A2035",
            color: "#7A8BA8",
          }}
        >
          <span>+</span> Add to List
        </button>

        {listDropdownOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden"
            style={{ background: "#0E1220", borderColor: "#1A2035" }}
          >
            {/* Loading state */}
            {listsLoading && (
              <p
                className="px-4 py-3 text-sm"
                style={{ color: "#7A8BA8" }}
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
                      style={{ color: "#F0F2FF" }}
                    >
                      <span className="truncate">{list.name}</span>
                      {/* Show checkmark if card is already in this list */}
                      {alreadyIn && (
                        <span style={{ color: "#3ecf6a" }}>✓ Added</span>
                      )}
                      {isAdding && (
                        <span
                          className="text-xs animate-pulse"
                          style={{ color: "#7A8BA8" }}
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
                style={{ color: "#7A8BA8" }}
              >
                No lists yet. Create one below.
              </p>
            )}

            <div
              className="border-t"
              style={{ borderColor: "#1A2035" }}
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
                      background: "#080B14",
                      border: "1px solid #1A2035",
                      color: "#F0F2FF",
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim()}
                      className="flex-1 rounded-md py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                      style={{ background: "#FF7A00", color: "#080B14" }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setCreatingList(false); setNewListName(""); }}
                      className="rounded-md px-3 py-2 text-sm transition hover:bg-white/5"
                      style={{ color: "#7A8BA8", border: "1px solid #1A2035" }}
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
                  style={{ color: "#00AAFF" }}
                >
                  <span>+</span> Create new list
                </button>
              )}

              {/* Quick link to view all lists */}
              <Link
                href="/lists"
                onClick={() => setListDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs transition hover:bg-white/5"
                style={{ color: "#7A8BA8", borderTop: "1px solid #1A2035" }}
              >
                View all my lists →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
