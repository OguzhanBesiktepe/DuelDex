// Firestore helper functions for favorites and lists.
// All data lives under users/{uid}/... so each user's data is isolated.

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Shared Types ───────────────────────────────────────────────────────────────

export type Game = "yugioh" | "pokemon";

export interface FavoriteCard {
  cardId: string;
  cardName: string;
  cardImage: string;
  game: Game;
  priceWhenAdded: number; // 0 if no price available (e.g. Pokémon via TCGdex)
  dateAdded: Date;
  // Printing-specific fields — only present when a specific set printing was favorited
  setName?: string;
  setCode?: string;   // e.g. "LDD-EN001" — also determines the Firestore doc ID
  setRarity?: string; // e.g. "Secret Rare"
}

export interface ListMeta {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ListItem {
  cardId: string;
  cardName: string;
  cardImage: string;
  game: Game;
  priceWhenAdded: number; // snapshot of price at time of adding
  dateAdded: Date;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

/** Derives the Firestore document ID for a favorite.
 *  Generic favorite → cardId
 *  Printing-specific → "cardId__setCode" */
function favoriteDocId(cardId: string, setCode?: string): string {
  return setCode ? `${cardId}__${setCode}` : cardId;
}

// ── Favorites ─────────────────────────────────────────────────────────────────

/** Save a card (or a specific printing) to the user's favorites.
 *  Using a composite doc ID prevents duplicates for the same card+printing combo. */
export async function addFavorite(
  userId: string,
  card: Omit<FavoriteCard, "dateAdded">
) {
  const docId = favoriteDocId(card.cardId, card.setCode);
  const ref = doc(db, "users", userId, "favorites", docId);
  await setDoc(ref, { ...card, dateAdded: serverTimestamp() });
}

/** Remove a favorite. Pass setCode to remove a printing-specific entry. */
export async function removeFavorite(
  userId: string,
  cardId: string,
  setCode?: string
) {
  await deleteDoc(
    doc(db, "users", userId, "favorites", favoriteDocId(cardId, setCode))
  );
}

/** Returns true if the given card (or specific printing) is in the user's favorites. */
export async function isFavorited(
  userId: string,
  cardId: string,
  setCode?: string
): Promise<boolean> {
  const snap = await getDoc(
    doc(db, "users", userId, "favorites", favoriteDocId(cardId, setCode))
  );
  return snap.exists();
}

/** Fetch all favorited cards for a user, newest first. */
export async function getFavorites(userId: string): Promise<FavoriteCard[]> {
  const ref = collection(db, "users", userId, "favorites");
  const snap = await getDocs(query(ref, orderBy("dateAdded", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      cardId: data.cardId,
      cardName: data.cardName,
      cardImage: data.cardImage,
      game: data.game,
      priceWhenAdded: data.priceWhenAdded ?? 0,
      dateAdded: (data.dateAdded as Timestamp)?.toDate() ?? new Date(),
      setName: data.setName,
      setCode: data.setCode,
      setRarity: data.setRarity,
    };
  });
}

/** Returns the set codes of all printing-specific favorites for a given card.
 *  Used by PrintingsPanel to know which printing rows to show as favorited. */
export async function getFavoritedSetCodesForCard(
  userId: string,
  cardId: string
): Promise<string[]> {
  const ref = collection(db, "users", userId, "favorites");
  const snap = await getDocs(query(ref, where("cardId", "==", cardId)));
  return snap.docs
    .map((d) => d.data().setCode as string | undefined)
    .filter((code): code is string => Boolean(code));
}

// ── Lists ─────────────────────────────────────────────────────────────────────

/** Create a new named list. Returns the new list's Firestore document ID. */
export async function createList(
  userId: string,
  name: string
): Promise<string> {
  const ref = collection(db, "users", userId, "lists");
  const newDoc = await addDoc(ref, { name, createdAt: serverTimestamp() });
  return newDoc.id;
}

/** Fetch all lists for a user, newest first. */
export async function getLists(userId: string): Promise<ListMeta[]> {
  const ref = collection(db, "users", userId, "lists");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  }));
}

/** Fetch a single list's metadata (name, createdAt). */
export async function getList(
  userId: string,
  listId: string
): Promise<ListMeta | null> {
  const snap = await getDoc(doc(db, "users", userId, "lists", listId));
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    name: snap.data().name,
    createdAt: (snap.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  };
}

/** Rename an existing list. */
export async function renameList(
  userId: string,
  listId: string,
  newName: string
) {
  await updateDoc(doc(db, "users", userId, "lists", listId), { name: newName });
}

/** Delete a list and all its items. */
export async function deleteList(userId: string, listId: string) {
  // Firestore does not auto-delete subcollections — we must do it manually
  const itemsRef = collection(db, "users", userId, "lists", listId, "items");
  const itemsSnap = await getDocs(itemsRef);
  await Promise.all(itemsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "users", userId, "lists", listId));
}

/** Add a card to a list. Uses cardId as the document ID to prevent duplicates. */
export async function addToList(
  userId: string,
  listId: string,
  card: Omit<ListItem, "dateAdded">
) {
  const ref = doc(db, "users", userId, "lists", listId, "items", card.cardId);
  await setDoc(ref, { ...card, dateAdded: serverTimestamp() });
}

/** Remove a card from a list by card ID. */
export async function removeFromList(
  userId: string,
  listId: string,
  cardId: string
) {
  await deleteDoc(
    doc(db, "users", userId, "lists", listId, "items", cardId)
  );
}

/** Fetch all items in a list, newest first. */
export async function getListItems(
  userId: string,
  listId: string
): Promise<ListItem[]> {
  const ref = collection(db, "users", userId, "lists", listId, "items");
  const snap = await getDocs(query(ref, orderBy("dateAdded", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      cardId: data.cardId,
      cardName: data.cardName,
      cardImage: data.cardImage,
      game: data.game,
      priceWhenAdded: data.priceWhenAdded ?? 0,
      dateAdded: (data.dateAdded as Timestamp)?.toDate() ?? new Date(),
    };
  });
}

/** Check if a specific card is already in a given list. */
export async function isCardInList(
  userId: string,
  listId: string,
  cardId: string
): Promise<boolean> {
  const snap = await getDoc(
    doc(db, "users", userId, "lists", listId, "items", cardId)
  );
  return snap.exists();
}
