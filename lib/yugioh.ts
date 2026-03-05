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

// Fetch all alternate art versions by searching the name and filtering exact matches
export async function fetchYGOCardAltArts(name: string): Promise<YGOCard[]> {
  const url = `${YGO_BASE}/cardinfo.php?fname=${encodeURIComponent(name)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).filter((c: YGOCard) => c.name === name);
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
