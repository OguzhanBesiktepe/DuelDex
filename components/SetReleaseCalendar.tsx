// SetReleaseCalendar — server component that fetches upcoming set release dates
// for Yu-Gi-Oh! (TCG + OCG) and Pokémon (TCG only — TCGdex covers English sets).
// Each set row shows a representative image, release dates, a countdown badge,
// and pre-order links for TCGPlayer, Cardmarket, and Amazon.


interface BuyLink {
  href: string;
  logo: string;
  alt: string;
  background: string;
  logoHeight?: number;
}

interface UpcomingSet {
  name: string;
  code: string;
  tcgDate: string | null;
  ocgDate: string | null;
  cardCount: number;
  image?: string;
  buyLinks: BuyLink[];
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ygoPreorderLinks(setName: string): BuyLink[] {
  return [
    {
      href: `https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(setName)}`,
      logo: "/logos/TCGplayer_Logo.svg.png",
      alt: "TCGPlayer",
      background: "#00AAFF",
    },
    {
      href: `https://www.cardmarket.com/en/YuGiOh/Products/Sealed-Products?searchString=${encodeURIComponent(setName)}`,
      logo: "/logos/cardmarket.png",
      alt: "Cardmarket",
      background: "#FFFFFF",
    },
    {
      href: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(setName + " yugioh sealed")}`,
      logo: "/logos/ebay.png",
      alt: "eBay",
      background: "#F0F0F0",
      logoHeight: 30,
    },
  ];
}

function pkmnPreorderLinks(setName: string): BuyLink[] {
  return [
    {
      href: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(setName)}`,
      logo: "/logos/TCGplayer_Logo.svg.png",
      alt: "TCGPlayer",
      background: "#00AAFF",
    },
    {
      href: `https://www.cardmarket.com/en/Pokemon/Products/Sealed-Products?searchString=${encodeURIComponent(setName)}`,
      logo: "/logos/cardmarket.png",
      alt: "Cardmarket",
      background: "#FFFFFF",
    },
    {
      href: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(setName + " pokemon booster box")}`,
      logo: "/logos/ebay.png",
      alt: "eBay",
      background: "#F0F0F0",
      logoHeight: 30,
    },
  ];
}

async function fetchYGOSetImage(setName: string): Promise<string | null> {
  try {
    // First attempt: fetch a card from the set directly
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(setName)}&num=1`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      const url = data.data?.[0]?.card_images?.[0]?.image_url_small;
      if (url) return url;
    }

    // Second attempt: keyword search using the set name — works for announced-but-unreleased sets
    // that may have preview cards listed without full set metadata
    const firstWord = setName.split(" ")[0];
    const res2 = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(firstWord)}&num=1`,
      { next: { revalidate: 86400 } }
    );
    if (res2.ok) {
      const data2 = await res2.json();
      const url2 = data2.data?.[0]?.card_images?.[0]?.image_url_small;
      if (url2) return url2;
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchUpcomingYGO(): Promise<UpcomingSet[]> {
  try {
    const res = await fetch("https://db.ygoprodeck.com/api/v7/cardsets.php", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const sets: {
      set_name: string;
      set_code: string;
      num_of_cards: number;
      tcg_date: string;
      ocg_date?: string;
    }[] = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 180);

    const upcoming = sets
      .filter((s) => {
        const tcgDate = s.tcg_date ? new Date(s.tcg_date) : null;
        const ocgDate = s.ocg_date ? new Date(s.ocg_date) : null;
        const tcgFuture = tcgDate && tcgDate >= today && tcgDate <= cutoff;
        const ocgFuture = ocgDate && ocgDate >= today && ocgDate <= cutoff;
        return tcgFuture || ocgFuture;
      })
      .map((s) => ({
        name: s.set_name,
        code: s.set_code,
        tcgDate: s.tcg_date && new Date(s.tcg_date) >= today ? s.tcg_date : null,
        ocgDate: s.ocg_date && new Date(s.ocg_date) >= today ? s.ocg_date : null,
        cardCount: s.num_of_cards,
        buyLinks: ygoPreorderLinks(s.set_name),
      }))
      .sort((a, b) => {
        const aDate = a.tcgDate ?? a.ocgDate ?? "";
        const bDate = b.tcgDate ?? b.ocgDate ?? "";
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      })
      .slice(0, 5);

    const images = await Promise.all(upcoming.map((s) => fetchYGOSetImage(s.name)));
    return upcoming.map((s, i) => ({ ...s, image: images[i] ?? undefined }));
  } catch {
    return [];
  }
}

async function fetchUpcomingPokemon(): Promise<UpcomingSet[]> {
  try {
    const res = await fetch("https://api.tcgdex.net/v2/en/sets", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const sets: {
      id: string;
      name: string;
      releaseDate?: string;
      logo?: string;
      cardCount?: { total: number };
    }[] = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 180);

    return sets
      .filter((s) => {
        if (!s.releaseDate) return false;
        const date = new Date(s.releaseDate.replace(/\//g, "-"));
        return date >= today && date <= cutoff;
      })
      .map((s) => ({
        name: s.name,
        code: s.id,
        tcgDate: s.releaseDate!.replace(/\//g, "-"),
        ocgDate: null,
        cardCount: s.cardCount?.total ?? 0,
        image: s.logo ? `${s.logo}.png` : undefined,
        buyLinks: pkmnPreorderLinks(s.name),
      }))
      .sort((a, b) => new Date(a.tcgDate!).getTime() - new Date(b.tcgDate!).getTime())
      .slice(0, 5);
  } catch {
    return [];
  }
}

function DaysBadge({ dateStr, accentColor }: { dateStr: string; accentColor: string }) {
  const days = daysUntil(dateStr);
  const label = days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days}d`;
  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0"
      style={{ background: `${accentColor}18`, color: accentColor }}
    >
      {label}
    </span>
  );
}

function SetRow({
  set,
  accentColor,
  imageStyle,
}: {
  set: UpcomingSet;
  accentColor: string;
  imageStyle: "card" | "logo";
}) {
  const soonestDate = set.tcgDate ?? set.ocgDate;

  return (
    <div
      className="flex flex-col gap-2 py-3 border-b last:border-b-0"
      style={{ borderColor: "#1A2035" }}
    >
      {/* Top row: image + info + badge */}
      <div className="flex items-center gap-3">
        {/* Set image */}
        {set.image ? (
          imageStyle === "card" ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={set.image}
              alt={set.name}
              style={{ height: 60, width: "auto", maxWidth: 44, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={set.image}
              alt={set.name}
              style={{ height: 36, width: "auto", maxWidth: 90, objectFit: "contain", flexShrink: 0 }}
            />
          )
        ) : (
          <div
            style={{
              width: 44,
              height: 60,
              borderRadius: 4,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
              border: `1px solid ${accentColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: `${accentColor}70`,
            }}
          >
            ?
          </div>
        )}

        {/* Name + dates */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#F0F2FF" }}>
            {set.name}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {set.tcgDate && (
              <p className="text-xs" style={{ color: "#7A8BA8" }}>
                TCG · {formatDate(set.tcgDate)}
              </p>
            )}
            {set.ocgDate && (
              <p className="text-xs" style={{ color: "#7A8BA8" }}>
                OCG · {formatDate(set.ocgDate)}
              </p>
            )}
            {set.cardCount > 0 && (
              <p className="text-xs" style={{ color: "#7A8BA8" }}>
                {set.cardCount} cards
              </p>
            )}
          </div>
        </div>

        {soonestDate && <DaysBadge dateStr={soonestDate} accentColor={accentColor} />}
      </div>

      {/* Pre-order buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs" style={{ color: "#7A8BA8" }}>Pre-order:</span>
        <div className="flex gap-2">
          {set.buyLinks.map((link) => (
            <a
              key={link.alt}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={`Pre-order on ${link.alt}`}
              className="flex flex-1 items-center justify-center py-2.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: link.background }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.logo}
                alt={link.alt}
                style={{ height: link.logoHeight ?? 20, width: "auto", objectFit: "contain" }}
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SetReleaseCalendar() {
  const [ygoSets, pkmnSets] = await Promise.all([
    fetchUpcomingYGO(),
    fetchUpcomingPokemon(),
  ]);

  if (ygoSets.length === 0 && pkmnSets.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-4 py-10">
      <p
        className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
        style={{ color: "#7A8BA8" }}
      >
        Upcoming Releases
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ygoSets.length > 0 && (
          <div
            className="rounded-xl border p-5 flex flex-col gap-1"
            style={{ background: "#0E1220", borderColor: "#1A2035" }}
          >
            <span
              className="self-start text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
              style={{ background: "#FF7A0020", color: "#FF7A00", border: "1px solid #FF7A0040" }}
            >
              Yu-Gi-Oh!
            </span>
            {ygoSets.map((set) => (
              <SetRow key={set.code} set={set} accentColor="#FF7A00" imageStyle="card" />
            ))}
          </div>
        )}

        {pkmnSets.length > 0 && (
          <div
            className="rounded-xl border p-5 flex flex-col gap-1"
            style={{ background: "#0E1220", borderColor: "#1A2035" }}
          >
            <span
              className="self-start text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
              style={{ background: "#00AAFF20", color: "#00AAFF", border: "1px solid #00AAFF40" }}
            >
              Pokémon TCG
            </span>
            {pkmnSets.map((set) => (
              <SetRow key={set.code} set={set} accentColor="#00AAFF" imageStyle="logo" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
