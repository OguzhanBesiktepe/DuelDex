"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const ygoLinks = [
  { href: "/yugioh/monsters", label: "Monster Cards", icon: "⚔️" },
  { href: "/yugioh/spells", label: "Spell Cards", icon: "✨" },
  { href: "/yugioh/traps", label: "Trap Cards", icon: "🪤" },
  { href: "/yugioh/sets", label: "Browse All Sets", icon: "📦" },
];

const pokemonLinks = [
  { href: "/pokemon/pokemon", label: "Pokémon", icon: "⚡" },
  { href: "/pokemon/trainer", label: "Trainer Cards", icon: "🎴" },
  { href: "/pokemon/energy", label: "Energy Cards", icon: "⚪" },
  { href: "/pokemon/sets", label: "Browse All Sets", icon: "📦" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ygoOpen, setYgoOpen] = useState(false);
  const [pkmnOpen, setPkmnOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{ background: "#0E1220", borderColor: "#1A2035" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/Logo.png"
            alt="DuelDex"
            width={160}
            height={52}
            className="object-contain"
            priority
            unoptimized
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center gap-2 md:flex">
          {/* Yu-Gi-Oh! dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setYgoOpen(true)}
            onMouseLeave={() => setYgoOpen(false)}
          >
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition hover:text-white">
              Yu-Gi-Oh! <span className="text-xs">▾</span>
            </button>
            {ygoOpen && (
              <div
                className="absolute left-0 top-full w-52 rounded-lg border py-1 shadow-xl"
                style={{ background: "#0E1220", borderColor: "#1A2035" }}
              >
                {ygoLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pokémon dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setPkmnOpen(true)}
            onMouseLeave={() => setPkmnOpen(false)}
          >
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition hover:text-white">
              Pokémon <span className="text-xs">▾</span>
            </button>
            {pkmnOpen && (
              <div
                className="absolute left-0 top-full w-52 rounded-lg border py-1 shadow-xl"
                style={{ background: "#0E1220", borderColor: "#1A2035" }}
              >
                {pokemonLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div
            className="ml-2 flex flex-1 items-center rounded-md border px-3 py-2"
            style={{ borderColor: "#1A2035", background: "#080B14" }}
          >
            <span className="mr-2 text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Search cards..."
              className="flex-1 bg-transparent text-sm text-gray-300 outline-none placeholder:text-gray-600"
            />
          </div>

          {/* Sign In */}
          <button
            className="ml-2 shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ background: "#FF7A00", color: "#080B14" }}
          >
            Sign In
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="ml-auto text-gray-300 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="border-t px-4 pb-4 md:hidden"
          style={{ borderColor: "#1A2035" }}
        >
          <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Yu-Gi-Oh!
          </p>
          {ygoLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm text-gray-300"
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Pokémonsters
          </p>
          {pokemonLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm text-gray-300"
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <button
            className="mt-4 w-full rounded-md py-2 text-sm font-semibold"
            style={{ background: "#FF7A00", color: "#080B14" }}
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  );
}
