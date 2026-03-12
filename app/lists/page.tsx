"use client";

// Lists overview page — shows all of the user's custom lists.
// Each list card shows: name, item count, total value (sum of priceWhenAdded), delete button.
// Clicking a list navigates to /lists/[listId] for the full item view.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getLists,
  getListItems,
  createList,
  deleteList,
  type ListMeta,
} from "@/lib/firestore";

interface ListWithStats extends ListMeta {
  itemCount: number;
  totalValue: number; // sum of priceWhenAdded for all items
}

export default function ListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [lists, setLists] = useState<ListWithStats[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New list creation state
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin");
  }, [user, authLoading, router]);

  // Load all lists and their item stats
  useEffect(() => {
    if (!user) return;

    async function loadLists() {
      const userLists = await getLists(user!.uid);

      // Fetch all lists then enrich each with item count and total value in parallel
      const withStats = await Promise.all(
        userLists.map(async (list) => {
          const items = await getListItems(user!.uid, list.id);
          const totalValue = items.reduce(
            (sum, item) => sum + (item.priceWhenAdded ?? 0),
            0
          );
          return { ...list, itemCount: items.length, totalValue };
        })
      );

      setLists(withStats);
      setPageLoading(false);
    }

    loadLists();
  }, [user]);

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name || !user) return;

    const listId = await createList(user.uid, name);
    const newList: ListWithStats = {
      id: listId,
      name,
      createdAt: new Date(),
      itemCount: 0,
      totalValue: 0,
    };
    // Prepend to list so newest appears first
    setLists((prev) => [newList, ...prev]);
    setNewListName("");
    setCreating(false);
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete this list and all its cards? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(listId);
    await deleteList(user.uid, listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setDeleting(null);
  };

  if (authLoading || pageLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#080B14" }}
      >
        <p className="animate-pulse text-sm" style={{ color: "#7A8BA8" }}>
          Loading lists…
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              My Lists
            </h1>
            <p className="text-sm" style={{ color: "#7A8BA8" }}>
              {lists.length === 0
                ? "No lists yet."
                : `${lists.length} list${lists.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {/* Create new list button */}
          <button
            onClick={() => setCreating(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
            style={{ background: "#FF7A00", color: "#080B14" }}
          >
            + New List
          </button>
        </div>

        {/* Inline new list form */}
        {creating && (
          <div
            className="rounded-xl border p-4 mb-6 flex gap-3 items-center"
            style={{ background: "#0E1220", borderColor: "#1A2035" }}
          >
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateList();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewListName("");
                }
              }}
              placeholder="List name (e.g. Pokémon Deck, Grail Cards…)"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "#080B14",
                border: "1px solid #1A2035",
                color: "#F0F2FF",
              }}
            />
            <button
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: "#FF7A00", color: "#080B14" }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewListName("");
              }}
              className="rounded-lg px-3 py-2 text-sm transition hover:bg-white/5"
              style={{ color: "#7A8BA8" }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Empty state */}
        {lists.length === 0 && !creating && (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#1A2035", background: "#0E1220" }}
          >
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm mb-4" style={{ color: "#7A8BA8" }}>
              Create a list to track decks, wishlists, or anything else.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="rounded-lg px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
              style={{ background: "#FF7A00", color: "#080B14" }}
            >
              + Create your first list
            </button>
          </div>
        )}

        {/* Lists grid */}
        {lists.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className="rounded-2xl border p-5 flex flex-col gap-3 transition hover:border-white/10"
                style={{ background: "#0E1220", borderColor: "#1A2035" }}
              >
                {/* List name */}
                <Link href={`/lists/${list.id}`}>
                  <h2
                    className="text-lg font-bold truncate hover:underline"
                    style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
                  >
                    {list.name}
                  </h2>
                </Link>

                {/* Stats row */}
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>Cards</p>
                    <p className="text-lg font-bold" style={{ color: "#F0F2FF" }}>
                      {list.itemCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>
                      Total Value (at time added)
                    </p>
                    <p className="text-lg font-bold" style={{ color: "#3ecf6a" }}>
                      {list.totalValue > 0
                        ? `$${list.totalValue.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <p className="text-xs" style={{ color: "#7A8BA8" }}>
                  Created {list.createdAt.toLocaleDateString()}
                </p>

                {/* Actions row */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/lists/${list.id}`}
                    className="flex-1 text-center rounded-lg py-2 text-sm font-semibold transition hover:opacity-90"
                    style={{ background: "#1A2035", color: "#F0F2FF" }}
                  >
                    View List →
                  </Link>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    disabled={deleting === list.id}
                    className="rounded-lg px-3 py-2 text-sm transition hover:bg-red-900/20 disabled:opacity-40"
                    style={{ color: "#CC1F1F", border: "1px solid rgba(204,31,31,0.3)" }}
                  >
                    {deleting === list.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
