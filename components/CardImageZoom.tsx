"use client";

import { useState, useEffect } from "react";

interface CardImageZoomProps {
  src: string;
  alt: string;
  width?: number;
}

export default function CardImageZoom({ src, alt, width = 240 }: CardImageZoomProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Floating card */}
      <div className="detail-float-wrapper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="detail-card-img rounded-xl"
          style={{
            width,
            height: "auto",
            boxShadow: "0 28px 56px rgba(0,0,0,0.7)",
          }}
          onClick={() => setOpen(true)}
        />
      </div>

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(8, 11, 20, 0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-5 right-5 text-2xl leading-none"
            style={{ color: "#7A8BA8" }}
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Large card — stop click propagation so clicking card doesn't close */}
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
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
        </div>
      )}
    </>
  );
}
