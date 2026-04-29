// Server-only — do not import in client components.
// Sends Web Push notifications via VAPID.

import webpush from "web-push";

// VAPID details initialized lazily at first call so Next.js build succeeds
// even when env vars are absent from the build environment.
let vapidInitialized = false;
function ensureVapid() {
  if (vapidInitialized) return;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL ?? "admin@dueldex.app"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidInitialized = true;
}

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  icon: string;
  url: string;
}

/** Send a push notification. Returns "sent", "expired" (subscription gone), or "error". */
export async function sendPushNotification(
  subscription: StoredSubscription,
  payload: PushPayload
): Promise<"sent" | "expired" | "error"> {
  ensureVapid();
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return "sent";
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    // 404/410 = subscription expired or unsubscribed — safe to remove from Firestore
    if (status === 410 || status === 404) return "expired";
    return "error";
  }
}
