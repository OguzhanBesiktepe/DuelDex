// Pokémon TCG energy types, evolution stages, and trainer subtypes.
// Used by filter components on the Pokémon and Trainer pages.

export const POKEMON_ENERGY_TYPES = [
  { label: "Fire",       value: "Fire",       color: "#FF4422", emoji: "🔥" }, // red-orange (fire energy card)
  { label: "Water",      value: "Water",      color: "#38BDF8", emoji: "💧" }, // sky blue (water energy card)
  { label: "Grass",      value: "Grass",      color: "#4ADE80", emoji: "🌿" }, // bright green (grass energy card)
  { label: "Lightning",  value: "Lightning",  color: "#FBBF24", emoji: "⚡" }, // electric yellow (lightning energy card)
  { label: "Psychic",    value: "Psychic",    color: "#D946EF", emoji: "🔮" }, // vivid magenta (psychic energy card)
  { label: "Fighting",   value: "Fighting",   color: "#C2410C", emoji: "👊" }, // burnt orange-brown (fighting energy card)
  { label: "Darkness",   value: "Darkness",   color: "#7C3AED", emoji: "🌑" }, // deep violet (darkness energy card)
  { label: "Steel",      value: "Metal",      color: "#94A3B8", emoji: "⚙️" }, // silver-steel (metal energy card) — stored as "Metal" in TCGdex
  { label: "Dragon",     value: "Dragon",     color: "#818CF8", emoji: "🐉" }, // indigo-blue (dragon energy card)
  { label: "Fairy",      value: "Fairy",      color: "#F472B6", emoji: "✨" }, // hot pink (fairy energy card)
  { label: "Colorless",  value: "Colorless",  color: "#A8A29E", emoji: "⭐" }, // warm grey (colorless energy card)
];

// Lookup by TCGdex `types` field value → display color.
// Falls back to muted slate for unknown/missing types.
const TYPE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  POKEMON_ENERGY_TYPES.map((t) => [t.value, t.color])
);

export function getPokemonTypeColor(type: string | undefined): string {
  if (!type) return "#7A8BA8";
  return TYPE_COLOR_MAP[type] ?? "#7A8BA8";
}

export const POKEMON_STAGES = [
  { label: "Basic",   value: "Basic" },
  { label: "Stage 1", value: "Stage1" },
  { label: "Stage 2", value: "Stage2" },
  { label: "V",       value: "V" },
  { label: "VMAX",    value: "VMAX" },
  { label: "VSTAR",   value: "VSTAR" },
  { label: "ex",      value: "ex" },
  { label: "GX",      value: "GX" },
  { label: "EX",      value: "EX" },
  { label: "LV.X",    value: "LEVEL-UP" },
];

export const TRAINER_SUBTYPES = [
  { label: "Item",      value: "Item",      color: "#FF7A00" },
  { label: "Supporter", value: "Supporter", color: "#00AAFF" },
  { label: "Stadium",   value: "Stadium",   color: "#3ecf6a" },
  { label: "Tool",      value: "Tool",      color: "#AB47BC" },
];
