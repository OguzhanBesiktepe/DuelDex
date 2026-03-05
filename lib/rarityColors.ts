// Gem color palette — low to high rarity
const GREY       = "#6B7280"; // Common
const AQUA       = "#2DD4BF"; // Rare
const JADE       = "#4ADE80"; // Super Rare
const AMETHYST   = "#C084FC"; // Ultra Rare
const TOPAZ      = "#FCD34D"; // Secret Rare
const FIRE_OPAL  = "#FB923C"; // Ultimate / Ghost / Collector's
const DIAMOND    = "#E879F9"; // Starlight / Prismatic

const YGO_RARITY_COLORS: Record<string, string> = {
  // Tier 1 — Common
  "Common":                       GREY,
  "Short Print":                  GREY,
  "Normal Parallel Rare":         GREY,

  // Tier 2 — Rare
  "Rare":                         AQUA,
  "Duel Terminal Normal Parallel Rare": AQUA,

  // Tier 3 — Super Rare
  "Super Rare":                   JADE,
  "Super Short Print":            JADE,
  "Duel Terminal Super Parallel Rare": JADE,

  // Tier 4 — Ultra Rare
  "Ultra Rare":                   AMETHYST,
  "Ultra Rare (Pharaoh's Rare)":  AMETHYST,
  "Duel Terminal Ultra Parallel Rare": AMETHYST,

  // Tier 5 — Secret Rare
  "Secret Rare":                  TOPAZ,
  "Prismatic Secret Rare":        TOPAZ,
  "Extra Secret Rare":            TOPAZ,
  "Duel Terminal Ultra Rare Parallel Rare": TOPAZ,

  // Tier 6 — Ultimate / Ghost / Collector's
  "Ultimate Rare":                FIRE_OPAL,
  "Ghost Rare":                   FIRE_OPAL,
  "Collector's Rare":             FIRE_OPAL,
  "Ghost/Gold Rare":              FIRE_OPAL,

  // Tier 7 — Starlight / Prismatic
  "Starlight Rare":               DIAMOND,
  "Platinum Secret Rare":         DIAMOND,
};

const PKM_RARITY_COLORS: Record<string, string> = {
  // Tier 1 — Common
  "Common":                           GREY,
  "None":                             GREY,

  // Tier 2 — Uncommon / Rare
  "Uncommon":                         AQUA,
  "Rare":                             JADE,

  // Tier 3 — Holo
  "Rare Holo":                        AMETHYST,
  "Rare Holo EX":                     AMETHYST,
  "Rare Holo GX":                     AMETHYST,
  "Rare Holo V":                      AMETHYST,
  "Rare Holo VMAX":                   AMETHYST,
  "Rare Holo VSTAR":                  AMETHYST,

  // Tier 4 — Ultra
  "Rare Ultra":                       TOPAZ,
  "Rare Rainbow":                     TOPAZ,
  "Double Rare":                      TOPAZ,
  "Rare ACE":                         TOPAZ,

  // Tier 5 — Secret / Hyper
  "Rare Secret":                      FIRE_OPAL,
  "Hyper Rare":                       FIRE_OPAL,
  "Rare Shining":                     FIRE_OPAL,
  "Amazing Rare":                     FIRE_OPAL,

  // Tier 6 — Illustration / Special
  "Illustration Rare":                DIAMOND,
  "Special Illustration Rare":        DIAMOND,
  "Trainer Gallery Rare Holo":        DIAMOND,
  "Radiant Rare":                     DIAMOND,
};

export function getRarityColor(rarity: string | undefined, game: "yugioh" | "pokemon"): string {
  if (!rarity) return GREY;
  const map = game === "yugioh" ? YGO_RARITY_COLORS : PKM_RARITY_COLORS;
  return map[rarity] ?? GREY;
}
