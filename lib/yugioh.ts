// YGOPRODeck API helpers — all Yu-Gi-Oh! data is sourced from the free YGOPRODeck REST API.
// No API key is required. Responses are cached for 1 hour (revalidate: 3600) by Next.js
// unless a shorter TTL makes sense (e.g. search results use 60 s).

const YGO_BASE = "https://db.ygoprodeck.com/api/v7";

export interface YGOCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  card_images: { id: number; image_url: string; image_url_small: string }[];
  card_prices: {
    tcgplayer_price: string;
    ebay_price: string;
    cardmarket_price: string;
  }[];
  card_sets?: { set_name: string; set_code: string; set_rarity: string; set_price: string }[];
}

// Fetch a paginated list of cards of a given type with optional race/attribute/level filters.
// `race` maps to the YGOPRODeck `race` param (e.g. "Dragon", "Spellcaster").
export async function fetchYGOCards(
  type: string,
  num = 24,
  offset = 0,
  race?: string,
  attribute?: string,
  level?: number,
): Promise<{ cards: YGOCard[]; total: number }> {
  const raceParam = race ? `&race=${encodeURIComponent(race)}` : "";
  const attributeParam = attribute ? `&attribute=${encodeURIComponent(attribute)}` : "";
  const levelParam = level ? `&level=${level}` : "";
  const url = `${YGO_BASE}/cardinfo.php?type=${encodeURIComponent(type)}&num=${num}&offset=${offset}${raceParam}${attributeParam}${levelParam}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return { cards: [], total: 0 };
  const json = await res.json();
  return {
    cards: json.data ?? [],
    // total_rows is the unpaginated count, used to calculate page totals
    total: json.meta?.total_rows ?? 0,
  };
}

export async function fetchYGOCardById(id: string): Promise<YGOCard | null> {
  const url = `${YGO_BASE}/cardinfo.php?id=${id}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] ?? null;
}

export async function fetchYGOCardsBySet(
  setName: string,
  num = 24,
  offset = 0,
): Promise<{ cards: YGOCard[]; total: number }> {
  const url = `${YGO_BASE}/cardinfo.php?cardset=${encodeURIComponent(setName)}&num=${num}&offset=${offset}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return { cards: [], total: 0 };
  const json = await res.json();
  return {
    cards: json.data ?? [],
    total: json.meta?.total_rows ?? 0,
  };
}

// Fetch ALL cards in a set in a single request (no pagination) — used for the set detail page.
export async function fetchAllYGOCardsBySet(setName: string): Promise<YGOCard[]> {
  const url = `${YGO_BASE}/cardinfo.php?cardset=${encodeURIComponent(setName)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function searchYGOCards(query: string): Promise<YGOCard[]> {
  // Normalize: strip non-alphanumeric so "Blue Eyes" matches "Blue-Eyes"
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

  const words = normalize(query).split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return [];

  const apiFetch = async (q: string): Promise<YGOCard[]> => {
    const url = `${YGO_BASE}/cardinfo.php?fname=${encodeURIComponent(q)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  };

  // Try the full query first (works for most cards)
  let results = await apiFetch(query);

  // If nothing came back (e.g. "Blue Eyes" fails because API has "Blue-Eyes"),
  // fall back to the longest word — always a real substring of the card name
  if (results.length === 0) {
    const longestWord = words.reduce((a, b) => (b.length > a.length ? b : a));
    results = await apiFetch(longestWord);
  }

  // Filter client-side: every word the user typed must appear in the card name
  return results.filter((c) =>
    words.every((word) => normalize(c.name).includes(word))
  );
}

// Fetch all alternate art versions via name= which returns the full card_images list
export async function fetchYGOCardAltArts(name: string): Promise<YGOCard[]> {
  const res = await fetch(
    `${YGO_BASE}/cardinfo.php?name=${encodeURIComponent(name)}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data ?? [];
}

export interface YGOSet {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date: string;
  set_image: string;
}

// Fetches the full list of sets; cached for 24 hours since sets are added infrequently.
export async function fetchYGOSets(): Promise<YGOSet[]> {
  const res = await fetch(`${YGO_BASE}/cardsets.php`, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  return res.json();
}

// Maps nav route segments to YGOPRODeck type strings
export const YGO_TYPE_MAP: Record<string, string[]> = {
  monsters: [
    "Effect Monster",
    "Normal Monster",
    "Flip Effect Monster",
    "Ritual Monster",
    "Synchro Monster",
    "XYZ Monster",
    "Link Monster",
    "Pendulum Effect Monster",
    "Fusion Monster",
  ],
  spells: ["Spell Card"],
  traps: ["Trap Card"],
};
