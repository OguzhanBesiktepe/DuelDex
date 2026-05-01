// Server-side per-user daily chat message counter backed by Firestore.
// Uses a transaction so rapid concurrent requests from the same user can't bypass the limit.
// Never import this in client components.

import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const AUTH_DAILY_LIMIT = 20;

interface UsageDoc {
  count: number;
  updatedAt: FirebaseFirestore.Timestamp;
}

export async function checkAndIncrementUsage(
  uid: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const db = getAdminDb();
  const date = new Date().toISOString().slice(0, 10);
  const ref = db
    .collection("users")
    .doc(uid)
    .collection("chatUsage")
    .doc(date);

  return db.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    const current = snap.exists ? (snap.data() as UsageDoc).count : 0;
    if (current >= AUTH_DAILY_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    txn.set(
      ref,
      { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { allowed: true, remaining: AUTH_DAILY_LIMIT - current - 1 };
  });
}
