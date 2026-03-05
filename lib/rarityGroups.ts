// Rarity filter groups — maps a display label to the actual rarity strings from the API

export interface RarityGroup {
  label: string;
  color: string;
  yugioh: string[];
  pokemon: string[];
}

export const RARITY_GROUPS: RarityGroup[] = [
  {
    label: "Common",
    color: "#6B7280",
    yugioh: ["Common", "Short Print", "Normal Parallel Rare"],
    pokemon: ["Common", "None"],
  },
  {
    label: "Rare",
    color: "#2DD4BF",
    yugioh: ["Rare", "Duel Terminal Normal Parallel Rare"],
    pokemon: ["Uncommon", "Rare"],
  },
  {
    label: "Super Rare",
    color: "#4ADE80",
    yugioh: ["Super Rare", "Super Short Print", "Duel Terminal Super Parallel Rare"],
    pokemon: ["Rare Holo", "Rare Holo EX", "Rare Holo GX", "Rare Holo V", "Rare Holo VMAX", "Rare Holo VSTAR"],
  },
  {
    label: "Ultra Rare",
    color: "#C084FC",
    yugioh: ["Ultra Rare", "Ultra Rare (Pharaoh's Rare)", "Duel Terminal Ultra Parallel Rare"],
    pokemon: ["Rare Ultra", "Rare Rainbow", "Double Rare", "Rare ACE"],
  },
  {
    label: "Secret Rare",
    color: "#FCD34D",
    yugioh: ["Secret Rare", "Prismatic Secret Rare", "Extra Secret Rare"],
    pokemon: ["Rare Secret", "Hyper Rare", "Rare Shining", "Amazing Rare"],
  },
  {
    label: "Ultimate / Ghost",
    color: "#FB923C",
    yugioh: ["Ultimate Rare", "Ghost Rare", "Collector's Rare", "Ghost/Gold Rare"],
    pokemon: ["Illustration Rare", "Trainer Gallery Rare Holo"],
  },
  {
    label: "Starlight",
    color: "#E879F9",
    yugioh: ["Starlight Rare", "Platinum Secret Rare"],
    pokemon: ["Special Illustration Rare", "Radiant Rare"],
  },
];

export function getRarityStrings(groupLabel: string, game: "yugioh" | "pokemon"): string[] {
  const group = RARITY_GROUPS.find((g) => g.label === groupLabel);
  if (!group) return [];
  return game === "yugioh" ? group.yugioh : group.pokemon;
}
