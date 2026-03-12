// Firebase Admin SDK — server-side only.
// Used by API routes and server components that need to read/write Firestore
// without going through the client SDK (which requires auth context).
// Never import this file in client components.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

// Lazy getter so initialization is deferred until first call at runtime,
// not at module evaluation time during the Next.js build.
export function getAdminDb() {
  return getFirestore(getAdminApp());
}
