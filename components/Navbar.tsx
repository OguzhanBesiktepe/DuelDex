"use client";

// Navbar — sticky top navigation bar with:
//   • Yu-Gi-Oh! and Pokémon hover dropdowns (each with card-thumbnail links)
//   • Debounced autocomplete search that queries /api/autocomplete
//   • Avatar button that opens a slide-out profile panel when signed in
//   • Responsive hamburger menu for mobile

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserAvatar } from "@/lib/firestore";
import AvatarPicker from "@/components/AvatarPicker";

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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Returns a DiceBear initials avatar URL for the current user.
  // Used as the default when the user hasn't uploaded a custom photo
  // and isn't signed in with Google (which provides its own photoURL).
  const getDiceBearUrl = (seed: string) =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=FF7A00&textColor=080B14&radius=50&size=200`;

  // Priority: custom upload → Google/provider photo → DiceBear initials
  // "__initials__" is a sentinel meaning the user explicitly chose DiceBear
  // over their Google photo — it must be checked before user.photoURL.
  const getAvatarSrc = () => {
    if (!user) return "";
    if (customAvatar === "__initials__") return getDiceBearUrl(user.displayName ?? user.email ?? user.uid);
    if (customAvatar) return customAvatar;
    if (user.photoURL) return user.photoURL;
    return getDiceBearUrl(user.displayName ?? user.email ?? user.uid);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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

  // Load custom avatar from Firestore whenever the user changes
  useEffect(() => {
    if (!user) { setCustomAvatar(null); return; }
    getUserAvatar(user.uid).then(setCustomAvatar);
  }, [user]);

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
            <button
              onClick={() => setUserMenuOpen(true)}
              className="ml-2 shrink-0 flex items-center gap-2 rounded-full border-2 p-0.5 transition hover:opacity-90"
              style={{ borderColor: "#FF7A00" }}
            >
              <img
                src={getAvatarSrc()}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="rounded-full object-cover"
                style={{ width: 32, height: 32 }}
              />
            </button>
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
            <button
              onClick={() => { setUserMenuOpen(true); setMenuOpen(false); }}
              className="mt-4 w-full rounded-md py-2 text-sm font-semibold"
              style={{ background: "#1A2035", color: "#F0F2FF" }}
            >
              My Account →
            </button>
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

      {/* ── Profile slide-out panel ────────────────────────────────────────────
           Rendered at the nav root so it overlays the full page.
           Uses CSS transitions for smooth slide in/out from the right.      */}

      {/* Backdrop — clicking it closes the panel */}
      <div
        onClick={() => { setUserMenuOpen(false); setShowAvatarPicker(false); }}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.6)",
          opacity: userMenuOpen ? 1 : 0,
          pointerEvents: userMenuOpen ? "auto" : "none",
        }}
      />

      {/* Slide panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(320px, 85vw)",
          background: "#0E1220",
          borderLeft: "1px solid #1A2035",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          transform: userMenuOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Close button — always visible */}
        {!showAvatarPicker && (
          <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #1A2035" }}>
            <span className="text-sm font-semibold" style={{ color: "#F0F2FF", fontFamily: "var(--font-cinzel)" }}>
              My Account
            </span>
            <button
              onClick={() => setUserMenuOpen(false)}
              className="text-lg transition hover:opacity-70"
              style={{ color: "#7A8BA8" }}
            >
              ✕
            </button>
          </div>
        )}

        {user && (
          showAvatarPicker ? (
            /* Avatar picker — replaces the panel body */
            <AvatarPicker
              userId={user.uid}
              currentAvatar={customAvatar}
              diceBearUrl={getDiceBearUrl(user.displayName ?? user.email ?? user.uid)}
              googlePhotoUrl={user.photoURL ?? null}
              onAvatarChange={(url) => {
                setCustomAvatar(url);
                setShowAvatarPicker(false);
              }}
              onClose={() => setShowAvatarPicker(false)}
            />
          ) : (
            <>
              {/* User info with clickable avatar */}
              <div className="flex items-center gap-3 px-5 py-5 shrink-0" style={{ borderBottom: "1px solid #1A2035" }}>
                {/* Avatar — click to open picker */}
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="relative group shrink-0 rounded-full overflow-hidden"
                  title="Change avatar"
                  style={{ width: 48, height: 48 }}
                >
                  <img
                    src={getAvatarSrc()}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Edit overlay on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.55)" }}
                  >
                    <span className="text-white text-sm">✎</span>
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  {user.displayName && (
                    <p className="text-sm font-semibold truncate" style={{ color: "#F0F2FF" }}>
                      {user.displayName}
                    </p>
                  )}
                  <p className="text-xs truncate" style={{ color: "#7A8BA8" }}>
                    {user.email}
                  </p>
                  <button
                    onClick={() => setShowAvatarPicker(true)}
                    className="text-xs mt-0.5 transition hover:opacity-80"
                    style={{ color: "#FF7A00" }}
                  >
                    Change avatar →
                  </button>
                </div>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col py-2 flex-1">
                <Link
                  href="/favorites"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-4 text-sm font-semibold transition hover:bg-white/5"
                  style={{ color: "#F0F2FF" }}
                >
                  <span className="text-lg" style={{ color: "#CC1F1F" }}>♥</span>
                  My Favorites
                </Link>
                <Link
                  href="/lists"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-4 text-sm font-semibold transition hover:bg-white/5"
                  style={{ color: "#F0F2FF" }}
                >
                  <span className="text-lg">📋</span>
                  My Lists
                </Link>
              </nav>

              {/* Sign out at the bottom */}
              <div className="px-5 py-5 shrink-0" style={{ borderTop: "1px solid #1A2035" }}>
                <button
                  onClick={() => { signOut(); setUserMenuOpen(false); }}
                  className="w-full rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90"
                  style={{ background: "#FF7A00", color: "#080B14" }}
                >
                  Sign Out
                </button>
              </div>
            </>
          )
        )}
      </div>
    </nav>
  );
}
