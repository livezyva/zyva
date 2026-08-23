# 🔐 Turn on Auth + Admin (10 minutes)

Follow these steps in order. All of it is one-time setup — after this it works forever.

---

## Step 1 — Enable Email/Password auth in Supabase (2 min)

1. Go to your Supabase dashboard → **your zyva project**
2. Left sidebar → **Authentication** (padlock icon)
3. Click **Providers** (top tabs)
4. Find **Email** in the list → click it
5. Verify these are ON:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (required — this is the verification we agreed on)
6. Click **Save**

## Step 2 — Set the Site URL so confirmation links work (2 min)

Email confirmation links need to redirect back to your live site, not `localhost`.

1. Still in **Authentication** → click **URL Configuration** (left sub-menu)
2. **Site URL:** paste your Netlify URL, e.g. `https://zyva1.netlify.app`
   (or your custom domain later — you can change it any time)
3. **Redirect URLs:** click **Add URL** and paste both:
   - `https://zyva1.netlify.app/**`
   - `http://localhost:3000/**` (so it also works while you develop locally)
4. Click **Save**

## Step 3 — Grab your Supabase public keys (1 min)

1. Left sidebar → **Project Settings** (⚙️ near the bottom) → **API**
2. Copy two values (keep this tab open):
   - **Project URL** — looks like `https://gmelqqasahwnqlnupacl.supabase.co`
   - **anon public** key — a long JWT starting with `eyJ...` (the "Project API keys" section)

⚠️ Only copy the **anon public** key. Do NOT use the `service_role` key — that one has admin superpowers and must never leave your server.

## Step 4 — Add 3 new environment variables in Netlify (3 min)

1. Go to **https://app.netlify.com** → your **zyva1** site
2. Top menu → **Site configuration** → left sidebar → **Environment variables**
3. Click **Add a variable** and add each of these three:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from Step 3 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key from Step 3 |
   | `NEXT_PUBLIC_ADMIN_EMAILS` | `livezyva@gmail.com` |
   | `ADMIN_EMAILS` | `livezyva@gmail.com` |

   The first three should NOT be marked "secret" (they're `NEXT_PUBLIC_` so they're safe in the browser).
   `ADMIN_EMAILS` can also be non-secret — it's the same value as `NEXT_PUBLIC_ADMIN_EMAILS` but the server-side API routes read it too.

   For scope: use **"Same value for all deploy contexts"** if you can (uncheck "secret").

4. Click **Save** on each.

## Step 5 — Trigger a redeploy (2 min)

Environment variables are baked in at build time — the site needs to rebuild:

1. Top menu → **Deploys** → **Trigger deploy** → **Deploy site**
2. Wait ~3 minutes for the green ✅ **Published** badge.

## Step 6 — Create your admin account (30 sec)

Once the site's live:

1. Open `https://zyva1.netlify.app/auth?mode=signup`
2. Sign up with:
   - **Email:** `livezyva@gmail.com` (the one you whitelisted)
   - **Password:** something you'll remember
3. Check your Gmail inbox → click the **Confirm your email** link
4. It redirects you back to ZYVA, signed in
5. Look at the top-right of the header — you should see:
   - A **★ Admin** button (green, only visible to whitelisted emails)
   - Your name/avatar with a dropdown menu

6. Click **Admin** → you should land in the admin dashboard with your 21 events listed in a table

## What to try in the admin panel

- 🎯 Click **New event** → walk through the 4-step form (same form organizers will use later)
- ✏️ Edit any event → change the title / image / description → save
- ★ Toggle "featured" on any event → refresh the home page → it shows in the carousel
- 🗑️ Delete an event you don't need

---

## Common issues

**"Not authorized"** after logging in → the email you signed up with doesn't match `ADMIN_EMAILS`. Either sign up with `livezyva@gmail.com` OR update `ADMIN_EMAILS` in Netlify to whatever you actually signed up with, then redeploy.

**Confirmation link goes to `localhost` or gives an error** → you skipped Step 2 (Site URL). Fix it and request a fresh confirmation email by signing up again with a different email.

**"Auth not configured yet"** page → env vars are missing or you didn't trigger a redeploy after adding them. Double-check spelling (they must be exactly `NEXT_PUBLIC_SUPABASE_URL` etc.) and then Deploys → Trigger deploy.

**Password too short** → Supabase requires minimum 6 characters.

---

## What's next

Once you've confirmed this works end-to-end (you can log in, see the Admin tab, add/edit events), we'll build **Turn 2**:

- Organizer application form ("Apply to list events")
- Approval queue for applications
- Event submission form for approved organizers
- Approval queue for event submissions
- Email notifications
- Everything still free (Stripe comes in Turn 3)
