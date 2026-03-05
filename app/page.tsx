import { Vibrant } from "node-vibrant/node";
import HeroSection, { type FeaturedSet } from "@/components/HeroSection";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbStringToHex(rgb: string): string {
  const [r, g, b] = rgb.split(",").map((s) => parseInt(s.trim(), 10));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

async function extractCardColor(
  imageUrl: string,
  fallbackRgb: string,
): Promise<string> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    const swatch =
      palette.Vibrant ??
      palette.DarkVibrant ??
      palette.Muted ??
      palette.DarkMuted;
    if (!swatch) return fallbackRgb;
    const [r, g, b] = swatch.rgb;
    return `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
  } catch {
    return fallbackRgb;
  }
}

// ─── YGO rarity tiers ─────────────────────────────────────────────────────────

const YGO_HIGH_RARITIES = new Set([
  "Starlight Rare",
  "Prismatic Secret Rare",
  "Secret Rare",
  "Ghost Rare",
  "Collector's Rare",
  "Ultimate Rare",
  "Ultra Rare",
]);

// Fetching Yugioh

async function fetchFeaturedYGO(): Promise<FeaturedSet | null> {
  try {
    const setsRes = await fetch(
      "https://db.ygoprodeck.com/api/v7/cardsets.php",
      { cache: "no-store" },
    );
    if (!setsRes.ok) return null;

    const sets: { set_name: string; num_of_cards: number; tcg_date: string }[] =
      await setsRes.json();

    const mainSets = sets.filter((s) => s.num_of_cards >= 60 && s.tcg_date);
    const set = mainSets[Math.floor(Math.random() * mainSets.length)];
    if (!set) return null;

    const cardsRes = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set.set_name)}`,
      { cache: "no-store" },
    );
    if (!cardsRes.ok) return null;

    const cardsData = await cardsRes.json();
    const cards: {
      card_images: { image_url: string }[];
      card_sets?: { set_name: string; set_rarity: string }[];
    }[] = cardsData.data ?? [];

    const rareCards = cards.filter((card) =>
      card.card_sets?.some(
        (cs) =>
          cs.set_name === set.set_name && YGO_HIGH_RARITIES.has(cs.set_rarity),
      ),
    );

    const pool = rareCards.length > 0 ? rareCards : cards;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    const cardImages: string[] = [];
    for (const card of shuffled) {
      const url = card.card_images?.[0]?.image_url;
      if (url) {
        cardImages.push(url);
        if (cardImages.length === 3) break;
      }
    }

    const colorSource = cardImages[Math.floor(cardImages.length / 2)] ?? null;
    const accentRgb = colorSource
      ? await extractCardColor(colorSource, "255, 122, 0")
      : "255, 122, 0";

    return {
      gameLabel: "Yu-Gi-Oh!",
      setName: set.set_name,
      cardImages,
      setHref: "/yugioh/sets",
      accentColor: rgbStringToHex(accentRgb),
      accentRgb,
    };
  } catch {
    return null;
  }
}

//Fetching Pokemon

async function fetchFeaturedPokemon(): Promise<FeaturedSet | null> {
  try {
    const setsRes = await fetch("https://api.tcgdex.net/v2/en/sets", {
      cache: "no-store",
    });
    if (!setsRes.ok) return null;

    const sets: {
      id: string;
      name: string;
      cardCount?: { total: number; official?: number };
    }[] = await setsRes.json();

    const mainSets = sets.filter((s) => (s.cardCount?.total ?? 0) >= 50);
    const set = mainSets[Math.floor(Math.random() * mainSets.length)];
    if (!set) return null;

    const setRes = await fetch(`https://api.tcgdex.net/v2/en/sets/${set.id}`, {
      cache: "no-store",
    });
    if (!setRes.ok) return null;

    const setDetail: {
      cardCount?: { official?: number };
      cards?: { id?: string; localId?: string; image?: string }[];
    } = await setRes.json();

    const cards = setDetail.cards ?? [];
    const officialCount = setDetail.cardCount?.official ?? 0;

    let pool = cards.filter((c) => {
      if (!c.localId) return false;
      const num = parseInt(c.localId, 10);
      if (isNaN(num)) return true;
      return officialCount > 0 && num > officialCount;
    });

    if (pool.length === 0) {
      const numeric = cards
        .filter((c) => !isNaN(parseInt(c.localId ?? "", 10)))
        .sort((a, b) => parseInt(b.localId!, 10) - parseInt(a.localId!, 10));
      pool = numeric.slice(0, Math.max(5, Math.floor(numeric.length * 0.2)));
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const cardImages: string[] = [];
    for (const card of shuffled) {
      if (card.image) {
        cardImages.push(`${card.image}/high.webp`);
        if (cardImages.length === 3) break;
      }
    }

    if (cardImages.length < 3) {
      for (const card of cards) {
        const url = card.image ? `${card.image}/high.webp` : null;
        if (url && !cardImages.includes(url)) {
          cardImages.push(url);
          if (cardImages.length === 3) break;
        }
      }
    }

    const colorSource = cardImages[Math.floor(cardImages.length / 2)] ?? null;
    const accentRgb = colorSource
      ? await extractCardColor(colorSource, "0, 170, 255")
      : "0, 170, 255";

    return {
      gameLabel: "Pokémon",
      setName: set.name,
      cardImages,
      setHref: "/pokemon/sets",
      accentColor: rgbStringToHex(accentRgb),
      accentRgb,
    };
  } catch {
    return null;
  }
}

async function getFeaturedSet(): Promise<FeaturedSet> {
  const pickYGO = Math.random() > 0.5;
  const primary = pickYGO
    ? await fetchFeaturedYGO()
    : await fetchFeaturedPokemon();
  if (primary) return primary;

  const fallback = pickYGO
    ? await fetchFeaturedPokemon()
    : await fetchFeaturedYGO();
  if (fallback) return fallback;

  return {
    gameLabel: "Yu-Gi-Oh!",
    setName: "Legend of Blue Eyes White Dragon",
    cardImages: ["https://images.ygoprodeck.com/images/cards/89631139.jpg"],
    setHref: "/yugioh/sets",
    accentColor: "#FF7A00",
    accentRgb: "255, 122, 0",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const featured = await getFeaturedSet();

  return (
    <main style={{ background: "#080B14", minHeight: "100vh" }}>
      <HeroSection featured={featured} />
    </main>
  );
}
