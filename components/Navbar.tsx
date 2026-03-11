"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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
    image: "/LOB.png",
    hint: "Legend of Blue Eyes White Dragon",
    crop: true,
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
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ygoOpen, setYgoOpen] = useState(false);
  const [pkmnOpen, setPkmnOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // Reset active index whenever the suggestion list changes
  useEffect(() => { setActiveIndex(-1); }, [suggestions]);

  // Keyboard navigation for the autocomplete dropdown
  // Indices 0..suggestions.length-1 are card results; suggestions.length is "See all results"
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, closeMobileMenu?: () => void) => {
      if (!dropdownOpen) return;
      const total = suggestions.length + 1; // +1 for "See all results"
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % total);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        if (activeIndex < suggestions.length) {
          router.push(suggestions[activeIndex].href);
        } else {
          router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
        setSearchQuery("");
        setDropdownOpen(false);
        setActiveIndex(-1);
        closeMobileMenu?.();
      } else if (e.key === "Escape") {
        setDropdownOpen(false);
        setActiveIndex(-1);
      }
    },
    [dropdownOpen, suggestions, activeIndex, router, searchQuery],
  );

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
            className="object-contain transition-all duration-200 hover:scale-105 hover:drop-shadow-[0_0_10px_rgba(255,122,0,0.5)]"
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
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-base font-semibold text-gray-100 transition hover:text-white">
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
                    {link.crop ? (
                      <div style={{ width: 32, height: 45, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                        <img
                          src={link.image}
                          alt={link.hint}
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                        />
                      </div>
                    ) : (
                      <img
                        src={link.image}
                        alt={link.hint}
                        width={32}
                        height={45}
                        className="rounded object-cover shadow-md"
                        style={{ minWidth: 32 }}
                      />
                    )}
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
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-base font-semibold text-gray-100 transition hover:text-white">
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
              style={{
                borderColor:
                  dropdownOpen && suggestions.length > 0
                    ? "#FF7A00"
                    : "#1A2035",
                background: "#080B14",
              }}
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
                onKeyDown={(e) => handleKeyDown(e)}
                placeholder="Search cards..."
                className="flex-1 bg-transparent text-sm text-gray-300 outline-none placeholder:text-gray-600"
                autoComplete="off"
              />
              {loading && (
                <span
                  className="ml-2 text-xs animate-pulse"
                  style={{ color: "#7A8BA8" }}
                >
                  ...
                </span>
              )}
            </form>

            {/* Autocomplete dropdown */}
            {dropdownOpen && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                style={{
                  background: "#0E1220",
                  border: "1px solid #1A2035",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                }}
              >
                {suggestions.map((s, i) => (
                  <Link
                    key={`${s.game}-${s.id}`}
                    href={s.href}
                    onClick={() => {
                      setDropdownOpen(false);
                      setSearchQuery("");
                      setActiveIndex(-1);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    className="flex items-center gap-3 px-3 py-2 transition-colors"
                    style={{ background: i === activeIndex ? "rgba(255,255,255,0.08)" : undefined }}
                  >
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
                    <span
                      className="flex-1 text-sm truncate"
                      style={{ color: "#F0F2FF" }}
                    >
                      {s.name}
                    </span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setDropdownOpen(false);
                    setSearchQuery("");
                    setActiveIndex(-1);
                  }}
                  onMouseEnter={() => setActiveIndex(suggestions.length)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  className="w-full px-4 py-2 text-xs text-left transition-colors"
                  style={{
                    color: "#7A8BA8",
                    borderTop: "1px solid #1A2035",
                    background: activeIndex === suggestions.length ? "rgba(255,255,255,0.08)" : undefined,
                  }}
                >
                  See all results for &quot;{searchQuery}&quot; →
                </button>
              </div>
            )}
          </div>

          {/* Auth button */}
          {user ? (
            <div ref={userMenuRef} className="relative ml-2 shrink-0">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border-2 p-0.5 transition hover:opacity-90"
                style={{ borderColor: "#FF7A00" }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    width={32}
                    height={32}
                    referrerPolicy="no-referrer"
                    className="rounded-full object-cover"
                    style={{ width: 32, height: 32 }}
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: "#FF7A00", color: "#080B14" }}
                  >
                    {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg border py-1 shadow-xl z-50"
                  style={{ background: "#0E1220", borderColor: "#1A2035" }}
                >
                  <p className="truncate px-4 py-2 text-xs" style={{ color: "#7A8BA8" }}>
                    {user.displayName ?? user.email}
                  </p>
                  <hr style={{ borderColor: "#1A2035" }} />
                  <Link
                    href="/favorites"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    ♥ My Favorites
                  </Link>
                  <button
                    onClick={() => { signOut(); setUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="ml-2 shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{ background: "#FF7A00", color: "#080B14" }}
            >
              Sign In
            </Link>
          )}
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
          {/* Mobile search */}
          <div ref={searchRef} className="relative mt-3 mb-1">
            <form
              className="flex items-center rounded-md border px-3 py-2"
              style={{
                borderColor: dropdownOpen && suggestions.length > 0 ? "#FF7A00" : "#1A2035",
                background: "#080B14",
              }}
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                if (q) {
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                  setSearchQuery("");
                  setDropdownOpen(false);
                  setMenuOpen(false);
                }
              }}
            >
              <span className="mr-2 text-gray-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, () => setMenuOpen(false))}
                placeholder="Search cards..."
                className="flex-1 bg-transparent text-sm text-gray-300 outline-none placeholder:text-gray-600"
                autoComplete="off"
              />
              {loading && (
                <span className="ml-2 text-xs animate-pulse" style={{ color: "#7A8BA8" }}>...</span>
              )}
            </form>
            {dropdownOpen && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                style={{ background: "#0E1220", border: "1px solid #1A2035", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
              >
                {suggestions.map((s, i) => (
                  <Link
                    key={`mobile-${s.game}-${s.id}`}
                    href={s.href}
                    onClick={() => { setDropdownOpen(false); setSearchQuery(""); setActiveIndex(-1); setMenuOpen(false); }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    className="flex items-center gap-3 px-3 py-2 transition-colors"
                    style={{ background: i === activeIndex ? "rgba(255,255,255,0.08)" : undefined }}
                  >
                    {s.image && (
                      <img src={s.image} alt={s.name} width={28} height={39} className="rounded shrink-0 object-contain" style={{ width: 28, height: 39 }} />
                    )}
                    <span className="flex-1 text-sm truncate" style={{ color: "#F0F2FF" }}>{s.name}</span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setDropdownOpen(false);
                    setSearchQuery("");
                    setActiveIndex(-1);
                    setMenuOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(suggestions.length)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  className="w-full px-4 py-2 text-xs text-left transition-colors"
                  style={{
                    color: "#7A8BA8",
                    borderTop: "1px solid #1A2035",
                    background: activeIndex === suggestions.length ? "rgba(255,255,255,0.08)" : undefined,
                  }}
                >
                  See all results for &quot;{searchQuery}&quot; →
                </button>
              </div>
            )}
          </div>

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
              {link.crop ? (
                <div style={{ width: 28, height: 39, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                  <img
                    src={link.image}
                    alt={link.hint}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                  />
                </div>
              ) : (
                <img
                  src={link.image}
                  alt={link.hint}
                  width={28}
                  height={39}
                  className="rounded object-cover shadow-md"
                  style={{ minWidth: 28 }}
                />
              )}
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
          {user ? (
            <div className="mt-4 space-y-1">
              <p className="truncate text-xs" style={{ color: "#7A8BA8" }}>
                Signed in as {user.displayName ?? user.email}
              </p>
              <Link
                href="/favorites"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md py-2 text-center text-sm font-semibold"
                style={{ background: "#1A2035", color: "#F0F2FF" }}
              >
                ♥ My Favorites
              </Link>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full rounded-md py-2 text-sm font-semibold"
                style={{ background: "#FF7A00", color: "#080B14" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/signin"
              onClick={() => setMenuOpen(false)}
              className="mt-4 block w-full rounded-md py-2 text-center text-sm font-semibold"
              style={{ background: "#FF7A00", color: "#080B14" }}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
