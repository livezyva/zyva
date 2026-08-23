# ZYVA — Consumer Web App (v1.0 slice)

Dark-mode-first event discovery for Cyprus nightlife, dining, beach bars,
festivals, and culture. This repo is the **Consumer Web/Mobile App** slice
of the ZYVA platform spec (organizer portal + admin center are out of scope
for this build).

## Stack

- **Next.js 14** (App Router) — Server Components + PWA
- **Tailwind CSS** — cyberpunk / Spotify dark aesthetic per design tokens
- **Node/Express-style API** — implemented as Next.js Route Handlers
- **better-sqlite3** — local database, auto-seeded on first boot
- **Leaflet + OpenStreetMap** — dark-styled map tiles (no API key required)
- **LocalStorage** — guest bookmarks (spec: "persisted to database if
  logged in; stored in LocalStorage if guest")

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000
```

The SQLite database is created and seeded on first request. Delete
`data/zyva.db` to reset.

## Routes shipped

| Path                    | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `/`                     | Discovery feed — hero, featured carousel, filters, grouped list, map toggle |
| `/events/[slug]`        | Full event detail — hero, CTA bar, venue mini-map, related events, dynamic OG tags |
| `/saved`                | Your saved (bookmarked) events                     |
| `/api/events`           | List — supports `?q`, `?timeframe`, `?city`, `?category`, `?featured=1` |
| `/api/events/[slug]`    | Event + venue + related (also increments views)    |
| `/api/events/[slug]/share` | POST — increments share counter                 |
| `/api/meta`             | Cities, categories, and counts                     |

## Features covered against the v1.0 spec

**5.1.A — Main Feed & Discovery**
- Infinite-friendly feed grouped as Tonight → Tomorrow → This Weekend → Upcoming
- Featured carousel with neon-green glowing border and auto-advance
- Smart filter bar: timeframe, city (Limassol · Nicosia · Paphos · Larnaca · Ayia Napa), category (all 5)
- Debounced instant search across title, venue, category, description

**5.1.B — Interactive Map View**
- Floating List/Map toggle
- Custom neon-green pulsing pins on a dark-inverted OSM tile layer
- Popup with thumbnail, title, time, price, Details link, and **Navigate** button (deep-link to Google/Apple Maps directions)

**5.1.C — Event Detail Screen**
- Hero image with dark gradient overlay
- Title / category / city / start–end / venue / price
- "I'm Going / Save" (LocalStorage-backed, live count in header)
- "Share Event" using Web Share API with clipboard fallback + share counter API
- "Buy Tickets" outbound link
- Venue info box with address, Instagram, mini-map, and related events at the same venue

**7 — UI/UX Design Tokens**
- Pure `#000000` background, `#0A0A0A` cards, `#222222` borders
- `#1DB954` neon green with glow shadows and pulse animations
- Space Grotesk headline / Inter body typography
- No light mode; hover states glow green

**8 — Non-Functional**
- Dynamic OpenGraph tags on every event page (`generateMetadata`)
- PWA `manifest.webmanifest` + SVG icon
- Responsive from 360px phones up to desktop

## What's stubbed / out of scope in this slice

- Organizer portal (event creation wizard, Stripe checkout)
- Super admin center (moderation queue, category config)
- Real auth (currently guest-only; save uses LocalStorage)
- Real Stripe webhooks + lifecycle cron (schema and states are present)
- Postgres/PostGIS (SQLite is used locally; migration path documented in `.env.example`)
- Cloudinary WebP compression pipeline (spec requires ≤500 KB, WebP, q=80)

## File map

```
app/
  layout.jsx            # root shell + fonts + PWA manifest
  page.jsx              # /
  saved/                # /saved
  events/[slug]/        # /events/:slug + generateMetadata (OG tags)
  api/
    events/route.js               # GET list (filters)
    events/[slug]/route.js        # GET detail (+ view counter)
    events/[slug]/share/route.js  # POST share counter
    meta/route.js                 # GET cities / categories / counts
components/
  Header.jsx, FilterBar.jsx, FeaturedCarousel.jsx,
  EventCard.jsx, ViewToggle.jsx, MapView.jsx, MiniMap.jsx,
  DiscoverPage.jsx
lib/
  db.js                 # better-sqlite3 handle + schema + auto-seed
  seedData.js           # 18 venues + 21 events across all 5 Cyprus cities
  format.js             # date/time + category helpers
  saved.js              # LocalStorage bookmarks
data/
  zyva.db               # created on first request
```
