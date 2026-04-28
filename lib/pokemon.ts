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
      // Top-level metadata fields returned by TCGdex
      updated?: string;
      unit?: string;
      // Variant keys: "normal", "reverse", "holo" (per TCGdex docs)
      [variant: string]: {
        lowPrice?: number;
        midPrice?: number;
        highPrice?: number;
        marketPrice?: number;
        directLowPrice?: number | null;
      } | string | undefined;
    };
    cardmarket?: {
      updated?: string;
      unit?: string;
      idProduct?: number;
      avg?: number;
      low?: number;
      trend?: number;
      [key: string]: unknown;
    };
  };
  suffix?: string; // "Legend" for LEGEND dual cards
  level?: number | string; // printed level (e.g. 48 for "Luxray GL Lv.48") — Platinum/DP era SP cards
  set?: {
    id: string;
    name: string;
    logo?: string;
  };
}

// Returns the best available TCGPlayer market price across all variant keys.
// TCGdex variant keys are "normal", "reverse", "holo" — skip metadata strings ("updated", "unit").
export function getBestTcgPrice(card: Pick<PokemonCard, "pricing">): number | null {
  const tcg = card.pricing?.tcgplayer;
  if (!tcg) return null;
  let best: number | null = null;
  for (const variant of Object.values(tcg)) {
    if (typeof variant !== "object" || variant == null) continue;
    // Prefer marketPrice, fall back to lowPrice if marketPrice is absent
    const price = variant.marketPrice ?? variant.lowPrice ?? null;
    if (price != null && (best === null || price > best)) best = price;
  }
  return best;
}

// TCGdex does not return a TCGPlayer productId — always falls back to search URL.
// Kept for API compatibility; returns null unconditionally.
export function getTcgPlayerProductId(_card: Pick<PokemonCard, "pricing">): number | null {
  return null;
}

// Returns the Cardmarket trend price (EUR) as a fallback when TCGPlayer data is unavailable.
// Legend cards and some older sets have tcgplayer: null but do have Cardmarket data.
export function getCardMarketPrice(card: Pick<PokemonCard, "pricing">): number | null {
  return card.pricing?.cardmarket?.trend ?? null;
}

// Maps TCGdex set IDs → official PTCG expansion codes used by Cardmarket in card slugs.
// Cardmarket URL format: /Singles/{Set-Name-Slug}/{Card-Name-Slug}-{EXPANSION-CODE}{localId}
// e.g. Bulbasaur (swsh10.5, localId "001") → /Singles/Pokemon-GO/Bulbasaur-PGO001
const CARDMARKET_EXPANSION_CODES: Record<string, string> = {
  // Scarlet & Violet
  "sv1": "SVI", "sv2": "PAL", "sv3": "OBF", "sv3pt5": "MEW", "sv3.5": "MEW",
  "sv4": "PAR", "sv4pt5": "PAF", "sv4.5": "PAF", "sv5": "TEF", "sv6": "TWM",
  "sv6pt5": "SFA", "sv6.5": "SFA", "sv7": "SCR", "sv8": "SSP",
  "sv8pt5": "PRE", "sv8.5": "PRE",
  // Sword & Shield
  "swsh1": "SSH", "swsh2": "RCL", "swsh3": "DAA", "swsh4": "VIV", "swsh5": "BST",
  "swsh6": "CRE", "swsh7": "EVS", "swsh8": "FST", "swsh9": "BRS", "swsh10": "ASR",
  "swsh10.5": "PGO", "swsh11": "LOR", "swsh12": "SIT", "swsh12.5": "CRZ",
  // Note: promo sets (swshp, xyp, smp, svp, bwp, dpp, plp) are excluded — their localIds
  // already contain the set prefix (e.g. "SWSH001"), causing doubled slugs. Falls back to search.
  // cel25 excluded: Celebrations uses non-standard localId padding on Cardmarket.
  // Sun & Moon
  "sm1": "SUM", "sm2": "GRI", "sm3": "BUS", "sm3.5": "SLG", "sm35": "SLG",
  "sm4": "CIN", "sm5": "UPR", "sm6": "FLI", "sm7": "CES", "sm75": "DRM",
  "sm7.5": "DRM", "sm8": "LOT", "sm9": "TEU", "sm10": "UNB", "sm11": "UNM",
  "sm115": "HIF", "sm11.5": "HIF", "sm12": "CEC",
  // XY
  "xy1": "XY", "xy2": "FLF", "xy3": "FFI", "xy4": "PHF", "xy5": "PRC",
  "xy6": "ROS", "xy7": "AOR", "xy8": "BKT", "xy9": "BKP", "xy10": "FCO",
  "xy11": "STS", "xy12": "EVO", "g1": "GEN",
  // Black & White
  "bw1": "BLW", "bw2": "EPO", "bw3": "NVI", "bw4": "NXD", "bw5": "DEX",
  "bw6": "DRX", "bw7": "BCR", "bw8": "PLS", "bw9": "PLF", "bw10": "PLB",
  "bw11": "LTR",
  // HeartGold SoulSilver
  "hgss1": "HS", "hgss2": "UL", "hgss3": "UD", "hgss4": "TM", "hgss5": "CL",
  // Platinum
  "pl1": "PL", "pl2": "RR", "pl3": "SV", "pl4": "AR",
  // Diamond & Pearl
  "dp1": "DP", "dp2": "MT", "dp3": "SW", "dp4": "GE", "dp5": "MD",
  "dp6": "LA", "dp7": "SF",
  // EX Series
  "ex1": "RS", "ex2": "SS", "ex3": "DR", "ex4": "MA", "ex5": "HL",
  "ex6": "FL", "ex7": "DX", "ex8": "UF", "ex9": "DS", "ex10": "LM",
  "ex11": "HP", "ex12": "CG", "ex13": "DF", "ex14": "PK",
  // Base / Neo / Classic
  "base1": "BS", "base2": "JU", "base3": "FO", "base4": "BS2",
  "base5": "TR", "base6": "G1",
  "neo1": "N1", "neo2": "N2", "neo3": "N3", "neo4": "N4",
  "gym1": "G1", "gym2": "G2",
};

// Returns a direct Cardmarket product URL using the official PTCG expansion code + localId.
// Falls back to Cardmarket search if the set is not in the mapping table.
export function getCardMarketUrl(card: Pick<PokemonCard, "name" | "localId" | "set" | "level">): string {
  const slugify = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // é → e, ü → u
      .replace(/♀/g, "F")
      .replace(/♂/g, "M")
      .replace(/&/g, "")
      .replace(/[''']/g, "")
      .replace(/\./g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  // Older cards (Platinum / Diamond & Pearl era) have a printed level that Cardmarket
  // includes in the product slug: "Luxray GL" at level 48 → "Luxray-GL-Lv48"
  const fullName = card.level != null
    ? `${card.name} Lv.${card.level}`
    : card.name;

  if (card.set?.name && card.set?.id) {
    const setSlug = slugify(card.set.name);
    const expansionCode = CARDMARKET_EXPANSION_CODES[card.set.id];
    if (expansionCode && card.localId) {
      const cardSlug = `${slugify(fullName)}-${expansionCode}${card.localId}`;
      return `https://www.cardmarket.com/en/Pokemon/Products/Singles/${setSlug}/${cardSlug}`;
    }
  }
  // Fallback: search by card name (always works, just less direct)
  return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(fullName)}`;
}

// For LEGEND dual cards, determines whether this half is "Top" or "Bottom" by fetching
// the adjacent card (same set, localId ± 1) and checking if the name matches.
// Returns null for non-Legend cards or if the half cannot be determined.
export async function getLegendHalf(card: PokemonCard): Promise<"Top" | "Bottom" | null> {
  if (card.rarity !== "LEGEND" && card.suffix !== "Legend") return null;
  const localId = parseInt(card.localId, 10);
  if (isNaN(localId) || !card.set?.id) return null;

  // If the next card shares the same name, this is the Top half
  const next = await fetchPokemonCardById(`${card.set.id}-${localId + 1}`);
  if (next?.name === card.name) return "Top";

  // If the previous card shares the same name, this is the Bottom half
  const prev = await fetchPokemonCardById(`${card.set.id}-${localId - 1}`);
  if (prev?.name === card.name) return "Bottom";

  return null;
}

export interface PokemonCardSummary {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

// Stages where TCGdex API `stage=` param returns empty/wrong results.
// We skip the API param and match by card name suffix instead, which is reliable
// because the TCG always puts the stage in the card name (e.g. "Charizard ex", "Charizard GX").
const NAME_FILTERED_STAGES: Record<string, (name: string) => boolean> = {
  ex: (name) => name.endsWith(" ex"),
  EX: (name) => name.endsWith(" EX"),
  GX: (name) => name.endsWith(" GX") || name.endsWith("-GX"),
  // LV.X is not here — TCGdex stores these as stage="LEVEL-UP", which the API param handles correctly
};

// Fetches ALL cards for a category + optional filters with no pagination.
// The full list is cached by Next.js for 1 hour, then sliced in JS.
// category maps to the TCGdex `category` field (Pokemon / Trainer / Energy).
export async function fetchAllPokemonCards(
  category: "Pokemon" | "Trainer" | "Energy",
  filters?: {
    types?: string;       // energy type: Fire, Water, Grass, etc.
    stage?: string;       // Basic, Stage1, Stage2, V, VMAX, VSTAR, ex, GX, EX, LV.X
    trainerType?: string; // Item, Supporter, Stadium, Tool
    rarity?: string;      // e.g. "Illustration Rare", "Hyper Rare"
  },
): Promise<PokemonCardSummary[]> {
  const nameFilter = filters?.stage ? NAME_FILTERED_STAGES[filters.stage] : undefined;

  let url = `${PKM_BASE}/cards?category=${encodeURIComponent(category)}`;
  if (filters?.types) url += `&types=${encodeURIComponent(filters.types)}`;
  // Skip stage param for stages the API can't filter — we filter by name in JS instead
  if (filters?.stage && !nameFilter) url += `&stage=${encodeURIComponent(filters.stage)}`;
  if (filters?.trainerType) url += `&trainerType=${encodeURIComponent(filters.trainerType)}`;
  if (filters?.rarity) url += `&rarity=${encodeURIComponent(filters.rarity)}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  // TCGdex may return null or a non-array on unexpected inputs
  const cards: PokemonCardSummary[] = Array.isArray(data) ? data : [];

  // For stages the API can't filter, apply name-based matching in JS
  if (nameFilter) {
    return cards.filter((c) => nameFilter(c.name));
  }
  return cards;
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
