# 🚀 Deploying ZYVA to Netlify

Follow these steps in order. Total time: **~20 minutes** if you have a GitHub account.
Cost: **€0** — everything on free tiers, no credit card required.

---

## Overview

ZYVA needs two things live:
1. **A Postgres database** to store events/venues (SQLite doesn't survive on serverless hosts) → **Supabase (free)**
2. **A place to host the app** → **Netlify (free)**

The app auto-switches to Postgres the moment it sees a `DATABASE_URL` environment variable.

---

## Step 1 — Create a Supabase project (5 min)

1. Go to **https://supabase.com** → click **Start your project** → sign in with GitHub (or email)
2. Click **New project**
   - **Name:** `zyva`
   - **Database password:** click "Generate a password" — **copy it now, you'll need it in step 3**
   - **Region:** pick the closest to Cyprus — **Frankfurt (eu-central-1)** is best
   - Plan: **Free**
3. Wait ~2 min while Supabase provisions the database

## Step 2 — Create the ZYVA tables

1. Once your project is ready, click **SQL Editor** in the left sidebar
2. Click **+ New query**
3. Open the file `supabase/schema.sql` from this repo, copy its entire contents, and paste it into the SQL editor
4. Click **Run** (bottom right) — you should see "Success. No rows returned"

## Step 3 — Get your connection string

1. Click the **Connect** button at the top of the Supabase dashboard (or go to **Project Settings → Database**)
2. Under **Connection string**, select the **URI** tab, and choose the **Transaction pooler** (port `6543`) — this is the one that works with serverless like Netlify
3. It looks like this:
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password from step 1
5. **Copy the whole string** — you'll paste it into Netlify in step 6

## Step 4 — Seed the database with the Cyprus demo data

You can do this from your own laptop (needs Node.js installed) OR skip it entirely if you want a clean empty database and add events through the admin panel later.

**To seed:**
```bash
# From this project folder
export DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
npm install
npm run seed
```
You'll see it insert 18 venues and 21 events. Verify in Supabase → **Table Editor → events** — you should see them there.

---

## Step 5 — Push the code to GitHub (5 min)

If you don't have git installed yet: **https://git-scm.com/downloads**

```bash
# From this project folder
git init
git add .
git commit -m "Initial ZYVA v1.0"

# Create a new repo on github.com/new (name it 'zyva', keep it private if you want)
# Then link and push:
git remote add origin https://github.com/YOUR-USERNAME/zyva.git
git branch -M main
git push -u origin main
```

**Don't want to use GitHub?** You can also just drag the project folder straight into Netlify (skip to Step 6, option B).

---

## Step 6 — Deploy on Netlify (5 min)

### Option A — Via GitHub (recommended, auto-deploys on every push)

1. Go to **https://app.netlify.com** → sign in with GitHub
2. Click **Add new site → Import an existing project**
3. Choose **Deploy with GitHub** → authorize Netlify → pick your **zyva** repo
4. Netlify auto-detects Next.js. Leave the defaults:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Click **Add environment variables** (before deploying!) and add:
   - `DATABASE_URL` = the Supabase connection string from step 3
6. Click **Deploy zyva**
7. Wait 2-4 min for the first build. When it finishes you'll get a URL like `https://zyva-abc123.netlify.app`

### Option B — Drag & drop (no GitHub)

1. Sign into Netlify → **Add new site → Deploy manually**
2. Drag the whole project folder (excluding `node_modules`, `.next`, `data/`) into the drop zone
3. After it uploads, go to **Site configuration → Environment variables** and add `DATABASE_URL`
4. Then **Deploys → Trigger deploy → Deploy site** to rebuild with the new env var

---

## Step 7 — Rename your site (optional)

1. Netlify gives you a random URL like `zyva-abc123.netlify.app`. To change it:
   - **Site configuration → Change site name** → set it to `zyvalive` → you get `zyvalive.netlify.app`
2. To use your own domain like `zyva.live`:
   - **Domain management → Add a domain** → follow the DNS instructions
   - Netlify handles the HTTPS certificate automatically

---

## Verifying it works

1. Visit your Netlify URL
2. You should see the ZYVA homepage with your 21 events
3. Click **Map** — pins should appear (real Cyprus locations)
4. Click any event → detail page loads with the real venue info
5. Add to your phone: open the URL on your phone → Share → **Add to Home Screen**

---

## Every future update

Once GitHub → Netlify is wired up (Option A), deploying an update is just:
```bash
git add .
git commit -m "your change"
git push
```
Netlify rebuilds and redeploys automatically in ~2 min. Zero manual work.

---

## Troubleshooting

**Build fails with `better-sqlite3` errors**
`better-sqlite3` is listed as an **optional** dependency, so Netlify will skip it and not fail. If you see it failing anyway, in Netlify go to **Site configuration → Build & deploy → Environment** and add:
- `NPM_FLAGS` = `--no-optional`

**"Database connection failed" at runtime**
- Double-check `DATABASE_URL` in **Site configuration → Environment variables**
- Make sure you used the **Transaction pooler** URL (port `6543`), not the direct connection (port `5432`) — direct connections don't work reliably with serverless
- Make sure you actually replaced `[YOUR-PASSWORD]` in the URL

**"No events showing"**
- Did you run `npm run seed` in step 4? Check in Supabase → Table Editor → `events` that there are rows
- If not, seed the database from your local machine with the `DATABASE_URL` env var set

**Map tiles missing / broken images**
- These load from third-party CDNs (CartoDB, static event photos). Netlify preview URLs should work; if you use a custom domain with strict CSP, whitelist `*.basemaps.cartocdn.com`

---

## What's included in production vs. what needs migration later

**Works out of the box on Netlify:**
- Full consumer app: feed, filters, map, event details, saved events
- Real-time API routes (list, detail, share, meta)
- Google Maps embeds for directions

**Still to build (queued):**
- Organizer portal (event creation wizard, Stripe checkout)
- Super Admin control center
- Real user auth (currently guest-only, saves in localStorage)
- Stripe webhook handling for the payment lifecycle
