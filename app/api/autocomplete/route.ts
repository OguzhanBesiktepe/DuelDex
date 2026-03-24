// GET /api/autocomplete?q=<query>
// Returns up to 8 card suggestions (5 YGO + 3 Pokémon) for the navbar search dropdown.
// Fetches both APIs in parallel and filters client-side so all words in the query appear in the card name.

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
  return fetch(`${YGO_BASE}?fname=${encodeURIComponent(q)}&num=12&offset=0&tcgplayer_data=true`).then((r) =>
    r.ok ? r.json() : { data: [] },
  );
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const words = normalize(q).split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return NextResponse.json([]);

  const variants = queryVariants(q);

  // Use allSettled so a failure in one API doesn't block the other
  const [ygoSettled, pkmnSettled] = await Promise.allSettled([
    // Fetch all YGO query variants in parallel, then merge + deduplicate by card id
    Promise.all(variants.map(fetchYGO)).then((responses) => {
      const seen = new Set<number>();
      const merged: { id: number; name: string; card_images: { image_url_small: string }[]; card_prices?: { tcgplayer_price: string }[] }[] = [];
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
      `${PKM_BASE}?name=${encodeURIComponent(q)}`,
    ).then((r) => (r.ok ? r.json() : [])),
  ]);

  const results = [];

  if (ygoSettled.status === "fulfilled") {
    // Post-filter: every typed word must appear in the card name (API uses partial prefix matching)
    const ygoCards = ygoSettled.value
      .filter((c) => words.every((w) => normalize(c.name).includes(w)))
      .slice(0, 5)
      .map((c) => {
        const rawPrice = c.card_prices?.[0]?.tcgplayer_price;
        const price = rawPrice ? parseFloat(rawPrice) : undefined;
        return {
          id: String(c.id),
          name: c.name,
          image: c.card_images?.[0]?.image_url_small ?? "",
          game: "yugioh",
          href: `/yugioh/card/${c.id}`,
          price: price && price > 0 ? price : undefined,
        };
      });
    results.push(...ygoCards);
  }

  if (pkmnSettled.status === "fulfilled" && Array.isArray(pkmnSettled.value)) {
    const top3 = pkmnSettled.value.slice(0, 3) as { id: string; name: string; image?: string }[];
    // Fetch full card details in parallel to get TCGPlayer pricing (cached by Next.js)
    const details = await Promise.allSettled(
      top3.map((c) =>
        fetch(`https://api.tcgdex.net/v2/en/cards/${c.id}`, { next: { revalidate: 3600 } }).then((r) =>
          r.ok ? r.json() : null,
        ),
      ),
    );
    const pkmnCards = top3.map((c, i) => {
      const detail = details[i].status === "fulfilled" ? details[i].value : null;
      const tcg = detail?.pricing?.tcgplayer;
      let price: number | undefined;
      if (tcg && typeof tcg === "object") {
        for (const variant of Object.values(tcg)) {
          const mp = (variant as { marketPrice?: number } | null)?.marketPrice;
          if (mp != null && mp > 0 && (price == null || mp > price)) price = mp;
        }
      }
      return {
        id: c.id,
        name: c.name,
        image: c.image ? `${c.image}/low.webp` : "",
        game: "pokemon",
        href: `/pokemon/card/${c.id}`,
        price: price ?? undefined,
      };
    });
    results.push(...pkmnCards);
  }

  return NextResponse.json(results);
}
