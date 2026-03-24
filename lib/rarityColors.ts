// Rarity color maps for both YGO and Pokémon. Used by CardItem and PrintingsPanel
// to colour-code rarity badges and borders. getRarityColor() is the single export.
//
// ⚠️  TCGdex rarity strings do NOT follow the pattern you'd expect:
//       "Holo Rare V"   (NOT "Rare Holo V")
//       "Double rare"   (NOT "Double Rare" — lowercase 'r')
//       "Secret Rare"   = VMAX/VSTAR/GX Full Arts
//       "Ultra Rare"    = V Full Art, EX Full Art, SV Full Art ex
//     Both the confirmed TCGdex strings AND the old assumed strings are kept
//     so that any cached data still matches.

// ─── Shared gem palette — low → high rarity ───────────────────────────────────
const GREY         = "#6B7280"; // Common
const SILVER       = "#94A3B8"; // Promo / None
const AQUA         = "#22D3EE"; // Uncommon
const JADE         = "#4ADE80"; // Rare (non-holo)
const AMETHYST     = "#C084FC"; // Holo Rare (all card variants)
const AMBER        = "#F59E0B"; // BREAK / Prism Star / ACE SPEC
const TOPAZ        = "#FCD34D"; // Ultra Rare / Full Art / Double Rare
const FIRE_OPAL    = "#FB923C"; // Secret Rare / Hyper / Shiny
const DIAMOND      = "#E879F9"; // Illustration / Special Illustration / Crown
const QCSR_GOLD    = "#FFB800"; // Quarter Century Secret Rare (YGO only)

// ─── Yu-Gi-Oh! ────────────────────────────────────────────────────────────────
const YGO_RARITY_COLORS: Record<string, string> = {
  "Common":                                       GREY,
  "Short Print":                                  GREY,
  "Normal Parallel Rare":                         GREY,

  "Rare":                                         AQUA,
  "Duel Terminal Normal Parallel Rare":           AQUA,

  "Super Rare":                                   JADE,
  "Super Short Print":                            JADE,
  "Duel Terminal Super Parallel Rare":            JADE,

  "Ultra Rare":                                   AMETHYST,
  "Ultra Rare (Pharaoh's Rare)":                  AMETHYST,
  "Duel Terminal Ultra Parallel Rare":            AMETHYST,

  "Secret Rare":                                  TOPAZ,
  "Prismatic Secret Rare":                        TOPAZ,
  "Extra Secret Rare":                            TOPAZ,
  "Duel Terminal Ultra Rare Parallel Rare":       TOPAZ,

  "Ultimate Rare":                                FIRE_OPAL,
  "Ghost Rare":                                   FIRE_OPAL,
  "Collector's Rare":                             FIRE_OPAL,
  "Ghost/Gold Rare":                              FIRE_OPAL,

  "Starlight Rare":                               DIAMOND,
  "Platinum Secret Rare":                         DIAMOND,

  "Quarter Century Secret Rare":                  QCSR_GOLD,
};

// ─── Pokémon TCG ──────────────────────────────────────────────────────────────
// Keys are the exact strings returned by the TCGdex API.
// Old assumed strings are kept alongside confirmed strings for cache safety.
const PKM_RARITY_COLORS: Record<string, string> = {

  // ── No rarity / Promo ──────────────────────────────────────────────────────
  "None":                                         GREY,
  "Promo":                                        SILVER,

  // ── Common ─────────────────────────────────────────────────────────────────
  "Common":                                       GREY,

  // ── Uncommon ───────────────────────────────────────────────────────────────
  "Uncommon":                                     AQUA,

  // ── Rare (non-holo) ────────────────────────────────────────────────────────
  "Rare":                                         JADE,

  // ── Holo Rare — standard ───────────────────────────────────────────────────
  // TCGdex confirmed: "Rare Holo" (base holo, also used for LV.X, Prime, LEGEND)
  "Rare Holo":                                    AMETHYST,

  // ── Holo Rare — card-type variants (TCGdex format: "Holo Rare X") ─────────
  // Confirmed: "Holo Rare V" (swsh1-1 Celebi V)
  "Holo Rare V":                                  AMETHYST,
  "Holo Rare VMAX":                               AMETHYST,
  "Holo Rare VSTAR":                              AMETHYST,
  "Holo Rare GX":                                 AMETHYST,
  "Holo Rare EX":                                 AMETHYST,

  // Old assumed strings kept for cache safety
  "Rare Holo EX":                                 AMETHYST,
  "Rare Holo GX":                                 AMETHYST,
  "Rare Holo V":                                  AMETHYST,
  "Rare Holo VMAX":                               AMETHYST,
  "Rare Holo VSTAR":                              AMETHYST,
  "Rare Holo LV.X":                               AMETHYST,

  // Special holo variants
  "Rare Prime":                                   AMETHYST, // HGSS Prime cards
  "Rare LEGEND":                                  AMETHYST, // HGSS half-card LEGEND

  // ── ACE SPEC / BREAK / Prism Star ─────────────────────────────────────────
  "Rare BREAK":                                   AMBER,
  "Rare Holo Prism Star":                         AMBER,
  "Rare Prism Star":                              AMBER,
  "ACE SPEC Rare":                                AMBER,

  // ── Double Rare (SV era ex basic pull) ────────────────────────────────────
  // TCGdex confirmed: "Double rare" (lowercase 'r')
  "Double rare":                                  TOPAZ,
  "Double Rare":                                  TOPAZ, // old assumed string, kept for safety

  // ── Ultra Rare = Full Art (V FA, EX FA, SV Full Art ex) ───────────────────
  // TCGdex confirmed: "Ultra Rare" for Full Art V (swsh1-195), Full Art EX (xy1-145),
  // and some SV Full Art ex (sv01-230)
  "Ultra Rare":                                   TOPAZ,

  // Old assumed strings kept for safety
  "Rare Ultra":                                   TOPAZ,
  "Rare Rainbow":                                 TOPAZ,
  "Rare ACE":                                     TOPAZ,
  "Classic Collection":                           TOPAZ,

  // ── Secret Rare = VMAX/VSTAR/GX Full Arts, Gold Secret Rare ───────────────
  // TCGdex confirmed: "Secret Rare" for VMAX FA (swsh4-189), VSTAR FA (swsh10-196),
  // GX Full Art (sm1-150)
  "Secret Rare":                                  FIRE_OPAL,

  // Old/alternate strings
  "Rare Secret":                                  FIRE_OPAL,
  "Hyper Rare":                                   FIRE_OPAL,
  "Rare Shining":                                 FIRE_OPAL,
  "Rare Shiny":                                   FIRE_OPAL,
  "Rare Shiny GX":                                FIRE_OPAL,
  "Amazing Rare":                                 FIRE_OPAL,

  // ── Illustration / Special Illustration / Trainer Gallery / Radiant ────────
  "Illustration Rare":                            DIAMOND,
  "Special Illustration Rare":                    DIAMOND,
  "Trainer Gallery Rare Holo":                    DIAMOND,
  "Radiant Rare":                                 DIAMOND,

  // ── Pokémon TCG Pocket (diamond / star / crown system) ────────────────────
  "◇":                                            GREY,
  "◇◇":                                           AQUA,
  "◇◇◇":                                          JADE,
  "◇◇◇◇":                                         AMETHYST,
  "☆":                                            TOPAZ,
  "☆☆":                                           FIRE_OPAL,
  "☆☆☆":                                          DIAMOND,
  "♛":                                            DIAMOND,
};

export function getRarityColor(rarity: string | undefined, game: "yugioh" | "pokemon"): string {
  if (!rarity) return GREY;
  const map = game === "yugioh" ? YGO_RARITY_COLORS : PKM_RARITY_COLORS;
  return map[rarity] ?? GREY;
}

// ─── Pokémon rarity sort tier ────────────────────────────────────────────────
const PKM_RARITY_TIER: Record<string, number> = {
  "None":                           0,
  "Common":                         1,
  "Promo":                          1,
  "◇":                              1,
  "Uncommon":                       2,
  "◇◇":                             2,
  "Rare":                           3,
  "◇◇◇":                            3,
  "Rare Holo":                      4,
  "Holo Rare V":                    4,
  "Holo Rare VMAX":                 4,
  "Holo Rare VSTAR":                4,
  "Holo Rare GX":                   4,
  "Holo Rare EX":                   4,
  "Rare Holo EX":                   4,
  "Rare Holo GX":                   4,
  "Rare Holo V":                    4,
  "Rare Holo VMAX":                 4,
  "Rare Holo VSTAR":                4,
  "Rare Holo LV.X":                 4,
  "Rare Prime":                     4,
  "Rare LEGEND":                    4,
  "◇◇◇◇":                           4,
  "Rare BREAK":                     5,
  "Rare Holo Prism Star":           5,
  "Rare Prism Star":                5,
  "ACE SPEC Rare":                  5,
  "Double rare":                    6,
  "Double Rare":                    6,
  "Ultra Rare":                     6,
  "Rare Ultra":                     6,
  "Rare Rainbow":                   6,
  "Rare ACE":                       6,
  "Classic Collection":             6,
  "☆":                              6,
  "Secret Rare":                    7,
  "Rare Secret":                    7,
  "Hyper Rare":                     7,
  "Rare Shining":                   7,
  "Rare Shiny":                     7,
  "Rare Shiny GX":                  7,
  "Amazing Rare":                   7,
  "☆☆":                             7,
  "Radiant Rare":                   8,
  "Trainer Gallery Rare Holo":      8,
  "Illustration Rare":              8,
  "Special Illustration Rare":      9,
  "☆☆☆":                            9,
  "♛":                              10,
};

export function getPokemonRarityTier(rarity: string): number {
  return PKM_RARITY_TIER[rarity] ?? 99;
}
