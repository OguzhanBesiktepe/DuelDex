import Image from "next/image";
import Link from "next/link";
import { fetchPokemonCardById } from "@/lib/pokemon";
import { notFound } from "next/navigation";

export default async function PokemonCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await fetchPokemonCardById(id);
  if (!card) notFound();

  const imageUrl = card.image ? `${card.image}/high.webp` : "";

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/pokemon/pokemon"
          className="text-sm mb-6 inline-block"
          style={{ color: "#7A8BA8" }}
        >
          &larr; Back to Pokémon
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Card image */}
          {imageUrl && (
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="relative w-60 aspect-[3/4] rounded-xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={card.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              {card.name}
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
                  <p className="text-xs" style={{ color: "#7A8BA8" }}>HP</p>
                  <p className="text-lg font-bold" style={{ color: "#CC1F1F" }}>
                    {card.hp}
                  </p>
                </div>
              )}
              {card.stage && (
                <div>
                  <p className="text-xs" style={{ color: "#7A8BA8" }}>Stage</p>
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
                      style={{ background: "#0E1220", border: "1px solid #1A2035" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: "#F0F2FF" }}>
                          {atk.name}
                        </span>
                        {atk.damage && (
                          <span className="text-sm font-bold" style={{ color: "#CC1F1F" }}>
                            {atk.damage}
                          </span>
                        )}
                      </div>
                      {atk.effect && (
                        <p className="text-xs mt-1" style={{ color: "#7A8BA8" }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
