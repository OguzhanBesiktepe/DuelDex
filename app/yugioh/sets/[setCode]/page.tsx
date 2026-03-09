import { fetchYGOSets, fetchYGOCardsBySet } from "@/lib/yugioh";
import CardGrid from "@/components/CardGrid";
import BackButton from "@/components/BackButton";
import { notFound } from "next/navigation";

export default async function YGOSetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ setCode: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { setCode } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const perPage = 24;

  const allSets = await fetchYGOSets();
  const set = allSets.find((s) => s.set_code === decodeURIComponent(setCode));
  if (!set) notFound();

  const { cards, total } = await fetchYGOCardsBySet(
    set.set_name,
    perPage,
    (page - 1) * perPage,
  );
  const totalPages = Math.ceil(total / perPage);

  const mapped = cards.map((c) => {
    const setPrices = (c.card_sets ?? [])
      .filter((s) => s.set_name === set.set_name)
      .map((s) => parseFloat(s.set_price))
      .filter((p) => !isNaN(p) && p > 0);
    return {
      id: String(c.id),
      name: c.name,
      imageUrl:
        c.card_images[0]?.image_url ?? c.card_images[0]?.image_url_small ?? "",
      type: c.race,
      rarity: c.card_sets?.find((s) => s.set_name === set.set_name)?.set_rarity,
      price: c.card_prices?.[0]?.tcgplayer_price,
      ebayPrice: c.card_prices?.[0]?.ebay_price,
      minPrice: setPrices.length > 0 ? Math.min(...setPrices) : undefined,
      maxPrice: setPrices.length > 0 ? Math.max(...setPrices) : undefined,
    };
  });

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <BackButton label="Back to All Sets" href="/yugioh/sets" />

        {/* Set header */}
        <div
          className="flex flex-col sm:flex-row gap-6 mt-4 mb-8 p-5 rounded-xl"
          style={{ background: "#0E1220", border: "1px solid #1A2035" }}
        >
          {set.set_image && (
            <div
              className="shrink-0 self-center sm:self-start rounded-lg overflow-hidden"
              style={{ width: 60, height: 112 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={set.set_image}
                alt={set.set_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                  display: "block",
                }}
              />
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#FF7A00" }}
            >
              Yu-Gi-Oh!
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              {set.set_name}
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <span
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{
                  background: "#FF7A0015",
                  color: "#FF7A00",
                  border: "1px solid #FF7A0030",
                }}
              >
                {set.set_code}
              </span>
              <span className="text-sm" style={{ color: "#7A8BA8" }}>
                {set.num_of_cards} cards
              </span>
              {set.tcg_date && (
                <span className="text-sm" style={{ color: "#7A8BA8" }}>
                  Released{" "}
                  {new Date(set.tcg_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <CardGrid cards={mapped} game="yugioh" />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <a
                href={`?page=${page - 1}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  background: "#0E1220",
                  color: "#F0F2FF",
                  border: "1px solid #1A2035",
                }}
              >
                Previous
              </a>
            )}
            <span className="text-sm" style={{ color: "#7A8BA8" }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`?page=${page + 1}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  background: "#0E1220",
                  color: "#F0F2FF",
                  border: "1px solid #1A2035",
                }}
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
