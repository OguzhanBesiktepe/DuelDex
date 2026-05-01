// Weekly ban list monitor — called by Vercel Cron on Sunday at 05:00 UTC.
//
// Fetches the current YGO TCG Forbidden & Limited list from YGOPRODeck,
// diffs it against the previous week's snapshot stored in Firestore,
// and writes the changes to ban_list_changes/latest for the chat AI to read.
//
// Ban list changes are the #1 driver of YGO card prices — newly limited cards spike
// immediately, while newly unlimited cards drop.

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface BanEntry {
  name: string;
  status: "Forbidden" | "Limited" | "Semi-Limited";
}

interface BanListSnapshot {
  cards: BanEntry[];
  fetchedAt: string;
}

interface BanListChanges {
  date: string;
  newlyForbidden: string[];
  newlyLimited: string[];
  newlySemiLimited: string[];
  newlyUnlimited: string[];
  fetchedAt: string;
  hasChanges: boolean;
}

async function fetchBanList(): Promise<BanEntry[]> {
  const res = await fetch(
    "https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=TCG",
    { cache: "no-store" },
  );
  if (!res.ok) return [];

  const data = await res.json();
  const cards: { name: string; banlist_info?: { ban_tcg?: string } }[] =
    data.data ?? [];

  return cards
    .filter((c) => c.banlist_info?.ban_tcg)
    .map((c) => ({
      name: c.name,
      status: c.banlist_info!.ban_tcg as BanEntry["status"],
    }));
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentList = await fetchBanList();
  if (currentList.length === 0) {
    return NextResponse.json({ ok: false, error: "Failed to fetch ban list" });
  }

  const db = getAdminDb();
  const now = new Date().toISOString();
  const date = now.slice(0, 10);

  // Read previous snapshot
  const prevSnap = await db.collection("ban_list_snapshot").doc("current").get();
  const prev: BanEntry[] = prevSnap.exists
    ? ((prevSnap.data() as BanListSnapshot).cards ?? [])
    : [];

  // Diff: build maps keyed by card name
  const prevMap = new Map<string, string>(prev.map((c) => [c.name, c.status]));
  const currentMap = new Map<string, string>(
    currentList.map((c) => [c.name, c.status]),
  );

  const newlyForbidden: string[] = [];
  const newlyLimited: string[] = [];
  const newlySemiLimited: string[] = [];
  const newlyUnlimited: string[] = [];

  // Check for status changes and new additions
  for (const [name, status] of currentMap) {
    const prevStatus = prevMap.get(name);
    if (prevStatus !== status) {
      if (status === "Forbidden") newlyForbidden.push(name);
      else if (status === "Limited") newlyLimited.push(name);
      else if (status === "Semi-Limited") newlySemiLimited.push(name);
    }
  }

  // Cards that were restricted but are now off the list entirely
  for (const [name] of prevMap) {
    if (!currentMap.has(name)) newlyUnlimited.push(name);
  }

  const changes: BanListChanges = {
    date,
    newlyForbidden,
    newlyLimited,
    newlySemiLimited,
    newlyUnlimited,
    fetchedAt: now,
    hasChanges:
      newlyForbidden.length > 0 ||
      newlyLimited.length > 0 ||
      newlySemiLimited.length > 0 ||
      newlyUnlimited.length > 0,
  };

  await Promise.all([
    db.collection("ban_list_changes").doc("latest").set(changes),
    db.collection("ban_list_snapshot").doc("current").set({
      cards: currentList,
      fetchedAt: now,
    } as BanListSnapshot & { fetchedAt: string }),
    db.collection("ban_list_changes").doc(date).set(changes),
  ]);

  return NextResponse.json({
    ok: true,
    date,
    totalBanned: currentList.length,
    changes: {
      forbidden: newlyForbidden.length,
      limited: newlyLimited.length,
      semiLimited: newlySemiLimited.length,
      unlimited: newlyUnlimited.length,
    },
  });
}
