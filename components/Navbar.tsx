"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  name: string;
  image: string;
  game: "yugioh" | "pokemon";
  href: string;
}

// Iconic card images used as category thumbnails in the dropdown
// YGO images are from YGOPRODeck (fine for dev; self-host on R2 for prod)
// Pokémon images are from TCGdex CDN (hotlinking is explicitly allowed)
const ygoLinks = [
  {
    href: "/yugioh/monsters",
    label: "Monster Cards",
    image: "https://images.ygoprodeck.com/images/cards_small/46986414.jpg", // Dark Magician
    hint: "Dark Magician",
  },
  {
    href: "/yugioh/spells",
    label: "Spell Cards",
    image: "https://images.ygoprodeck.com/images/cards_small/83764719.jpg", // Monster Reborn
    hint: "Monster Reborn",
  },
  {
    href: "/yugioh/traps",
    label: "Trap Cards",
    image: "https://images.ygoprodeck.com/images/cards_small/44095762.jpg", // Mirror Force
    hint: "Mirror Force",
  },
  {
    href: "/yugioh/sets",
    label: "Browse All Sets",
    image: "https://images.ygoprodeck.com/images/cards_small/89631139.jpg", // Blue-Eyes White Dragon
    hint: "Blue-Eyes White Dragon",
  },
];

const pokemonLinks = [
  {
    href: "/pokemon/pokemon",
    label: "Pokémon",
    image: "https://assets.tcgdex.net/en/base/base1/4/low.webp", // Charizard Base Set
    hint: "Charizard",
  },
  {
    href: "/pokemon/trainer",
    label: "Trainer Cards",
    image: "https://assets.tcgdex.net/en/base/base1/88/low.webp", // Professor Oak
    hint: "Professor Oak",
  },
  {
    href: "/pokemon/energy",
    label: "Energy Cards",
    image: "https://assets.tcgdex.net/en/base/base1/98/low.webp", // Fire Energy
    hint: "Fire Energy",
  },
  {
    href: "/pokemon/sets",
    label: "Browse All Sets",
    image: "https://assets.tcgdex.net/en/base/base1/58/low.webp", // Pikachu
    hint: "Pikachu",
  },
];

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ygoOpen, setYgoOpen] = useState(false);
  const [pkmnOpen, setPkmnOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
        const data: Suggestion[] = res.ok ? await res.json() : [];
        setSuggestions(data);
        setDropdownOpen(data.length > 0);
      } catch {
        setSuggestions([]);
        setDropdownOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <img
                      src={link.image}
                      alt={link.hint}
                      width={32}
                      height={45}
                      className="rounded object-cover shadow-md"
                      style={{ minWidth: 32 }}
                    />
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
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <img
                      src={link.image}
                      alt={link.hint}
                      width={32}
                      height={45}
                      className="rounded object-cover shadow-md"
                      style={{ minWidth: 32 }}
                    />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search bar + autocomplete */}
          <div ref={searchRef} className="ml-2 flex-1 relative">
            <form
              className="flex items-center rounded-md border px-3 py-2"
              style={{ borderColor: dropdownOpen && suggestions.length > 0 ? "#FF7A00" : "#1A2035", background: "#080B14" }}
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                if (q) {
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                  setSearchQuery("");
                  setDropdownOpen(false);
                }
              }}
            >
              <span className="mr-2 text-gray-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setDropdownOpen(false); }}
                placeholder="Search cards..."
                className="flex-1 bg-transparent text-sm text-gray-300 outline-none placeholder:text-gray-600"
                autoComplete="off"
              />
              {loading && (
                <span className="ml-2 text-xs animate-pulse" style={{ color: "#7A8BA8" }}>...</span>
              )}
            </form>

            {/* Autocomplete dropdown */}
            {dropdownOpen && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                style={{ background: "#0E1220", border: "1px solid #1A2035", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
              >
                {suggestions.map((s) => (
                  <Link
                    key={`${s.game}-${s.id}`}
                    href={s.href}
                    onClick={() => { setDropdownOpen(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-white/5"
                  >
                    {/* Card front thumbnail */}
                    {s.image && (
                      <img
                        src={s.image}
                        alt={s.name}
                        width={28}
                        height={39}
                        className="rounded shrink-0 object-contain"
                        style={{ width: 28, height: 39 }}
                      />
                    )}
                    {/* Card name */}
                    <span className="flex-1 text-sm truncate" style={{ color: "#F0F2FF" }}>{s.name}</span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setDropdownOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 text-xs text-left transition-colors hover:bg-white/5"
                  style={{ color: "#7A8BA8", borderTop: "1px solid #1A2035" }}
                >
                  See all results for &quot;{searchQuery}&quot; →
                </button>
              </div>
            )}
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
              className="flex items-center gap-3 py-2 text-sm text-gray-300"
            >
              <img
                src={link.image}
                alt={link.hint}
                width={28}
                height={39}
                className="rounded object-cover shadow-md"
                style={{ minWidth: 28 }}
              />
              {link.label}
            </Link>
          ))}
          <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Pokémon
          </p>
          {pokemonLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 py-2 text-sm text-gray-300"
            >
              <img
                src={link.image}
                alt={link.hint}
                width={28}
                height={39}
                className="rounded object-cover shadow-md"
                style={{ minWidth: 28 }}
              />
              {link.label}
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
