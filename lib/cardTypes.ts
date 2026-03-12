// Sub-type options used by TypeFilter for Spell and Trap card pages.
// Values correspond to the `race` field returned by the YGOPRODeck API for non-monster cards.

export const SPELL_TYPES = [
  { label: "Normal", value: "Normal" },
  { label: "Quick-Play", value: "Quick-Play" },
  { label: "Continuous", value: "Continuous" },
  { label: "Equip", value: "Equip" },
  { label: "Field", value: "Field" },
  { label: "Ritual", value: "Ritual" },
];

export const TRAP_TYPES = [
  { label: "Normal", value: "Normal" },
  { label: "Continuous", value: "Continuous" },
  { label: "Counter", value: "Counter" },
];
