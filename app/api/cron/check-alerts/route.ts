// Daily price alert checker — called by Vercel Cron at 07:00 UTC.
//
// Two passes per run:
//   1. Manual card alerts  — users/{uid}/alerts/* (collectionGroup query)
//   2. Portfolio auto-alerts — all users with portfolioAlertsEnabled: true
//
// For each triggered alert: sends email + Web Push to all of the user's subscriptions.
// Resets the baseline price after firing so the next alert tracks the next ±N% move.

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendPriceAlertEmail } from "@/lib/email";
import { sendPushNotification, type StoredSubscription } from "@/lib/webpush";
import { getBestTcgPrice, getCardMarketPrice } from "@/lib/pokemon";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dueldex.app";
const MAX_UNIQUE_CARDS = 80; // hard cap to stay within the 60s limit

// ── Price fetching ─────────────────────────────────────────────────────────────

interface CardPriceResult {
  price: number;
  currency: "USD" | "EUR";
}

async function fetchYGOPrice(cardId: string, setCode?: string): Promise<number> {
  try {
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}&tcgplayer_data=true`,
      { cache: "no-store" }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const card = data.data?.[0];
    if (!card) return 0;
    if (setCode) {
      const match = (card.card_sets ?? []).find(
        (s: { set_code: string; set_price: string }) => s.set_code === setCode
      );
      return parseFloat(match?.set_price ?? "0") || 0;
    }
    return parseFloat(card.card_prices?.[0]?.tcgplayer_price ?? "0") || 0;
  } catch {
    return 0;
  }
}

async function fetchPokemonPrice(cardId: string): Promise<CardPriceResult> {
  try {
    const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardId}`, {
      cache: "no-store",
    });
    if (!res.ok) return { price: 0, currency: "USD" };
    const card = await res.json();
    const tcgPrice = getBestTcgPrice(card);
    const cmPrice = getCardMarketPrice(card);
    if (tcgPrice != null && tcgPrice > 0) return { price: tcgPrice, currency: "USD" };
    if (cmPrice != null && cmPrice > 0) return { price: cmPrice, currency: "EUR" };
    return { price: 0, currency: "USD" };
  } catch {
    return { price: 0, currency: "USD" };
  }
}

// Fetch all prices for a deduplicated set of cards.
// YGO: batches of 1 per call (simpler, more reliable for set-specific pricing).
// Pokémon: batches of 10 concurrent.
async function fetchAllPrices(
  cards: Map<string, { game: "yugioh" | "pokemon"; cardId: string; setCode?: string }>
): Promise<Map<string, CardPriceResult>> {
  const results = new Map<string, CardPriceResult>();

  const ygoKeys = [...cards.entries()].filter(([, v]) => v.game === "yugioh").map(([k]) => k);
  const pkmnKeys = [...cards.entries()].filter(([, v]) => v.game === "pokemon").map(([k]) => k);

  // YGO — sequential to respect rate limit (20 req/s)
  for (const key of ygoKeys) {
    const { cardId, setCode } = cards.get(key)!;
    const price = await fetchYGOPrice(cardId, setCode);
    results.set(key, { price, currency: "USD" });
  }

  // Pokémon — batches of 10
  for (let i = 0; i < pkmnKeys.length; i += 10) {
    const batch = pkmnKeys.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map((key) => {
        const { cardId } = cards.get(key)!;
        return fetchPokemonPrice(cardId).then((r) => [key, r] as const);
      })
    );
    for (const [key, result] of batchResults) results.set(key, result);
  }

  return results;
}

// ── Notification delivery ──────────────────────────────────────────────────────

async function deliverNotifications(
  uid: string,
  userEmail: string,
  emailPayload: Parameters<typeof sendPriceAlertEmail>[0],
  pushTitle: string,
  pushBody: string,
  cardUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: FirebaseFirestore.Firestore
): Promise<boolean> {
  // Email
  const emailOk = await sendPriceAlertEmail(emailPayload);

  // Push — send to all subscriptions, remove expired ones
  const subsSnap = await db
    .collection("users")
    .doc(uid)
    .collection("pushSubscriptions")
    .get();

  const expiredIds: string[] = [];
  await Promise.all(
    subsSnap.docs.map(async (subDoc) => {
      const sub = subDoc.data() as StoredSubscription;
      const result = await sendPushNotification(sub, {
        title: pushTitle,
        body: pushBody,
        icon: `${APP_URL}/icon-192x192.png`,
        url: cardUrl,
      });
      if (result === "expired") expiredIds.push(subDoc.id);
    })
  );

  // Clean up expired subscriptions
  for (const id of expiredIds) {
    await db.collection("users").doc(uid).collection("pushSubscriptions").doc(id).delete();
  }

  return emailOk;
}

// ── Pass 1: Manual card alerts ─────────────────────────────────────────────────

async function processManualAlerts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: FirebaseFirestore.Firestore
): Promise<{ checked: number; fired: number; errors: number }> {
  const snap = await db
    .collectionGroup("alerts")
    .where("enabled", "==", true)
    .get();

  const allAlerts = snap.docs.map((d) => ({
    id: d.id,
    uid: d.ref.parent.parent?.id ?? "",
    ref: d.ref,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(d.data() as any),
  }));

  if (allAlerts.length === 0) return { checked: 0, fired: 0, errors: 0 };

  // Deduplicate cards to fetch
  const uniqueCards = new Map<string, { game: "yugioh" | "pokemon"; cardId: string; setCode?: string }>();
  for (const a of allAlerts) {
    const key = `${a.game}:${a.cardId}:${a.setCode ?? ""}`;
    uniqueCards.set(key, { game: a.game, cardId: a.cardId, setCode: a.setCode });
    if (uniqueCards.size >= MAX_UNIQUE_CARDS) break;
  }

  const priceMap = await fetchAllPrices(uniqueCards);

  // Read user emails in one pass
  const uids = [...new Set(allAlerts.map((a) => a.uid).filter(Boolean))];
  const userDocs = await Promise.all(
    uids.map((uid) => db.collection("users").doc(uid).get())
  );
  const emailMap = new Map<string, string>();
  for (const d of userDocs) {
    if (d.exists) emailMap.set(d.id, d.data()?.alertEmail ?? "");
  }

  const now = new Date();
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;

  let fired = 0;
  let errors = 0;

  for (const alert of allAlerts) {
    if (!alert.uid || !alert.cardId) continue;
    const key = `${alert.game}:${alert.cardId}:${alert.setCode ?? ""}`;
    const priceResult = priceMap.get(key);
    if (!priceResult || priceResult.price <= 0) continue;

    const { price: currentPrice, currency } = priceResult;
    const baseline = alert.baselinePrice;
    if (!baseline || baseline <= 0) continue;

    const pctChange = ((currentPrice - baseline) / baseline) * 100;
    const absChange = Math.abs(currentPrice - baseline);

    const thresholdMet =
      alert.thresholdType === "percent"
        ? Math.abs(pctChange) >= alert.thresholdValue
        : absChange >= alert.thresholdValue;

    if (!thresholdMet) {
      await alert.ref.update({ lastCheckedAt: now, lastCheckedPrice: currentPrice });
      continue;
    }

    const directionMet =
      alert.direction === "both" ||
      (alert.direction === "up" && pctChange > 0) ||
      (alert.direction === "down" && pctChange < 0);

    if (!directionMet) {
      await alert.ref.update({ lastCheckedAt: now, lastCheckedPrice: currentPrice });
      continue;
    }

    // 24-hour cooldown
    const lastSent = alert.lastAlertSentAt?.toDate?.() ?? null;
    if (lastSent && now.getTime() - lastSent.getTime() < COOLDOWN_MS) continue;

    const userEmail = emailMap.get(alert.uid) ?? "";
    if (!userEmail) { errors++; continue; }

    const sym = currency === "EUR" ? "€" : "$";
    const arrow = pctChange >= 0 ? "▲" : "▼";
    const cardUrl = `${APP_URL}/${alert.game === "yugioh" ? "yugioh" : "pokemon"}/card/${alert.cardId}`;

    const ok = await deliverNotifications(
      alert.uid,
      userEmail,
      {
        to: userEmail,
        cardName: alert.cardName,
        cardImage: alert.cardImage,
        game: alert.game,
        cardId: alert.cardId,
        setCode: alert.setCode,
        oldPrice: baseline,
        newPrice: currentPrice,
        pctChange,
        currency,
      },
      `${alert.cardName} ${arrow}${Math.abs(pctChange).toFixed(1)}%`,
      `${sym}${baseline.toFixed(2)} → ${sym}${currentPrice.toFixed(2)}`,
      cardUrl,
      db
    );

    if (ok) {
      await alert.ref.update({
        lastCheckedAt: now,
        lastCheckedPrice: currentPrice,
        lastAlertSentAt: now,
        baselinePrice: currentPrice, // reset so next alert tracks next move
      });
      fired++;
    } else {
      errors++;
      // Don't reset baseline or sentAt — will retry next run
    }
  }

  return { checked: allAlerts.length, fired, errors };
}

// ── Pass 2: Portfolio auto-alerts ──────────────────────────────────────────────

async function processPortfolioAlerts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: FirebaseFirestore.Firestore
): Promise<{ checked: number; fired: number; errors: number }> {
  const usersSnap = await db
    .collection("users")
    .where("portfolioAlertsEnabled", "==", true)
    .get();

  if (usersSnap.empty) return { checked: 0, fired: 0, errors: 0 };

  const now = new Date();
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  let checked = 0;
  let fired = 0;
  let errors = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    const userEmail = userData.alertEmail ?? "";
    const threshold = userData.portfolioAlertThreshold ?? 10;
    if (!userEmail) continue;

    // Get all lists for this user
    const listsSnap = await db.collection("users").doc(uid).collection("lists").get();

    // Collect all unique list items
    const seenKeys = new Set<string>();
    type PortfolioCard = {
      cardDocId: string;
      cardId: string;
      cardName: string;
      cardImage: string;
      game: "yugioh" | "pokemon";
      setCode?: string;
      priceWhenAdded: number;
      currency: "USD" | "EUR";
    };
    const portfolioCards: PortfolioCard[] = [];

    for (const listDoc of listsSnap.docs) {
      const itemsSnap = await db
        .collection("users")
        .doc(uid)
        .collection("lists")
        .doc(listDoc.id)
        .collection("items")
        .get();

      for (const item of itemsSnap.docs) {
        const d = item.data();
        const key = item.id; // cardId or cardId__setCode
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        portfolioCards.push({
          cardDocId: key,
          cardId: d.cardId,
          cardName: d.cardName,
          cardImage: d.cardImage,
          game: d.game,
          setCode: d.setCode,
          priceWhenAdded: d.priceWhenAdded ?? 0,
          currency: d.game === "pokemon" ? "EUR" : "USD",
        });
        if (portfolioCards.length >= MAX_UNIQUE_CARDS) break;
      }
      if (portfolioCards.length >= MAX_UNIQUE_CARDS) break;
    }

    if (portfolioCards.length === 0) continue;
    checked += portfolioCards.length;

    // Read alert price baselines from portfolioPrices subcollection
    const uniqueCards = new Map<string, { game: "yugioh" | "pokemon"; cardId: string; setCode?: string }>();
    for (const c of portfolioCards) {
      uniqueCards.set(c.cardDocId, { game: c.game, cardId: c.cardId, setCode: c.setCode });
    }

    const priceMap = await fetchAllPrices(uniqueCards);

    // Read existing portfolio price baselines
    const portfolioPricesSnap = await db
      .collection("users")
      .doc(uid)
      .collection("portfolioPrices")
      .get();
    const portfolioPrices = new Map<string, { price: number; sentAt?: Date }>();
    for (const d of portfolioPricesSnap.docs) {
      const data = d.data();
      portfolioPrices.set(d.id, {
        price: data.price ?? 0,
        sentAt: data.sentAt?.toDate?.() ?? undefined,
      });
    }

    for (const card of portfolioCards) {
      const currentResult = priceMap.get(card.cardDocId);
      if (!currentResult || currentResult.price <= 0) continue;

      const currentPrice = currentResult.price;
      const existing = portfolioPrices.get(card.cardDocId);
      const baseline = existing?.price || card.priceWhenAdded;
      if (!baseline || baseline <= 0) continue;

      const pctChange = ((currentPrice - baseline) / baseline) * 100;
      if (Math.abs(pctChange) < threshold) {
        // No alert — just update lastCheckedPrice if baseline not yet set
        if (!existing) {
          await db
            .collection("users")
            .doc(uid)
            .collection("portfolioPrices")
            .doc(card.cardDocId)
            .set({ price: card.priceWhenAdded, updatedAt: now });
        }
        continue;
      }

      // 24-hour cooldown
      if (existing?.sentAt && now.getTime() - existing.sentAt.getTime() < COOLDOWN_MS) continue;

      const sym = card.currency === "EUR" ? "€" : "$";
      const arrow = pctChange >= 0 ? "▲" : "▼";
      const cardUrl = `${APP_URL}/${card.game === "yugioh" ? "yugioh" : "pokemon"}/card/${card.cardId}`;

      const ok = await deliverNotifications(
        uid,
        userEmail,
        {
          to: userEmail,
          cardName: card.cardName,
          cardImage: card.cardImage,
          game: card.game,
          cardId: card.cardId,
          setCode: card.setCode,
          oldPrice: baseline,
          newPrice: currentPrice,
          pctChange,
          currency: card.currency,
        },
        `${card.cardName} ${arrow}${Math.abs(pctChange).toFixed(1)}%`,
        `${sym}${baseline.toFixed(2)} → ${sym}${currentPrice.toFixed(2)}`,
        cardUrl,
        db
      );

      if (ok) {
        await db
          .collection("users")
          .doc(uid)
          .collection("portfolioPrices")
          .doc(card.cardDocId)
          .set({ price: currentPrice, sentAt: now, updatedAt: now });
        fired++;
      } else {
        errors++;
      }
    }
  }

  return { checked, fired, errors };
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  const [manual, portfolio] = await Promise.allSettled([
    processManualAlerts(db).catch((e) => ({ checked: 0, fired: 0, errors: 1, message: String(e) })),
    processPortfolioAlerts(db).catch((e) => ({ checked: 0, fired: 0, errors: 1, message: String(e) })),
  ]);

  return NextResponse.json({
    ok: true,
    manual: manual.status === "fulfilled" ? manual.value : { error: String(manual.reason) },
    portfolio: portfolio.status === "fulfilled" ? portfolio.value : { error: String(portfolio.reason) },
  });
}
