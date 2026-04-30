// MarketplaceButton / MarketplaceLinks — buy buttons shown on card detail pages.
// Renders a "Available for purchase:" header followed by a row of equal-width logo-only buttons.
// All buttons share the same dark neutral background so the logos carry the brand identity.

interface MarketplaceLink {
  href: string;
  logo: string;
  alt: string;
  background?: string;
  logoHeight?: number;
}

interface MarketplaceLinksProps {
  links: MarketplaceLink[];
}

export function MarketplaceLinks({ links }: MarketplaceLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        Available for purchase:
      </p>
      <div className="flex gap-2">
        {links.map((link) => (
          <a
            key={link.alt}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Buy on ${link.alt}`}
            className="flex flex-1 items-center justify-center py-3 rounded-lg transition-opacity hover:opacity-80"
            style={{
              background: link.background ?? "var(--surface)",
              border: link.background ? "none" : "1px solid #1A2035",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={link.logo}
              alt={link.alt}
              style={{
                height: link.logoHeight ?? 22,
                width: "auto",
                objectFit: "contain",
              }}
            />
          </a>
        ))}
      </div>
    </div>
  );
}
