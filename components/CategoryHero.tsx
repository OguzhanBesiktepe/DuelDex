import styles from "./HeroSection.module.css";

interface CategoryHeroProps {
  images: [
    { src: string; alt: string },
    { src: string; alt: string },
    { src: string; alt: string },
  ];
}

export default function CategoryHero({ images }: CategoryHeroProps) {
  const [left, center, right] = images;

  return (
    <div className="relative hidden shrink-0 md:block" style={{ width: 560, height: 500 }}>
      {/* Left */}
      <div className={styles.hwLeft}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={left.src}
          alt={left.alt}
          className={`${styles.card} ${styles.cardSide}`}
          style={{ width: 230, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}
        />
      </div>

      {/* Center */}
      <div className={styles.hwCenter}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={center.src}
          alt={center.alt}
          className={`${styles.card} ${styles.cardCenter}`}
          style={{ width: 270, height: "auto", boxShadow: "0 36px 64px rgba(0,0,0,0.72)" }}
        />
      </div>

      {/* Right */}
      <div className={styles.hwRight}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={right.src}
          alt={right.alt}
          className={`${styles.card} ${styles.cardSide}`}
          style={{ width: 230, height: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}
        />
      </div>
    </div>
  );
}
