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
): Promise<{ cards: YGOCard[]; total: number }> {
  const url = `${YGO_BASE}/cardinfo.php?type=${encodeURIComponent(type)}&num=${num}&offset=${offset}`;
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
  const url = `${YGO_BASE}/cardinfo.php?fname=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
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
