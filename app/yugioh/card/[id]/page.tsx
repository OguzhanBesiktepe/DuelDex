import Link from "next/link";
import { fetchYGOCardById } from "@/lib/yugioh";
import { notFound } from "next/navigation";
import CardImageZoom from "@/components/CardImageZoom";

export default async function YGOCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await fetchYGOCardById(id);
  if (!card) notFound();

  const image = card.card_images[0]?.image_url ?? "";
  const price = card.card_prices?.[0];
  const sets = card.card_sets ?? [];
  const hasTCG = price && parseFloat(price.tcgplayer_price) > 0;
  const hasEbay = price && parseFloat(price.ebay_price) > 0;
  const tcgPlayerUrl = `https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(card.name)}`;
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + " yugioh")}`;

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/yugioh/monsters"
          className="text-sm mb-6 inline-block"
          style={{ color: "#7A8BA8" }}
        >
          &larr; Back to Monster Cards
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Card image */}
          <div className="shrink-0 mx-auto md:mx-0 flex flex-col items-center gap-4">
            <CardImageZoom src={image} alt={card.name} />
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
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: "#FF7A0022",
                  color: "#FF7A00",
                  border: "1px solid #FF7A0044",
                }}
              >
                {card.type}
              </span>
              {card.race && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "#1A2035", color: "#7A8BA8" }}
                >
                  {card.race}
                </span>
              )}
              {card.attribute && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "#1A2035", color: "#7A8BA8" }}
                >
                  {card.attribute}
                </span>
              )}
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
                      {card.atk}
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
                      {card.def}
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

            {/* Prices */}
            {price && (
              <div
                className="rounded-xl p-4 mb-6"
                style={{ background: "#0E1220", border: "1px solid #1A2035" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "#7A8BA8" }}
                >
                  Market Prices
                </p>
                <div className="flex flex-wrap gap-4">
                  {parseFloat(price.tcgplayer_price) > 0 && (
                    <div>
                      <p className="text-xs" style={{ color: "#7A8BA8" }}>
                        TCGPlayer
                      </p>
                      <p
                        className="text-xl font-bold"
                        style={{ color: "#3ecf6a" }}
                      >
                        ${parseFloat(price.tcgplayer_price).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {parseFloat(price.ebay_price) > 0 && (
                    <div>
                      <p className="text-xs" style={{ color: "#7A8BA8" }}>
                        eBay
                      </p>
                      <p
                        className="text-xl font-bold"
                        style={{ color: "#F0F2FF" }}
                      >
                        ${parseFloat(price.ebay_price).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {parseFloat(price.cardmarket_price) > 0 && (
                    <div>
                      <p className="text-xs" style={{ color: "#7A8BA8" }}>
                        Cardmarket
                      </p>
                      <p
                        className="text-xl font-bold"
                        style={{ color: "#F0F2FF" }}
                      >
                        ${parseFloat(price.cardmarket_price).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sets */}
            {sets.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#7A8BA8" }}
                >
                  Printings ({sets.length})
                </p>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {sets.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded"
                      style={{
                        background: "#0E1220",
                        border: "1px solid #1A2035",
                      }}
                    >
                      <span style={{ color: "#F0F2FF" }}>{s.set_name}</span>
                      <div className="flex gap-3">
                        <span style={{ color: "#7A8BA8" }}>{s.set_rarity}</span>
                        {parseFloat(s.set_price) > 0 && (
                          <span style={{ color: "#3ecf6a" }}>
                            ${parseFloat(s.set_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
