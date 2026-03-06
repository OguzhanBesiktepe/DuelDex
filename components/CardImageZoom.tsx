"use client";

import { useState, useEffect, useCallback } from "react";

interface CardImageZoomProps {
  images: { url: string; id: number }[];
  alt: string;
  width?: number;
}

export default function CardImageZoom({
  images,
  alt,
  width = 240,
}: CardImageZoomProps) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const total = images.length;
  const src = images[index]?.url ?? "";

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total],
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  // Keyboard: Escape to close, arrows to cycle arts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Card + art switcher */}
      <div className="detail-float-wrapper flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="detail-card-img rounded-xl"
          style={{
            width,
            height: "auto",
            boxShadow: "0 28px 56px rgba(0,0,0,0.7)",
            cursor: "zoom-in",
          }}
          onClick={() => setOpen(true)}
        />

        {/* Art switcher — only shown when multiple arts exist */}
        {total > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
              style={{
                background: "#0E1220",
                border: "1px solid #1A2035",
                color: "#7A8BA8",
              }}
              aria-label="Previous artwork"
            >
              ‹
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === index ? 18 : 6,
                    height: 6,
                    background: i === index ? "#FF7A00" : "#1A2035",
                  }}
                  aria-label={`Art ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
              style={{
                background: "#0E1220",
                border: "1px solid #1A2035",
                color: "#7A8BA8",
              }}
              aria-label="Next artwork"
            >
              ›
            </button>
          </div>
        )}

        {total > 1 && (
          <p className="text-xs" style={{ color: "#7A8BA8" }}>
            Art {index + 1} of {total}
          </p>
        )}
      </div>

      {/* Lightbox */}
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

          {/* Prev arrow in lightbox */}
          {total > 1 && (
            <button
              className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{
                background: "#0E1220",
                border: "1px solid #1A2035",
                color: "#F0F2FF",
              }}
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous artwork"
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${alt} — Art ${index + 1}`}
            className="rounded-2xl"
            style={{
              maxHeight: "88vh",
              maxWidth: "80vw",
              width: "auto",
              boxShadow: "0 48px 96px rgba(0,0,0,0.85)",
              cursor: "zoom-out",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />

          {/* Next arrow in lightbox */}
          {total > 1 && (
            <button
              className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{
                background: "#0E1220",
                border: "1px solid #1A2035",
                color: "#F0F2FF",
              }}
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next artwork"
            >
              ›
            </button>
          )}

          {total > 1 && (
            <p
              className="absolute bottom-6 text-xs"
              style={{ color: "#7A8BA8" }}
            >
              Art {index + 1} of {total} — use ← → keys to navigate
            </p>
          )}
        </div>
      )}
    </>
  );
}
