// CategoryHero — decorative three-card (or three-pack) image cluster shown at the top of
// each category page (Monsters, Spells, Traps, Sets) on tablet and larger screens.
// Two variants: "cards" uses absolute positioning for a fanned-out look;
// "packs" uses a flex row aligned to the bottom for a stacked-pack look.

import styles from "./HeroSection.module.css";

interface CategoryHeroProps {
  images: [
    { src: string; alt: string },
    { src: string; alt: string },
    { src: string; alt: string },
  ];
  /** "cards" uses the original absolute-positioned layout sized by width.
   *  "packs" uses a flex row sized by height so it hugs the images naturally. */
  variant?: "cards" | "packs";
  centerWidth?: number;
  sideWidth?: number;
  containerWidth?: number;
  containerHeight?: number;
  /** Pack variant: height to constrain images to */
  packHeight?: number;
}

export default function CategoryHero({
  images,
  variant = "cards",
  centerWidth = 270,
  sideWidth = 230,
  containerWidth = 560,
  containerHeight = 500,
  packHeight = 280,
}: CategoryHeroProps) {
  const [left, center, right] = images;

  // Pack art is stored as a 550×550 square; we crop it to portrait proportions via overflow:hidden.
  // packW is the center column width; side images are 80% of the center height.
  const packW = Math.round(packHeight * 0.5);
  const sideH = Math.round(packHeight * 0.8);
  const sideW = Math.round(sideH * 0.5);

  if (variant === "packs") {
    return (
      // On mobile: scale the whole cluster to ~62% and anchor to the right edge
      // so it sits neatly beside the page heading without overflowing.
      <div className="shrink-0 scale-[0.62] origin-right md:scale-100">
      <div className="flex items-end gap-4 shrink-0">
        {/* Left */}
        <div
          className={styles.hwPackSide}
          style={{
            width: sideW,
            height: sideH,
            overflow: "hidden",
            borderRadius: 12,
            boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={left.src}
            alt={left.alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        </div>

        {/* Center */}
        <div
          className={styles.hwPackCenter}
          style={{
            width: packW,
            height: packHeight,
            overflow: "hidden",
            borderRadius: 12,
            boxShadow: "0 36px 64px rgba(0,0,0,0.72)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={center.src}
            alt={center.alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        </div>

        {/* Right */}
        <div
          className={styles.hwPackSide}
          style={{
            width: sideW,
            height: sideH,
            overflow: "hidden",
            borderRadius: 12,
            boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={right.src}
            alt={right.alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        </div>
      </div>
      </div>
    );
  }

  return (
    <div
      className="relative hidden shrink-0 md:block"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Left */}
      <div className={styles.hwLeft}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={left.src}
          alt={left.alt}
          className={`${styles.card} ${styles.cardSide}`}
          style={{
            width: sideWidth,
            height: "auto",
            boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
          }}
        />
      </div>

      {/* Center */}
      <div className={styles.hwCenter}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={center.src}
          alt={center.alt}
          className={`${styles.card} ${styles.cardCenter}`}
          style={{
            width: centerWidth,
            height: "auto",
            boxShadow: "0 36px 64px rgba(0,0,0,0.72)",
          }}
        />
      </div>

      {/* Right */}
      <div className={styles.hwRight}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={right.src}
          alt={right.alt}
          className={`${styles.card} ${styles.cardSide}`}
          style={{
            width: sideWidth,
            height: "auto",
            boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
          }}
        />
      </div>
    </div>
  );
}
