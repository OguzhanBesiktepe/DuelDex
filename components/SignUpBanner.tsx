"use client";

// SignUpBanner — homepage marketing section shown only to signed-out users.
// Lives below PriceMovers: users get hooked by real content first, then see the pitch.

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  {
    icon: "♥",
    iconColor: "#CC1F1F",
    title: "Favorite Cards",
    description:
      "Save any card from either game and watch its price update automatically every day.",
  },
  {
    icon: "📋",
    iconColor: "#FF7A00",
    title: "Custom Lists",
    description:
      "Build watchlists by deck, set, or strategy. Add specific printings, not just card names.",
  },
  {
    icon: "📊",
    iconColor: "#3ecf6a",
    title: "Portfolio Analytics",
    description:
      "Interactive charts show your collection's value over time — timeline and per-card breakdown.",
  },
  {
    icon: "💰",
    iconColor: "#FFD700",
    title: "Price Tracking",
    description:
      "See exactly what you paid vs. what it's worth now. Export to PNG or CSV at any time.",
  },
];

export default function SignUpBanner() {
  const { user, loading } = useAuth();

  // Don't flash the section then hide it — wait for auth to resolve
  if (loading || user) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16"
      style={{ borderTop: "1px solid #1A2035" }}
    >
      {/* Heading */}
      <div className="text-center mb-10">
        <p
          className="text-xs font-bold uppercase tracking-[0.25em] mb-3"
          style={{ color: "#FF7A00" }}
        >
          Free Account
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}
        >
          Know What Your Collection Is Worth
        </h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#7A8BA8" }}>
          Track prices across Yu-Gi-Oh! and Pokémon, build lists, and see your
          portfolio's performance — all in one place.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border p-5 flex flex-col gap-3"
            style={{ background: "#0E1220", borderColor: "#1A2035" }}
          >
            <span
              className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ background: `${f.iconColor}18` }}
            >
              {f.icon}
            </span>
            <div>
              <p
                className="text-sm font-bold mb-1"
                style={{ color: "#F0F2FF" }}
              >
                {f.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#7A8BA8" }}>
                {f.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/signin"
          className="rounded-lg px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "#FF7A00", color: "#080B14" }}
        >
          Get Started Free →
        </Link>
        <p className="text-xs" style={{ color: "#7A8BA8" }}>
          No credit card required. Sign in with Google or email.
        </p>
      </div>
    </section>
  );
}
