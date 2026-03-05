const PKM_BASE = "https://api.tcgdex.net/v2/en";

export interface PokemonCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity?: string;
  category?: string;
  hp?: number;
  types?: string[];
  illustrator?: string;
  description?: string;
  stage?: string;
  attacks?: { name: string; damage?: string; effect?: string; cost?: string[] }[];
  weaknesses?: { type: string; value: string }[];
  variants?: {
    normal?: boolean;
    reverse?: boolean;
    holo?: boolean;
    firstEdition?: boolean;
  };
  set?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface PokemonCardSummary {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

export async function fetchPokemonCards(
  supertype: "Pokemon" | "Trainer" | "Energy",
  page = 1,
  itemsPerPage = 24,
): Promise<{ cards: PokemonCardSummary[]; total: number }> {
  const url = `${PKM_BASE}/cards?filters[supertype]=${supertype}&pagination[page]=${page}&pagination[itemsPerPage]=${itemsPerPage}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return { cards: [], total: 0 };
  const cards: PokemonCardSummary[] = await res.json();
  return { cards, total: cards.length };
}

export async function fetchPokemonCardById(id: string): Promise<PokemonCard | null> {
  const url = `${PKM_BASE}/cards/${id}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export async function searchPokemonCards(query: string): Promise<PokemonCardSummary[]> {
  const url = `${PKM_BASE}/cards?filters[name]=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPokemonCardsBySet(
  setId: string,
  page = 1,
  itemsPerPage = 24,
): Promise<{ cards: PokemonCardSummary[]; total: number }> {
  const url = `${PKM_BASE}/sets/${setId}/cards?pagination[page]=${page}&pagination[itemsPerPage]=${itemsPerPage}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return { cards: [], total: 0 };
  const cards: PokemonCardSummary[] = await res.json();
  return { cards, total: cards.length };
}
