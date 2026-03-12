// Footer — four-column grid: brand/social · YGO links · Pokémon links · Where to Buy + data attribution.
// Also includes a bottom bar with copyright and API credits.

import Image from "next/image";
import Link from "next/link";

const YGO_LINKS = [
  { href: "/yugioh/monsters", label: "Monster Cards" },
  { href: "/yugioh/spells", label: "Spell Cards" },
  { href: "/yugioh/traps", label: "Trap Cards" },
  { href: "/yugioh/sets", label: "Browse Sets" },
];

const POKEMON_LINKS = [
  { href: "/pokemon/pokemon", label: "Pokémon Cards" },
  { href: "/pokemon/trainer", label: "Trainer Cards" },
  { href: "/pokemon/energy", label: "Energy Cards" },
  { href: "/pokemon/sets", label: "Browse Sets" },
];

const BUY_LINKS = [
  { href: "https://www.tcgplayer.com", label: "TCGPlayer" },
  { href: "https://www.ebay.com/", label: "eBay" },
  { href: "https://www.amazon.com/", label: "Amazon" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t"
      style={{ background: "#0E1220", borderColor: "#1A2035" }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/">
              <Image
                src="/Logo.png"
                alt="DuelDex"
                width={130}
                height={42}
                className="object-contain"
                unoptimized
              />
            </Link>
            <p className="text-sm leading-relaxed italic" style={{ color: "#7A8BA8" }}>
              Search, Track & Collect.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://github.com/OguzhanBesiktepe"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                aria-label="GitHub"
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#7A8BA8" }}
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/oguzhan-besiktepe/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                aria-label="LinkedIn"
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#7A8BA8" }}
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Yu-Gi-Oh! */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "#FF7A00" }}
            >
              Yu-Gi-Oh!
            </h3>
            <ul className="flex flex-col gap-2">
              {YGO_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#7A8BA8" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pokémon */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "#00AAFF" }}
            >
              Pokémon
            </h3>
            <ul className="flex flex-col gap-2">
              {POKEMON_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#7A8BA8" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Where to Buy + Attribution */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: "#FFD700" }}
              >
                Where to Buy
              </h3>
              <ul className="flex flex-col gap-2">
                {BUY_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: "#7A8BA8" }}
                    >
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: "#7A8BA8" }}
              >
                Data
              </h3>
              <a
                href="https://ygoprodeck.com/api-guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "#7A8BA8" }}
              >
                YGOPRODeck API ↗
              </a>
              <a
                href="https://tcgdex.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "#7A8BA8" }}
              >
                TCGdex API ↗
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid #1A2035", color: "#4A5568" }}
        >
          <p>© {year} DuelDex. All rights reserved.</p>
          <p>
            Card data provided by{" "}
            <a
              href="https://ygoprodeck.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              YGOPRODeck
            </a>{" "}
            and{" "}
            <a
              href="https://tcgdex.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              TCGdex
            </a>
            . Not affiliated with Konami or The Pokémon Company.
          </p>
        </div>
      </div>
    </footer>
  );
}
