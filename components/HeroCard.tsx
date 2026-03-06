"use client";

import { useState, useEffect } from "react";
import styles from "./HeroSection.module.css";

type Variant = "left" | "center" | "right";

interface HeroCardProps {
  src: string;
  alt: string;
  variant: Variant;
  width: number;
  boxShadow: string;
}

const WRAPPER: Record<Variant, string> = {
  left: styles.hwLeft,
  center: styles.hwCenter,
  right: styles.hwRight,
};

const IMG_CLASS: Record<Variant, string> = {
  left: `${styles.card} ${styles.cardSide}`,
  center: `${styles.card} ${styles.cardCenter}`,
  right: `${styles.card} ${styles.cardSide}`,
};

export default function HeroCard({
  src,
  alt,
  variant,
  width,
  boxShadow,
}: HeroCardProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className={WRAPPER[variant]}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={IMG_CLASS[variant]}
          style={{ width, height: "auto", boxShadow, cursor: "zoom-in" }}
          onClick={() => setOpen(true)}
        />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{
            background: "rgba(8, 11, 20, 0.92)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-5 right-5 text-2xl leading-none"
            style={{ color: "#7A8BA8" }}
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="rounded-2xl"
            style={{
              maxHeight: "88vh",
              maxWidth: "90vw",
              width: "auto",
              boxShadow: "0 48px 96px rgba(0,0,0,0.85)",
              cursor: "zoom-out",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
        </div>
      )}
    </>
  );
}
