// YGO card detail page — fetches the card by numeric ID and builds an artwork list that
// includes all alternate art images. Also renders pricing, printings, and user action buttons.

import { fetchYGOCardById, fetchYGOCardAltArts, ygoImage } from "@/lib/yugioh";
import BackButton from "@/components/BackButton";
import { notFound } from "next/navigation";
import CardImageZoom from "@/components/CardImageZoom";
import PrintingsPanel from "@/components/PrintingsPanel";
import CardActions from "@/components/CardActions";
import { getYGOTypeColor, getYGORaceColor } from "@/lib/typeColors";

export default async function YGOCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const card = await fetchYGOCardById(id);
  if (!card) notFound();

  // Build artwork list:
  // name= returns the canonical card record with ALL card_images variants listed.
  // id= only returns limited image data. So we prefer the name= version's card_images.
  const altArts = await fetchYGOCardAltArts(card.name);
  const selfInAltArts = altArts.find((c) => c.id === card.id);
  const otherAltArts = altArts.filter((c) => c.id !== card.id);
  const rawImages = [
    // Use name= version of this card if available — it has the full card_images list
    ...(selfInAltArts ?? card).card_images.map((img) => ({
      url: ygoImage(img.id),
      id: img.id,
    })),
    // Also include images from any separate alt-art card records
    ...otherAltArts.flatMap((c) =>
      c.card_images.map((img) => ({ url: ygoImage(img.id), id: img.id })),
    ),
  ];
  // Deduplicate by image id and remove empty URLs
  const seen = new Set<number>();
  const images = rawImages.filter((img) => {
    if (!img.url || seen.has(img.id)) return false;
    seen.add(img.id);
    return true;
  });
  const ATTRIBUTE_COLORS: Record<string, string> = {
    LIGHT: "#FFD700",
    DARK: "#9B6BFF",
    WATER: "#00AAFF",
    FIRE: "#FF4422",
    EARTH: "#A0784A",
    WIND: "#44CC88",
    DIVINE: "#FFB347",
  };

  const price = card.card_prices?.[0];
  const sets = card.card_sets ?? [];
  const hasTCG = price && parseFloat(price.tcgplayer_price) > 0;
  const hasEbay = price && parseFloat(price.ebay_price) > 0;
  // Buy links use search queries rather than direct product IDs so they always find results
  const tcgPlayerUrl = `https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(card.name)}`;
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + " yugioh")}`;

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        {/* Back */}
        {/* Derive a context-aware back label from the `from` query param */}
        <BackButton
          label={from === "/" ? "Back to Home" : from === "/favorites" ? "Back to Favorites" : from?.startsWith("/lists/") ? "Back to List" : from?.startsWith("/search") ? "Back to Search Results" : from?.startsWith("/yugioh/sets/") ? "Back to Set" : card.type.includes("Spell") ? "Back to Spell Cards" : card.type.includes("Trap") ? "Back to Trap Cards" : "Back to Monster Cards"}
          href={from ? decodeURIComponent(from) : card.type.includes("Spell") ? "/yugioh/spells" : card.type.includes("Trap") ? "/yugioh/traps" : "/yugioh/monsters"}
        />

        <div className="flex flex-col md:flex-row gap-8">
          {/* Card image */}
          <div className="shrink-0 mx-auto md:mx-0 flex flex-col items-center gap-4">
            <CardImageZoom images={images} alt={card.name} />
            {hasTCG && (
              <a
                href={tcgPlayerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-85"
                style={{ background: "#FF7A00", color: "#080B14" }}
              >
                Buy on TCGPlayer ↗
              </a>
            )}
            {!hasTCG && hasEbay && (
              <a
                href={ebayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-85"
                style={{ background: "#F5AF02", color: "#080B14" }}
              >
                Buy on eBay ↗
              </a>
            )}
            {/* Favorite + Add to List buttons — only visible when signed in */}
            <CardActions
              cardId={String(card.id)}
              cardName={card.name}
              cardImage={card.card_images[0]?.id ? ygoImage(card.card_images[0].id, true) : ""}
              game="yugioh"
              price={parseFloat(price?.tcgplayer_price ?? "0")}
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              {card.name}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {(() => {
                const typeColor = getYGOTypeColor(card.type);
                return (
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${typeColor}22`,
                      color: typeColor,
                      border: `1px solid ${typeColor}44`,
                    }}
                  >
                    {card.type}
                  </span>
                );
              })()}
              {card.race && (() => {
                const raceColor = getYGORaceColor(card.race);
                return (
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${raceColor}22`,
                      color: raceColor,
                      border: `1px solid ${raceColor}44`,
                    }}
                  >
                    {card.race}
                  </span>
                );
              })()}
              {card.attribute && (() => {
                const attrColor = ATTRIBUTE_COLORS[card.attribute] ?? "#7A8BA8";
                return (
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${attrColor}22`,
                      color: attrColor,
                      border: `1px solid ${attrColor}44`,
                    }}
                  >
                    {card.attribute}
                  </span>
                );
              })()}
            </div>

            {/* Stats */}
            {(card.atk !== undefined ||
              card.def !== undefined ||
              card.level !== undefined) && (
              <div className="flex gap-4 mb-4">
                {card.level !== undefined && (
                  <div>
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>
                      Level
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#FFD700" }}
                    >
                      {card.level}
                    </p>
                  </div>
                )}
                {card.atk !== undefined && (
                  <div>
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>
                      ATK
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#F0F2FF" }}
                    >
                      {/* YGOPRODeck returns -1 for Link Monsters that have no DEF */}
                      {card.atk === -1 ? "?" : card.atk}
                    </p>
                  </div>
                )}
                {card.def !== undefined && (
                  <div>
                    <p className="text-xs" style={{ color: "#7A8BA8" }}>
                      DEF
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#F0F2FF" }}
                    >
                      {card.def === -1 ? "?" : card.def}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: "#7A8BA8" }}
            >
              {card.desc}
            </p>

            <PrintingsPanel
              sets={sets}
              price={price ?? null}
              cardName={card.name}
              cardId={String(card.id)}
              cardImage={card.card_images[0]?.id ? ygoImage(card.card_images[0].id, true) : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
