# DuelDex

A TCG price browser and portfolio tracker for **Yu-Gi-Oh!** and **Pokémon** cards. Browse cards, track live prices, manage watchlists, and analyze your collection's value over time.

🌐 **Live:** [dueldex.app](https://dueldex.app)

---

## Features

**Browsing**
- Browse Yu-Gi-Oh! Monster, Spell, and Trap cards with live TCGPlayer pricing
- Browse Pokémon cards by category: Pokémon, Trainer (Full Art filter on by default), and Energy
- Browse all sets for both games with full card-by-card detail pages
- Autocomplete search across both games from the navbar

**Card Detail Pages**
- Full card stats, artwork, set printings, and rarity badges
- Buy buttons for TCGPlayer, Cardmarket, and eBay on every card
- Multiple alternate art variants on Yu-Gi-Oh! cards
- TCGPlayer and Cardmarket pricing breakdown per printing

**User Accounts (Google OAuth or Email/Password)**
- Save cards to Favorites with price snapshot at time of adding
- Create named Lists and add specific card printings to each
- Change password from Account Settings
- Custom avatar (upload, use Google photo, or generated initials)

**Portfolio Tracking**
- Per-list price tracking: see what you paid vs. current market value
- Portfolio Analytics page aggregating all lists into one view
- Summary stats: total invested, current value, and gain/loss (USD and EUR tracked separately)
- Interactive charts: Timeline view (cost basis over time) and Breakdown view (paid vs. current per card)
- Date range filters: 30 days, 90 days, or all time
- Export chart as a PNG image or full CSV (Excel-compatible)

**Price Movers**
- Homepage highlights cards with the biggest recent price changes across both games

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, SSR + client components) |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Authentication (Google OAuth + Email/Password) |
| Database | Firestore (favorites, lists, user profiles, price movers) |
| Image Hosting | Cloudflare R2 (self-hosted Yu-Gi-Oh! card images) |
| Hosting | Vercel |
| Charts | Recharts |
| Color Extraction | node-vibrant (hero section accent colors) |

---

## APIs

| API | Used For |
|---|---|
| [YGOPRODeck](https://ygoprodeck.com/api-guide/) | All Yu-Gi-Oh! card data, prices, and sets |
| [TCGdex](https://tcgdex.dev) | All Pokémon card data, sets, and Cardmarket pricing |
| [TCGPlayer](https://www.tcgplayer.com) | Buy links for both games |
| [Cardmarket](https://www.cardmarket.com) | Buy links and EUR pricing for Pokémon |
| [eBay](https://www.ebay.com) | Buy links for both games |
| [DiceBear](https://dicebear.com) | Generated initials avatars |

---

## Project Structure

```
app/
├── page.tsx                  # Homepage — featured set hero + price movers
├── search/                   # Global card search results
├── signin/                   # Auth page (Google + email/password)
├── account/                  # Account settings (change password)
├── favorites/                # Saved cards with live price tracking
├── lists/                    # User's custom lists
│   └── [listId]/             # Individual list with embedded portfolio chart
├── portfolio/                # Portfolio Analytics (all lists aggregated)
├── yugioh/
│   ├── monsters/             # Monster card grid
│   ├── spells/               # Spell card grid
│   ├── traps/                # Trap card grid
│   ├── sets/                 # All YGO sets
│   └── card/[id]/            # YGO card detail page
├── pokemon/
│   ├── pokemon/              # Pokémon card grid
│   ├── trainer/              # Trainer card grid
│   ├── sets/                 # All Pokémon sets
│   └── card/[id]/            # Pokémon card detail page
└── api/
    ├── autocomplete/         # Search suggestions endpoint
    └── cron/                 # Daily price mover cron job
```

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
