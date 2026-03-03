# 🃏 CardVault — Project Brief & Reference Guide

> Keep this open in VSCode while building. Contains every decision made, the full stack, API details, and step-by-step setup order.

---

## 🎯 What We're Building

A TCG (Trading Card Game) price browser and tracker for **Yu-Gi-Oh!** and **Pokémon** cards.

Users can:
- Browse cards by type (Monster/Spell/Trap, Pokémon/Trainer/Energy)
- Filter by set, rarity, and price range
- See live TCGPlayer prices on every card
- Click a card to see full details + multi-vendor pricing
- Click "Buy on TCGPlayer" to go directly to the listing
- **Sign in with Google** to save favorite cards and track their prices

---

## 🏗️ Full Tech Stack

| Layer | Tool | Cost | Notes |
|---|---|---|---|
| Framework | **Next.js 14** (App Router) | Free | SSR + file-based routing |
| Styling | **Tailwind CSS** | Free | Utility-first, fast to build |
| Hosting | **Vercel** | Free | Auto-deploys from GitHub |
| Auth | **Supabase Auth** | Free | Google OAuth built-in |
| Database | **Supabase PostgreSQL** | Free | Stores user favorites |
| YGO Cards | **YGOPRODeck API** | Free | No API key needed |
| Pokémon Cards | **pokemontcg.io** | Free | Free key from dev.pokemontcg.io |
| YGO Images | **Cloudflare R2** | Free (10GB) | One-time bulk download |
| Pokémon Images | **pokemontcg.io CDN** | Free | Hotlinking is fine for PKMN |

---

## 📡 APIs

### Yu-Gi-Oh! — YGOPRODeck
- **Base URL:** `https://db.ygoprodeck.com/api/v7/cardinfo.php`
- **No API key required**
- **Rate limit:** 20 requests/second
- **Key endpoints:**
  ```
  All cards:          ?num=24&offset=0
  Monster cards:      ?type=Effect Monster (or Normal Monster, Synchro, XYZ, Link, etc.)
  Spell cards:        ?type=Spell Card
  Trap cards:         ?type=Trap Card
  By set:             ?cardset=Metal Raiders
  Search:             ?fname=dark magician
  With TCG prices:    add &tcgplayer_data=true  (includes set_url for buy link)
  Card sets list:     https://db.ygoprodeck.com/api/v7/cardsets.php
  ```
- **Prices:** `card_prices[0].tcgplayer_price` (USD)
- **Images:** `card_images[0].image_url_small` — ⚠️ Download and self-host, do NOT hotlink
- **All card types:** Effect Monster, Normal Monster, Flip Effect Monster, Ritual Monster, Synchro Monster, XYZ Monster, Link Monster, Pendulum Effect Monster, Spell Card, Trap Card

### Pokémon — pokemontcg.io
- **Base URL:** `https://api.pokemontcg.io/v2`
- **Free API key:** Sign up at https://dev.pokemontcg.io (needed for 20k/day limit)
- **Header:** `X-Api-Key: YOUR_KEY`
- **Rate limit:** 20,000 requests/day with key (1,000/day without)
- **Key endpoints:**
  ```
  Pokémon cards:      /cards?q=supertype:Pokémon&pageSize=24&page=1
  Trainer cards:      /cards?q=supertype:Trainer&pageSize=24&page=1
  Energy cards:       /cards?q=supertype:Energy&pageSize=24&page=1
  By set:             /cards?q=set.name:"Scarlet & Violet"
  All sets:           /sets
  Search:             /cards?q=name:charizard
  ```
- **Prices:** `tcgplayer.prices.holofoil.market` (or `normal.market`)
- **TCGPlayer buy link:** `tcgplayer.url` — direct link per card ✅
- **Images:** `images.small` and `images.large` — CDN hotlinking is fine ✅

---

## 🗄️ Database Schema (Supabase)

```sql
-- Managed automatically by Supabase Auth
-- table: auth.users (id, email, created_at, etc.)

-- Your favorites table
create table public.favorites (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  card_id     text not null,           -- e.g. "6983839" for YGO, "base1-4" for PKMN
  game        text not null,           -- "yugioh" or "pokemon"
  card_name   text not null,           -- stored for display without re-fetching
  card_image  text,                    -- image URL snapshot
  added_at    timestamptz default now()
);

-- Row Level Security: users can only see their own favorites
alter table public.favorites enable row level security;

create policy "Users can manage own favorites"
  on public.favorites
  for all
  using (auth.uid() = user_id);
```

---

## 🗂️ Project File Structure

```
cardvault/
├── app/
│   ├── layout.tsx              ← Root layout, navbar, footer
│   ├── page.tsx                ← Homepage (featured cards)
│   ├── yugioh/
│   │   ├── page.tsx            ← Redirect to /yugioh/monsters
│   │   ├── monsters/page.tsx   ← Monster cards grid
│   │   ├── spells/page.tsx     ← Spell cards grid
│   │   └── traps/page.tsx      ← Trap cards grid
│   ├── pokemon/
│   │   ├── page.tsx            ← Redirect to /pokemon/pokemon
│   │   ├── pokemon/page.tsx    ← Pokémon cards grid
│   │   ├── trainer/page.tsx    ← Trainer cards grid
│   │   └── energy/page.tsx     ← Energy cards grid
│   ├── favorites/
│   │   └── page.tsx            ← User's saved cards (protected route)
│   └── api/
│       └── auth/[...nextauth]/ ← Not needed with Supabase — handled automatically
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── CardGrid.tsx
│   ├── CardItem.tsx            ← Individual card tile with price badge
│   ├── CardModal.tsx           ← Click-to-expand detail modal
│   ├── Sidebar.tsx             ← Filters (set, rarity, price range)
│   ├── Pagination.tsx
│   └── FavoriteButton.tsx      ← Heart icon, auth-aware
├── lib/
│   ├── supabase.ts             ← Supabase client
│   ├── yugioh.ts               ← YGOPRODeck fetch helpers
│   └── pokemon.ts              ← pokemontcg.io fetch helpers
├── .env.local                  ← API keys (never commit this)
└── tailwind.config.ts
```

---

## 🔑 Environment Variables (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Pokémon TCG API
NEXT_PUBLIC_POKEMON_API_KEY=your_pokemontcg_key

# YGOPRODeck — no key needed, leave blank or omit
# Cloudflare R2 (for self-hosted YGO images — set up later)
# R2_ACCOUNT_ID=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET_NAME=
```

---

## 🎨 Design Decisions

**Theme:** Dark mode only. Card art pops more on dark backgrounds.

**Colors:**
- Background: `#0a0b0f`
- Surface: `#12141a`
- Yu-Gi-Oh accent: `#f5c842` (gold)
- Pokémon accent: `#e8394a` (red)
- Price color: `#3ecf6a` (green)
- Expensive cards: `#f5c842` (gold)

**Fonts:** Cinzel (logo/headings, serif) + Inter (body)

**Card grid:** 6 columns desktop → 4 tablet → 2 mobile. 24 cards per page.

**Navbar layout:**
```
[CardVault Logo]   [Yu-Gi-Oh! ▼]  [Pokémon ▼]   [🔍 Search bar]   [Sign In / Avatar]
```

**Yu-Gi-Oh dropdown (hover):**
- ⚔️ Monster Cards (9,847 cards)
- ✨ Spell Cards (2,341 cards)
- 🪤 Trap Cards (1,231 cards)
- 📦 Browse All Sets (200+)

**Pokémon dropdown (hover):**
- ⚡ Pokémon (14,200 cards)
- 🎴 Trainer Cards (3,100 cards)
- ⚪ Energy Cards (180 cards)
- 📦 Browse All Sets (100+)

**Card tile shows:** Image · Name · Type · TCGPlayer price · Rarity badge · "TCG ↗" buy button

**Card modal shows:** Full image · All stats (ATK/DEF/Type/Attribute) · Card description · Prices from TCGPlayer + eBay + Cardmarket · "Buy on TCGPlayer" CTA button

**Sidebar filters:** Browse by Set (searchable dropdown) · Rarity · Price Range slider

**Pagination:** ‹ 1 2 3 4 5 … 41 › with "Page X of Y · Z cards" text

**Footer:**
- Left: Logo + tagline + browse links + where to buy (TCGPlayer, Amazon, eBay)
- Right: Data attribution (YGOPRODeck, pokemontcg.io) + copyright + GitHub icon + LinkedIn icon + "Made by [Your Name]"

---

## ⚡ Setup Order (Step by Step)

### Step 1 — Accounts to Create First
- [ ] **Vercel** — vercel.com (free, deploy with GitHub)
- [ ] **Supabase** — supabase.com (free, no credit card)
- [ ] **pokemontcg.io** — dev.pokemontcg.io (free API key)
- [ ] **Google Cloud Console** — console.cloud.google.com (for OAuth credentials)
- [ ] **Cloudflare** — cloudflare.com (for R2 image hosting — can do later)

### Step 2 — Initialize the Project
```bash
npx create-next-app@latest cardvault --typescript --tailwind --eslint --app
cd cardvault
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Step 3 — Supabase Setup
1. Create a new Supabase project
2. Go to Authentication → Providers → Google → Enable
3. Paste your Google Client ID + Secret (from Google Cloud Console)
4. Copy your Project URL and anon key into `.env.local`
5. Run the SQL above to create the `favorites` table

### Step 4 — Google OAuth Setup
1. Go to console.cloud.google.com
2. Create a new project called "CardVault"
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URI: `https://[your-supabase-project].supabase.co/auth/v1/callback`
5. Copy Client ID and Secret into Supabase Auth settings

### Step 5 — Build Order
1. Layout (Navbar + Footer shell)
2. YGO card grid page (monsters) — get data showing first
3. Card tile component with price
4. Pokémon card grid page
5. Sidebar filters + pagination
6. Card detail modal
7. Google sign in flow
8. Favorites page
9. Polish + dark mode refinements
10. YGO image bulk download + Cloudflare R2 upload

---

## ⚠️ Important Rules / Gotchas

1. **YGO images — DO NOT hotlink.** Download once and self-host on Cloudflare R2. Their CDN will blacklist your IP if you serve images directly from their server to all your users.

2. **YGO image rule for development:** Direct URLs are fine while building locally. Only matters when real users start hitting the site.

3. **Pokémon images — hotlinking IS fine.** Their CDN is designed for it. Use `images.small` for the grid and `images.large` for the modal.

4. **Supabase free tier pauses after 1 week of inactivity.** Not a problem during active development. Just know it wakes up on first request.

5. **pokemontcg.io without API key = 1,000 req/day.** Get the free key immediately. 20,000/day is plenty.

6. **YGO pagination:** Use `num=24&offset=0`, then `offset=24`, `offset=48`, etc.

7. **Pokémon pagination:** Use `pageSize=24&page=1`, then `page=2`, etc.

8. **Never commit `.env.local`** to GitHub. Vercel has its own env var settings in the dashboard.

---

## 🔗 Key Links

| Resource | URL |
|---|---|
| YGOPRODeck API Guide | https://ygoprodeck.com/api-guide/ |
| pokemontcg.io Docs | https://docs.pokemontcg.io |
| pokemontcg.io Dev Portal | https://dev.pokemontcg.io |
| Supabase Docs | https://supabase.com/docs |
| Supabase Auth + Next.js | https://supabase.com/docs/guides/auth/auth-helpers/nextjs |
| Next.js App Router Docs | https://nextjs.org/docs/app |
| Tailwind Docs | https://tailwindcss.com/docs |
| Vercel Deploy | https://vercel.com |
| Google Cloud Console | https://console.cloud.google.com |
| Cloudflare R2 | https://developers.cloudflare.com/r2 |

---

*Generated from planning session. Last updated: March 2026.*
