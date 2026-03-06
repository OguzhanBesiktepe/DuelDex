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
