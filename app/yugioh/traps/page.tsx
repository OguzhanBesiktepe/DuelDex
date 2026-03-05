import CardGrid from "@/components/CardGrid";
import { fetchYGOCards } from "@/lib/yugioh";

export const dynamic = "force-dynamic";

export default async function TrapsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const perPage = 24;
  const offset = (page - 1) * perPage;

  const { cards, total } = await fetchYGOCards("Trap Card", perPage, offset);
  const totalPages = Math.ceil(total / perPage);

  const mapped = cards.map((c) => ({
    id: String(c.id),
    name: c.name,
    imageUrl: c.card_images[0]?.image_url_small ?? c.card_images[0]?.image_url ?? "",
    type: c.race,
    rarity: c.card_sets?.[0]?.set_rarity,
    price: c.card_prices?.[0]?.tcgplayer_price,
    ebayPrice: c.card_prices?.[0]?.ebay_price,
  }));

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
          >
            Trap Cards
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
            Yu-Gi-Oh! &mdash; {total.toLocaleString()} cards
          </p>
        </div>

        <CardGrid cards={mapped} game="yugioh" />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <a
                href={`?page=${page - 1}`}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
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
                style={{ background: "#0E1220", color: "#F0F2FF", border: "1px solid #1A2035" }}
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
