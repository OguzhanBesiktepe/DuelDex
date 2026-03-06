import Link from "next/link";
import styles from "./HeroSection.module.css";

export type FeaturedSet = {
  gameLabel: string;
  setName: string;
  cardImages: string[];
  setHref: string;
  accentColor: string;
  accentRgb: string;
};

export default function HeroSection({ featured }: { featured: FeaturedSet }) {
  const leftImg = featured.cardImages[0] ?? null;
  const centerImg = featured.cardImages[1] ?? featured.cardImages[0] ?? null;
  const rightImg = featured.cardImages[2] ?? null;

  return (
    <section
      className="relative w-full overflow-hidden min-h-[500px] sm:min-h-[580px]"
      style={{ background: "#080B14" }}
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
            style={{ color: "#F0F2FF", fontFamily: "Cinzel, serif" }}
          >
            {featured.setName}
          </h1>

          <p
            className="mb-8 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#7A8BA8" }}
          >
            Featured Set
          </p>

          <Link
            href={featured.setHref}
            className="inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm font-bold transition-opacity hover:opacity-85"
            style={{ background: featured.accentColor, color: "#080B14" }}
          >
            Browse This Set →
          </Link>
        </div>

        {/* Mobile — single centered card */}
        {centerImg && (
          <div className="mt-10 flex justify-center md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={centerImg}
              alt={featured.setName}
              className={styles.card}
              style={{
                width: 180,
                height: "auto",
                boxShadow: "0 24px 48px rgba(0,0,0,0.7)",
              }}
            />
          </div>
        )}

        {/* Desktop — three staggered floating cards */}
        <div className="relative hidden shrink-0 md:block" style={{ width: 560, height: 500 }}>
          {/* Left card */}
          {leftImg && (
            <div className={styles.hwLeft}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leftImg}
                alt={featured.setName}
                className={`${styles.card} ${styles.cardSide}`}
                style={{
                  width: 230,
                  height: "auto",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
                }}
              />
            </div>
          )}

          {/* Center card */}
          {centerImg && (
            <div className={styles.hwCenter}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={centerImg}
                alt={featured.setName}
                className={`${styles.card} ${styles.cardCenter}`}
                style={{
                  width: 270,
                  height: "auto",
                  boxShadow: "0 36px 64px rgba(0,0,0,0.72)",
                }}
              />
            </div>
          )}

          {/* Right card */}
          {rightImg && (
            <div className={styles.hwRight}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rightImg}
                alt={featured.setName}
                className={`${styles.card} ${styles.cardSide}`}
                style={{
                  width: 230,
                  height: "auto",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
