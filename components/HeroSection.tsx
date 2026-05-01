// HeroSection — full-width hero banner shown on the homepage.
// Displays a randomly selected featured set (alternating between YGO and Pokémon each load)
// with its name, a "Browse This Set" CTA, and three staggered floating card images.
// The accent colour is extracted from the card art using node-vibrant.

import Link from "next/link";
import styles from "./HeroSection.module.css";

export type FeaturedSet = {
  gameLabel: string;
  setName: string;
  cardImages: { url: string; href?: string }[];
  setHref: string;
  accentColor: string;
  accentRgb: string;
};

function Wrap({ href, className, children }: { href?: string; className?: string; children: React.ReactNode }) {
  if (href) return <Link href={href} className={className}>{children}</Link>;
  return <div className={className}>{children}</div>;
}

export default function HeroSection({ featured }: { featured: FeaturedSet }) {
  const leftImg  = featured.cardImages[0] ?? null;
  const centerImg = featured.cardImages[1] ?? featured.cardImages[0] ?? null;
  const rightImg = featured.cardImages[2] ?? null;

  return (
    <section
      className="relative w-full overflow-hidden min-h-[500px] sm:min-h-[580px]"
      style={{ background: "var(--background)" }}
    >
      {/* Subtle radial bloom — background only */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 90% at 68% 50%, rgba(${featured.accentRgb}, 0.09) 0%, transparent 70%)`,
        }}
      />

      {/* Content row */}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-10 text-center md:flex-row md:gap-16 md:px-8 md:py-0 md:text-left" style={{ minHeight: 580 }}>
        {/* Left — text */}
        <div className="flex-1 md:items-start">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: featured.accentColor }}
          >
            {featured.gameLabel}
          </p>

          <h1
            className="mb-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
            style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}
          >
            {featured.setName}
          </h1>

          <p
            className="mb-8 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Featured Set
          </p>

          <Link
            href={featured.setHref}
            className="inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm font-bold transition-opacity hover:opacity-85"
            style={{ background: featured.accentColor, color: "var(--background)" }}
          >
            Browse This Set →
          </Link>
        </div>

        {/* Mobile — three-card fan */}
        <div className="relative md:hidden" style={{ height: 200, marginTop: "2rem", width: "100%" }}>
          {leftImg && (
            <Wrap href={leftImg.href} className={styles.mobileFanLeft}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={leftImg.url} alt={featured.setName} className={`${styles.card} ${styles.cardSide}`} style={{ width: 110, height: "auto", boxShadow: "0 16px 32px rgba(0,0,0,0.65)" }} />
            </Wrap>
          )}
          {centerImg && (
            <Wrap href={centerImg.href} className={styles.mobileFanCenter}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={centerImg.url} alt={featured.setName} className={`${styles.card} ${styles.cardCenter}`} style={{ width: 140, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.72)" }} />
            </Wrap>
          )}
          {rightImg && (
            <Wrap href={rightImg.href} className={styles.mobileFanRight}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rightImg.url} alt={featured.setName} className={`${styles.card} ${styles.cardSide}`} style={{ width: 110, height: "auto", boxShadow: "0 16px 32px rgba(0,0,0,0.65)" }} />
            </Wrap>
          )}
        </div>

        {/* Desktop — three staggered floating cards */}
        <div className="relative hidden shrink-0 md:block" style={{ width: 560, height: 500 }}>
          {leftImg && (
            <Wrap href={leftImg.href} className={styles.hwLeft}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={leftImg.url} alt={featured.setName} className={`${styles.card} ${styles.cardSide}`} style={{ width: 230, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }} />
            </Wrap>
          )}
          {centerImg && (
            <Wrap href={centerImg.href} className={styles.hwCenter}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={centerImg.url} alt={featured.setName} className={`${styles.card} ${styles.cardCenter}`} style={{ width: 270, height: "auto", boxShadow: "0 36px 64px rgba(0,0,0,0.72)" }} />
            </Wrap>
          )}
          {rightImg && (
            <Wrap href={rightImg.href} className={styles.hwRight}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rightImg.url} alt={featured.setName} className={`${styles.card} ${styles.cardSide}`} style={{ width: 230, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }} />
            </Wrap>
          )}
        </div>
      </div>
    </section>
  );
}
