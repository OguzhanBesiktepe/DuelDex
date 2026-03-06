// Colors derived from actual Yu-Gi-Oh card frame colors.
// Priority for mixed types (e.g. "Pendulum Effect Fusion Monster"):
// Fusion > Synchro > XYZ > Link > Ritual > Pendulum > Effect > Normal

export function getYGOTypeColor(type: string): string {
  if (!type) return "#7A8BA8";
  if (type.includes("Fusion"))   return "#A040C0"; // purple
  if (type.includes("Synchro"))  return "#C0C0C0"; // silver/white
  if (type.includes("XYZ"))      return "#8B8B9E"; // dark slate (card is black)
  if (type.includes("Link"))     return "#1A88E8"; // bright blue
  if (type.includes("Ritual"))   return "#6699CC"; // soft blue
  if (type.includes("Pendulum")) return "#28ABA1"; // teal
  if (type.includes("Flip"))     return "#CC6611"; // orange-brown (treated as effect)
  if (type.includes("Effect"))   return "#CC6611"; // orange-brown
  if (type.includes("Normal"))   return "#C8A84B"; // tan/beige
  if (type === "Spell Card")     return "#1DA86A"; // green
  if (type === "Trap Card")      return "#C02898"; // pink/magenta
  return "#7A8BA8";
}

// Colors for the 25 Yu-Gi-Oh monster races (shown as the sub-type badge).
const RACE_COLORS: Record<string, string> = {
  "Dragon":        "#E04040", // crimson red
  "Spellcaster":   "#9B59B6", // violet
  "Warrior":       "#7090C0", // steel blue
  "Zombie":        "#7AB050", // sickly green
  "Machine":       "#8FA8B8", // steel gray-blue
  "Fiend":         "#CC2244", // dark crimson
  "Fairy":         "#D4A840", // warm gold
  "Beast":         "#A0784A", // earthy brown
  "Beast-Warrior": "#CC7722", // burnt orange
  "Aqua":          "#2299CC", // ocean blue
  "Insect":        "#88AA33", // olive green
  "Plant":         "#33BB66", // bright green
  "Rock":          "#9A8870", // stone gray-brown
  "Thunder":       "#DDC000", // electric yellow
  "Pyro":          "#DD5500", // fire orange
  "Fish":          "#33AABB", // sea teal
  "Sea Serpent":   "#2288AA", // deep teal
  "Reptile":       "#558833", // earthy green
  "Dinosaur":      "#7A9930", // moss green
  "Winged Beast":  "#5599DD", // sky blue
  "Psychic":       "#DD55AA", // hot pink
  "Cyberse":       "#00BBCC", // bright cyan
  "Divine-Beast":  "#FFD700", // gold
  "Creator God":   "#FFD700", // gold
  "Wyrm":          "#44AABB", // blue-teal
};

export function getYGORaceColor(race: string): string {
  return RACE_COLORS[race] ?? "#7A8BA8";
}
