import { NextRequest, NextResponse } from "next/server";

const YGO_BASE = "https://db.ygoprodeck.com/api/v7/cardinfo.php";
const PKM_BASE = "https://api.tcgdex.net/v2/en/cards";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

// Build query variants to handle punctuation mismatches.
// e.g. "Blue Eyes" → also tries "Blue-Eyes", handles apostrophes, etc.
function queryVariants(q: string): string[] {
  const variants = new Set<string>();
  variants.add(q);
  variants.add(q.replace(/\s+/g, "-"));        // "Blue Eyes" → "Blue-Eyes"
  variants.add(q.replace(/-/g, " "));           // "Blue-Eyes" → "Blue Eyes"
  variants.add(q.replace(/['\u2019]/g, ""));    // "don't" → "dont"
  return [...variants].filter((v) => v.trim().length >= 2);
}

async function fetchYGO(q: string) {
  return fetch(`${YGO_BASE}?fname=${encodeURIComponent(q)}&num=12&offset=0`).then((r) =>
    r.ok ? r.json() : { data: [] },
  );
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const words = normalize(q).split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return NextResponse.json([]);

  const variants = queryVariants(q);

  const [ygoSettled, pkmnSettled] = await Promise.allSettled([
    // Fetch all YGO variants in parallel, then merge + deduplicate by card id
    Promise.all(variants.map(fetchYGO)).then((responses) => {
      const seen = new Set<number>();
      const merged: { id: number; name: string; card_images: { image_url_small: string }[] }[] = [];
      for (const res of responses) {
        for (const card of res?.data ?? []) {
          if (!seen.has(card.id)) {
            seen.add(card.id);
            merged.push(card);
          }
        }
      }
      return merged;
    }),
    fetch(
      `${PKM_BASE}?filters[name]=${encodeURIComponent(q)}&pagination[page]=1&pagination[itemsPerPage]=5`,
    ).then((r) => (r.ok ? r.json() : [])),
  ]);

  const results = [];

  if (ygoSettled.status === "fulfilled") {
    const ygoCards = ygoSettled.value
      .filter((c) => words.every((w) => normalize(c.name).includes(w)))
      .slice(0, 5)
      .map((c) => ({
        id: String(c.id),
        name: c.name,
        image: c.card_images?.[0]?.image_url_small ?? "",
        game: "yugioh",
        href: `/yugioh/card/${c.id}`,
      }));
    results.push(...ygoCards);
  }

  if (pkmnSettled.status === "fulfilled" && Array.isArray(pkmnSettled.value)) {
    const pkmnCards = pkmnSettled.value
      .slice(0, 3)
      .map((c: { id: string; name: string; image?: string }) => ({
        id: c.id,
        name: c.name,
        image: c.image ? `${c.image}/low.webp` : "",
        game: "pokemon",
        href: `/pokemon/card/${c.id}`,
      }));
    results.push(...pkmnCards);
  }

  return NextResponse.json(results);
}
