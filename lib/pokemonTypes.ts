// Pokémon TCG energy types, evolution stages, and trainer subtypes.
// Used by filter components on the Pokémon and Trainer pages.

export const POKEMON_ENERGY_TYPES = [
  { label: "Fire",       value: "Fire",       color: "#FF5722", emoji: "🔥" },
  { label: "Water",      value: "Water",      color: "#2196F3", emoji: "💧" },
  { label: "Grass",      value: "Grass",      color: "#4CAF50", emoji: "🌿" },
  { label: "Lightning",  value: "Lightning",  color: "#FFC107", emoji: "⚡" },
  { label: "Psychic",    value: "Psychic",    color: "#AB47BC", emoji: "🔮" },
  { label: "Fighting",   value: "Fighting",   color: "#A0522D", emoji: "👊" },
  { label: "Darkness",   value: "Darkness",   color: "#7E57C2", emoji: "🌑" },
  { label: "Metal",      value: "Metal",      color: "#90A4AE", emoji: "⚙️" },
  { label: "Dragon",     value: "Dragon",     color: "#5C6BC0", emoji: "🐉" },
  { label: "Fairy",      value: "Fairy",      color: "#EC407A", emoji: "✨" },
  { label: "Colorless",  value: "Colorless",  color: "#9E9E9E", emoji: "⭐" },
];

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
];

export const TRAINER_SUBTYPES = [
  { label: "Item",      value: "Item",      color: "#FF7A00" },
  { label: "Supporter", value: "Supporter", color: "#00AAFF" },
  { label: "Stadium",   value: "Stadium",   color: "#3ecf6a" },
  { label: "Tool",      value: "Tool",      color: "#AB47BC" },
];
