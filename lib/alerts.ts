// Client-side CRUD for user price alerts.
// Manual alerts live at users/{uid}/alerts/{alertId}.

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { setUserAlertEmail } from "./firestore";

export type AlertDirection = "up" | "down" | "both";
export type AlertThresholdType = "percent" | "amount";

export interface PriceAlert {
  cardId: string;
  cardName: string;
  cardImage: string;
  game: "yugioh" | "pokemon";
  setCode?: string;
  setName?: string;
  thresholdType: AlertThresholdType;
  thresholdValue: number;
  direction: AlertDirection;
  baselinePrice: number;
  currency: "USD" | "EUR";
  enabled: boolean;
  createdAt: Timestamp;
  lastCheckedAt?: Timestamp;
  lastCheckedPrice?: number;
  lastAlertSentAt?: Timestamp;
}

export interface PriceAlertWithId extends PriceAlert {
  id: string;
}

/** Create a new manual alert. Caches the user's email for cron use. */
export async function createAlert(
  userId: string,
  userEmail: string,
  alert: Omit<PriceAlert, "enabled" | "createdAt">
): Promise<string> {
  await setUserAlertEmail(userId, userEmail);
  const ref = collection(db, "users", userId, "alerts");
  const newDoc = await addDoc(ref, {
    ...alert,
    enabled: true,
    createdAt: serverTimestamp(),
  });
  return newDoc.id;
}

/** Fetch all manual alerts for a user, newest first. */
export async function getAlerts(userId: string): Promise<PriceAlertWithId[]> {
  const ref = collection(db, "users", userId, "alerts");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as PriceAlert),
  }));
}

/** Fetch manual alerts for a specific card (used by AlertButton to detect existing alerts). */
export async function getAlertsForCard(
  userId: string,
  cardId: string,
  game: "yugioh" | "pokemon"
): Promise<PriceAlertWithId[]> {
  const ref = collection(db, "users", userId, "alerts");
  const q = query(ref, where("cardId", "==", cardId), where("game", "==", game));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as PriceAlert),
  }));
}

/** Update threshold settings or toggle enabled on an existing alert. */
export async function updateAlert(
  userId: string,
  alertId: string,
  patch: Partial<Pick<PriceAlert, "enabled" | "thresholdType" | "thresholdValue" | "direction">>
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "alerts", alertId), patch);
}

/** Permanently delete a manual alert. */
export async function deleteAlert(userId: string, alertId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "alerts", alertId));
}
