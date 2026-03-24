// Pokémon card detail page — fetches a single card by its TCGdex ID (e.g. "swsh1-1")
// and displays full card info: image, HP, stage, attacks, weaknesses, and set details.
// TCGdex has no TCGPlayer pricing so the only buy option shown is an eBay search link.

import { fetchPokemonCardById, getBestTcgPrice, getTcgPlayerProductId, getLegendHalf } from "@/lib/pokemon";
import { notFound } from "next/navigation";
import CardImageZoom from "@/components/CardImageZoom";
import BackButton from "@/components/BackButton";
import CardActions from "@/components/CardActions";

export default async function PokemonCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const card = await fetchPokemonCardById(id);
  if (!card) notFound();

  const imageUrl = card.image ? `${card.image}/high.webp` : "";
  const images = imageUrl ? [{ url: imageUrl, id: 0 }] : [];
  const legendHalf = await getLegendHalf(card);
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + (legendHalf ? ` ${legendHalf}` : "") + " pokemon card")}`;
  const tcgProductId = getTcgPlayerProductId(card);
  const tcgSearchName = legendHalf ? `${card.name} ${legendHalf}` : card.name;
  const tcgPlayerUrl = tcgProductId
    ? `https://www.tcgplayer.com/product/${tcgProductId}`
    : `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(tcgSearchName)}`;
  const tcgPrice = getBestTcgPrice(card);

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        {/* Back */}
        <BackButton
          label={
            from === "/"
              ? "Back to Home"
              : from?.includes("/pokemon/trainer")
                ? "Back to Trainers"
                : from?.includes("/pokemon/energy")
                  ? "Back to Energy Cards"
                  : "Back to Pokémon"
          }
          href={from ? decodeURIComponent(from) : "/pokemon/pokemon"}
        />

        <div className="flex flex-col md:flex-row gap-8">
          {/* Card image */}
          {images.length > 0 && (
            <div className="shrink-0 mx-auto md:mx-0 flex flex-col items-center gap-4">
              <CardImageZoom images={images} alt={card.name} />
              {tcgPrice && (
                <p className="text-lg font-bold" style={{ color: "#3ecf6a" }}>
                  ${tcgPrice.toFixed(2)} <span className="text-xs font-normal" style={{ color: "#7A8BA8" }}>TCGPlayer market</span>
                </p>
              )}
              <a
                href={tcgPlayerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-85"
                style={{ background: "#00AAFF", color: "#080B14" }}
              >
                Buy on TCGPlayer ↗
              </a>
              <a
                href={ebayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-85"
                style={{ background: "#F5AF02", color: "#080B14" }}
              >
                Buy on eBay ↗
              </a>
              {/* Favorite + Add to List buttons — only visible when signed in */}
              <CardActions
                cardId={card.id}
                cardName={card.name}
                cardImage={card.image ? `${card.image}/low.webp` : ""}
                game="pokemon"
                price={tcgPrice ?? 0}
              />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl font-bold mb-1 flex items-center gap-3 flex-wrap"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              {card.name}
              {legendHalf && (
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "#FFD70022", color: "#FFD700", border: "1px solid #FFD70066" }}
                >
                  {legendHalf}
                </span>
              )}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {card.category && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: "#00AAFF22",
                    color: "#00AAFF",
                    border: "1px solid #00AAFF44",
                  }}
                >
                  {card.category}
                </span>
              )}
              {card.rarity && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "#1A2035", color: "#7A8BA8" }}
                >
                  {card.rarity}
                </span>
              )}
              {card.types?.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "#1A2035", color: "#7A8BA8" }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* HP + Stage */}
            <div className="flex gap-4 mb-4">
              {card.hp && (
                <div>
                  <p className="text-xs" style={{ color: "#7A8BA8" }}>
                    HP
                  </p>
                  <p className="text-lg font-bold" style={{ color: "#CC1F1F" }}>
                    {card.hp}
                  </p>
                </div>
              )}
              {card.stage && (
                <div>
                  <p className="text-xs" style={{ color: "#7A8BA8" }}>
                    Stage
                  </p>
                  <p className="text-lg font-bold" style={{ color: "#F0F2FF" }}>
                    {card.stage}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {card.description && (
              <p
                className="text-sm leading-relaxed mb-6 italic"
                style={{ color: "#7A8BA8" }}
              >
                {card.description}
              </p>
            )}

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <div className="mb-6">
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#7A8BA8" }}
                >
                  Attacks
                </p>
                <div className="flex flex-col gap-2">
                  {card.attacks.map((atk, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded"
                      style={{
                        background: "#0E1220",
                        border: "1px solid #1A2035",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "#F0F2FF" }}
                        >
                          {atk.name}
                        </span>
                        {atk.damage && (
                          <span
                            className="text-sm font-bold"
                            style={{ color: "#CC1F1F" }}
                          >
                            {atk.damage}
                          </span>
                        )}
                      </div>
                      {atk.effect && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#7A8BA8" }}
                        >
                          {atk.effect}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Set */}
            {card.set && (
              <div
                className="rounded-xl p-4"
                style={{ background: "#0E1220", border: "1px solid #1A2035" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "#7A8BA8" }}
                >
                  Set
                </p>
                <p className="text-sm" style={{ color: "#F0F2FF" }}>
                  {card.set.name}
                </p>
              </div>
            )}

            {/* TCGPlayer pricing breakdown */}
            {card.pricing?.tcgplayer && Object.keys(card.pricing.tcgplayer).length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "#0E1220", border: "1px solid #1A2035" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "#7A8BA8" }}
                >
                  TCGPlayer Prices
                </p>
                <div className="flex flex-col gap-2">
                  {Object.entries(card.pricing.tcgplayer).map(([variant, data]) => {
                    if (!data) return null;
                    const label = variant
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={variant} className="flex items-center justify-between">
                        <span className="text-xs capitalize" style={{ color: "#7A8BA8" }}>
                          {label}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          {data.lowPrice != null && (
                            <span style={{ color: "#7A8BA8" }}>
                              Low <span style={{ color: "#F0F2FF" }}>${data.lowPrice.toFixed(2)}</span>
                            </span>
                          )}
                          {data.marketPrice != null && (
                            <span style={{ color: "#7A8BA8" }}>
                              Market <span className="font-bold" style={{ color: "#3ecf6a" }}>${data.marketPrice.toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
