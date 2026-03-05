import { NextRequest, NextResponse } from "next/server";

const YGO_BASE = "https://db.ygoprodeck.com/api/v7/cardinfo.php";
const PKM_BASE = "https://api.tcgdex.net/v2/en/cards";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const words = normalize(q).split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return NextResponse.json([]);

  const [ygoRes, pkmnRes] = await Promise.allSettled([
    fetch(`${YGO_BASE}?fname=${encodeURIComponent(q)}&num=12&offset=0`).then((r) => r.json()),
    fetch(`${PKM_BASE}?filters[name]=${encodeURIComponent(q)}&pagination[page]=1&pagination[itemsPerPage]=5`).then((r) => r.json()),
  ]);

  const results = [];

  if (ygoRes.status === "fulfilled" && Array.isArray(ygoRes.value?.data)) {
    const ygoCards = ygoRes.value.data
      .filter((c: { name: string }) => words.every((w) => normalize(c.name).includes(w)))
      .slice(0, 5)
      .map((c: { id: number; name: string; card_images: { image_url_small: string }[] }) => ({
        id: String(c.id),
        name: c.name,
        image: c.card_images?.[0]?.image_url_small ?? "",
        game: "yugioh",
        href: `/yugioh/card/${c.id}`,
      }));
    results.push(...ygoCards);
  }

  if (pkmnRes.status === "fulfilled" && Array.isArray(pkmnRes.value)) {
    const pkmnCards = pkmnRes.value
      .slice(0, 3)
      .map((c: { id: string; name: string; image?: string }) => ({
        id: c.id,
        name: c.name,
        image: c.image ? `${c.image}/low.webp` : "",
        game: "pokemon",
        href: `/pokemon/card/${c.id}`,
      }));
    results.push(...pkmnCards);
  }

  return NextResponse.json(results);
}
