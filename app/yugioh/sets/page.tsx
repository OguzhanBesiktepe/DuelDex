import { fetchYGOSets } from "@/lib/yugioh";
import YGOSetsBrowser from "@/components/YGOSetsBrowser";
import CategoryHero from "@/components/CategoryHero";

// Patterns that identify niche/promo sets to exclude
const EXCLUDE_PATTERNS = [
  /promo/i,
  /\bleague\b/i,
  /tournament pack/i,
  /shonen jump/i,
  /world championship/i,
  /astral pack/i,
  /\bdemo\b/i,
  /sneak peek/i,
  /speed duel/i,
  /prize card/i,
  /championship series/i,
  /comic.?con/i,
  /subscription/i,
  /lost art promotion/i,
  /sweepstakes/i,
  /participation card/i,
  /battle pack/i,
  /\bvol\.\s*\d/i,
  /volume \d/i,
  /tag force/i,
  /hobby league/i,
  /pharaoh tour/i,
  /mattel/i,
  /make-a-wish/i,
  /kids wb/i,
  /duel master/i,
];

const MIN_CARDS = 24;

function isMajorSet(set: { set_name: string; num_of_cards: number; set_image: string }): boolean {
  return (
    !!set.set_image &&
    set.num_of_cards >= MIN_CARDS &&
    !EXCLUDE_PATTERNS.some((p) => p.test(set.set_name))
  );
}

const SETS_HERO_IMAGES: [
  { src: string; alt: string },
  { src: string; alt: string },
  { src: string; alt: string },
] = [
  { src: "/BACH.png", alt: "Battle of Chaos" },
  { src: "/LOB.png", alt: "Legend of Blue Eyes White Dragon" },
  { src: "/IOC.png", alt: "Invasion of Chaos" },
];

export default async function YGOSetsPage() {
  const allSets = await fetchYGOSets();
  const sets = allSets.filter(isMajorSet);

  return (
    <div style={{ background: "#080B14", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
            >
              Yu-Gi-Oh! Sets
            </h1>
            <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
              {sets.length} sets · Click any set to browse its cards
            </p>
          </div>
          <CategoryHero images={SETS_HERO_IMAGES} variant="packs" packHeight={300} />
        </div>

        <YGOSetsBrowser sets={sets} />
      </div>
    </div>
  );
}
