// CardGrid — renders a responsive grid of CardItem tiles.
// Accepts normalized card data so it works for both YGO and Pokémon.
// Shows an empty-state message when no cards match the current filters.

import CardItem from "./CardItem";

interface CardData {
  id: string;
  name: string;
  imageUrl: string;
  type?: string;
  rarity?: string;
  price?: string;
  ebayPrice?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface CardGridProps {
  cards: CardData[];
  game: "yugioh" | "pokemon";
  from?: string;
}

export default function CardGrid({ cards, game, from }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-24 text-sm"
        style={{ color: "#7A8BA8" }}
      >
        No cards found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {cards.map((card) => (
        <CardItem key={card.id} {...card} game={game} from={from} />
      ))}
    </div>
  );
}
