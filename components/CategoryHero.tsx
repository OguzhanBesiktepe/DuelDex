// CategoryHero — decorative three-card (or three-pack) image cluster shown at the top of
// each category page (Monsters, Spells, Traps, Sets) on all screen sizes.
// Two variants: "cards" uses absolute positioning for a fanned-out look;
// "packs" uses a flex row aligned to the bottom for a stacked-pack look.
// Each image can optionally carry an href that wraps it in a Link.

import Link from "next/link";
import styles from "./HeroSection.module.css";

interface HeroImage {
  src: string;
  alt: string;
  href?: string;
}

interface CategoryHeroProps {
  images: [HeroImage, HeroImage, HeroImage];
  variant?: "cards" | "packs";
  centerWidth?: number;
  sideWidth?: number;
  containerWidth?: number;
  containerHeight?: number;
  packHeight?: number;
}

// Renders a Link when href is provided, otherwise a plain div.
// Spreads className/style onto whichever element is rendered.
function Wrap({
  href,
  className,
  style,
  children,
}: {
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
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

  // Desktop pack dimensions
  const packW = Math.round(packHeight * 0.5);
  const sideH = Math.round(packHeight * 0.8);
  const sideW = Math.round(sideH * 0.5);

  // Mobile pack dimensions (~55% of desktop)
  const mPackH = Math.round(packHeight * 0.55);
  const mPackW = Math.round(mPackH * 0.5);
  const mSideH = Math.round(mPackH * 0.8);
  const mSideW = Math.round(mSideH * 0.5);

  if (variant === "packs") {
    return (
      <>
        {/* Mobile packs */}
        <div className="flex items-end gap-2 shrink-0 md:hidden">
          <Wrap href={left.href} className={styles.hwPackSide} style={{ width: mSideW, height: mSideH, overflow: "hidden", borderRadius: 10, boxShadow: "0 12px 28px rgba(0,0,0,0.65)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={left.src} alt={left.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </Wrap>
          <Wrap href={center.href} className={styles.hwPackCenter} style={{ width: mPackW, height: mPackH, overflow: "hidden", borderRadius: 10, boxShadow: "0 18px 40px rgba(0,0,0,0.72)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={center.src} alt={center.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </Wrap>
          <Wrap href={right.href} className={styles.hwPackSide} style={{ width: mSideW, height: mSideH, overflow: "hidden", borderRadius: 10, boxShadow: "0 12px 28px rgba(0,0,0,0.65)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={right.src} alt={right.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </Wrap>
        </div>

        {/* Desktop packs */}
        <div className="hidden md:flex items-end gap-4 shrink-0">
          <Wrap href={left.href} className={styles.hwPackSide} style={{ width: sideW, height: sideH, overflow: "hidden", borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={left.src} alt={left.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </Wrap>
          <Wrap href={center.href} className={styles.hwPackCenter} style={{ width: packW, height: packHeight, overflow: "hidden", borderRadius: 12, boxShadow: "0 36px 64px rgba(0,0,0,0.72)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={center.src} alt={center.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </Wrap>
          <Wrap href={right.href} className={styles.hwPackSide} style={{ width: sideW, height: sideH, overflow: "hidden", borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={right.src} alt={right.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </Wrap>
        </div>
      </>
    );
  }

  // Mobile card sizes — compact fan beside the heading
  const mCenterW = 85;
  const mSideCardW = 65;

  return (
    <>
      {/* Mobile — compact three-card fan beside the heading */}
      <div className="relative md:hidden shrink-0" style={{ width: 175, height: 170 }}>
        <Wrap href={left.href} className={styles.catMobileFanLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={left.src}
            alt={left.alt}
            className={`${styles.card} ${styles.cardSide}`}
            style={{ width: mSideCardW, height: "auto", boxShadow: "0 12px 24px rgba(0,0,0,0.65)" }}
          />
        </Wrap>
        <Wrap href={center.href} className={styles.catMobileFanCenter}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={center.src}
            alt={center.alt}
            className={`${styles.card} ${styles.cardCenter}`}
            style={{ width: mCenterW, height: "auto", boxShadow: "0 18px 36px rgba(0,0,0,0.72)" }}
          />
        </Wrap>
        <Wrap href={right.href} className={styles.catMobileFanRight}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={right.src}
            alt={right.alt}
            className={`${styles.card} ${styles.cardSide}`}
            style={{ width: mSideCardW, height: "auto", boxShadow: "0 12px 24px rgba(0,0,0,0.65)" }}
          />
        </Wrap>
      </div>

      {/* Desktop — full-size three-card fan */}
      <div
        className="relative hidden shrink-0 md:block"
        style={{ width: containerWidth, height: containerHeight }}
      >
        <Wrap href={left.href} className={styles.hwLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={left.src}
            alt={left.alt}
            className={`${styles.card} ${styles.cardSide}`}
            style={{ width: sideWidth, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}
          />
        </Wrap>
        <Wrap href={center.href} className={styles.hwCenter}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={center.src}
            alt={center.alt}
            className={`${styles.card} ${styles.cardCenter}`}
            style={{ width: centerWidth, height: "auto", boxShadow: "0 36px 64px rgba(0,0,0,0.72)" }}
          />
        </Wrap>
        <Wrap href={right.href} className={styles.hwRight}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={right.src}
            alt={right.alt}
            className={`${styles.card} ${styles.cardSide}`}
            style={{ width: sideWidth, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}
          />
        </Wrap>
      </div>
    </>
  );
}
