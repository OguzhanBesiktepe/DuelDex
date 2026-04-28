// Firebase Admin SDK — server-side only.
// Used by API routes and server components that need to read/write Firestore
// without going through the client SDK (which requires auth context).
// Never import this file in client components.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount(raw: string) {
  // JSON.parse fails when the private_key value contains literal newline characters
  // (common when copy-pasting service account JSON into .env.local or Vercel env vars).
  // Fix: replace real newlines inside the private_key value only, then parse.
  try {
    return JSON.parse(raw);
  } catch {
    const fixed = raw.replace(
      /"private_key"\s*:\s*"([\s\S]*?)"/,
      (_, key) => `"private_key":"${key.replace(/\n/g, "\\n")}"`
    );
    return JSON.parse(fixed);
  }
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
  return initializeApp({ credential: cert(parseServiceAccount(raw)) });
}

// Lazy getter so initialization is deferred until first call at runtime,
// not at module evaluation time during the Next.js build.
export function getAdminDb() {
  return getFirestore(getAdminApp());
}
