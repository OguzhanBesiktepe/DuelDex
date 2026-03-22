// TCGdex API helpers — all Pokémon TCG data is sourced from the free, open-source TCGdex API.
// No API key is required and hotlinking their CDN images is explicitly permitted.
//
// ⚠️  TCGdex bug: ALL bracket-based query params (filters[key]=, pagination[key]=) return HTTP 500.
//     Use plain params instead: category=Pokemon, types=Fire, name=charizard, etc.
//     Pagination is done manually in JS after fetching the full filtered list (cached by Next.js).

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
  pricing?: {
    tcgplayer?: {
      normal?: { marketPrice?: number; lowPrice?: number; midPrice?: number; highPrice?: number };
      holofoil?: { marketPrice?: number; lowPrice?: number; midPrice?: number; highPrice?: number };
      "reverse-holofoil"?: { marketPrice?: number; lowPrice?: number; midPrice?: number; highPrice?: number };
      "1stEditionHolofoil"?: { marketPrice?: number; lowPrice?: number; midPrice?: number; highPrice?: number };
    };
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

// Fetches ALL cards for a category + optional filters with no pagination.
// The full list is cached by Next.js for 1 hour, then sliced in JS.
// category maps to the TCGdex `category` field (Pokemon / Trainer / Energy).
export async function fetchAllPokemonCards(
  category: "Pokemon" | "Trainer" | "Energy",
  filters?: {
    types?: string;       // energy type: Fire, Water, Grass, etc.
    stage?: string;       // Basic, Stage1, Stage2, V, VMAX, VSTAR, GX, EX
    trainerType?: string; // Item, Supporter, Stadium, Tool
  },
): Promise<PokemonCardSummary[]> {
  let url = `${PKM_BASE}/cards?category=${encodeURIComponent(category)}`;
  if (filters?.types) url += `&types=${encodeURIComponent(filters.types)}`;
  if (filters?.stage) url += `&stage=${encodeURIComponent(filters.stage)}`;
  if (filters?.trainerType) url += `&trainerType=${encodeURIComponent(filters.trainerType)}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  // TCGdex may return null or a non-array on unexpected inputs
  return Array.isArray(data) ? data : [];
}

// Paginated wrapper around fetchAllPokemonCards.
// Returns the page slice plus the true total count (enabling "Page X of Y" UI).
export async function fetchPokemonCards(
  category: "Pokemon" | "Trainer" | "Energy",
  page = 1,
  itemsPerPage = 24,
  filters?: {
    types?: string;
    stage?: string;
    trainerType?: string;
  },
): Promise<{ cards: PokemonCardSummary[]; total: number }> {
  const all = await fetchAllPokemonCards(category, filters);
  const total = all.length;
  const cards = all.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  return { cards, total };
}

export async function fetchPokemonCardById(id: string): Promise<PokemonCard | null> {
  const url = `${PKM_BASE}/cards/${id}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

// Search cards by name — uses plain `name=` param (bracket syntax returns 500)
export async function searchPokemonCards(query: string): Promise<PokemonCardSummary[]> {
  const url = `${PKM_BASE}/cards?name=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchPokemonCardsBySet(
  setId: string,
): Promise<PokemonCardSummary[]> {
  // Use the set detail endpoint — bracket pagination is broken on the /cards endpoint
  const res = await fetch(`${PKM_BASE}/sets/${setId}`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.cards) ? data.cards : [];
}

export interface PokemonSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  releaseDate?: string;
  cardCount?: { total?: number; official?: number };
  serie?: { id: string; name: string };
}

export async function fetchPokemonSets(): Promise<PokemonSet[]> {
  const res = await fetch(`${PKM_BASE}/sets`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPokemonSetDetail(
  setId: string,
): Promise<(PokemonSet & { cards: PokemonCardSummary[] }) | null> {
  const res = await fetch(`${PKM_BASE}/sets/${setId}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}
