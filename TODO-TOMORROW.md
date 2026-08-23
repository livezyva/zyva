# 📌 ZYVA — Tomorrow's TODO

Written: 2026-08-22, late evening.
Everything below is queued for the next session. Show this to any agent (or
future you) to pick up cleanly.

---

## Current live status

- ✅ Site is LIVE at **https://zyva1.netlify.app**
- ✅ Full consumer app (21 events, map, filters, search)
- ✅ Email/password sign-in works
- ✅ Google Sign-In works (as of tonight!)
- ✅ Admin panel exists at `/admin` (for `livezyva@gmail.com`)
- ✅ Auto-cleanup cron running nightly (deletes events 7+ days after end)
- ⚠️ **One known bug (see #1 below): signing in with Google shows admin as GUEST**

---

## THE 5 THINGS TO FIX / BUILD TOMORROW

### 1. 🐛 Admin whitelist doesn't work with Google sign-in

**Symptom:** When Modestos signs in with Google as `livezyva@gmail.com`,
the app treats him as a normal guest instead of admin. No ★ Admin button appears.

**What we already tried:** Debug logging was added to `lib/supabase.js`
(pushed in v9). It logs the admin check to the browser console.

**Next step to fix:**
- Have Modestos open `zyva1.netlify.app` in browser, sign in with Google
- Press F12 → Console tab
- Look for line starting with `[ZYVA admin check]`
- Screenshot it → agent diagnoses the mismatch
- Most likely cause: `NEXT_PUBLIC_ADMIN_EMAILS` env var in Netlify has a
  typo, extra space, or is missing. Fix by re-typing (not pasting)
  `livezyva@gmail.com` in Netlify env vars → trigger redeploy.

---

### 2. 👥 Organizer portal (Turn 2 of the roadmap)

**Business logic (already agreed):**
1. Anyone can sign up as citizen (works today)
2. Citizens can click "Apply to list events" → fills organizer application form
3. Admin reviews application → approve/reject with email notification
4. Approved organizers get "Submit event" button in their profile
5. Each event submission goes to admin approval queue
6. Admin approves each event → goes live immediately (FREE during launch phase)

**No Stripe yet** — user decided first month is free.

**Application form fields:**
- Business name
- Contact name + email + phone
- City
- Instagram handle
- Facebook URL
- Website URL
- (NO "why should we approve you" field — user removed this)

**Files to create/modify:**
- `app/apply/page.jsx` — public application form
- `app/api/organizer/apply/route.js` — POST endpoint (rate-limited)
- `app/api/admin/organizers/route.js` — GET pending applications
- `app/api/admin/organizers/[id]/route.js` — PATCH approve/reject
- `app/organizer/page.jsx` — organizer dashboard (only approved organizers see it)
- `app/organizer/new-event/page.jsx` — event submission form
  (reuse `components/admin/EventForm.jsx` but events go to PENDING_APPROVAL
  status, not APPROVED_ACTIVE)
- Extend admin dashboard tabs: "Events" | "Organizers" | "Pending Events"

**Database migration needed** — run this SQL in Supabase:
```sql
CREATE TABLE IF NOT EXISTS organizer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30),
    city VARCHAR(50) NOT NULL,
    instagram_handle VARCHAR(100),
    facebook_url TEXT,
    website_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(user_id)
);

-- Add role tracking to auth users via a public profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'CITIZEN', -- CITIZEN | ORGANIZER | ADMIN
    full_name VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE organizer_applications TO anon, authenticated;
GRANT ALL ON TABLE profiles TO anon, authenticated;
```

**Email notifications** — later. For now user gets notified via app UI only.
When ready, wire up Resend or Supabase's built-in email (there's a limit but
it's free for low volume).

---

### 3. 📸 Check the photo upload situation

Currently the "Cover image" step of the event form only accepts:
- A URL paste, OR
- One of the preset gallery images in `/public/events/`

**User wants real photo uploads** — let organizers upload straight from
their phone/computer.

**Solution:** Supabase Storage bucket.

**Setup steps:**
1. Supabase → **Storage** → **New bucket** → name it `event-covers` → make it Public
2. Add RLS policies:
   ```sql
   CREATE POLICY "Anyone can view event covers"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'event-covers');
   
   CREATE POLICY "Authenticated users can upload event covers"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'event-covers');
   ```
3. Update `components/admin/EventForm.jsx` Step 2:
   - Add "Upload photo" button next to URL input
   - Use `supabase.storage.from('event-covers').upload(...)`
   - Client-side compression: max width 1200px, quality 80, convert to WebP
   - Get public URL → set as `coverUrl`
4. Test on desktop AND mobile browser

**Free tier limits:** 1 GB storage, plenty for thousands of event photos.

---

### 4. ⭐ "Recommended / Featured" toggle in admin (from screenshot)

**What user meant:**
The user sent a screenshot showing the "Recommended" (Featured Booster) badge
on events. They want admin to be able to mark any event as recommended/featured
from the admin panel.

**Status:** ACTUALLY ALREADY BUILT — the admin table has a **★ Feature**
button on every row that toggles `is_featured`. Featured events appear in
the top carousel on the homepage.

**Verification steps for tomorrow:**
1. Sign in as admin (fix #1 first)
2. Go to `/admin`
3. Click the ★ star icon on any event row
4. Refresh homepage → that event should now be in the "★ Featured" carousel
   at the top

If the ★ button doesn't work → fix API bug in `app/api/admin/events/[id]/route.js`
(PATCH handler for `is_featured` field).

If user wants a **separate "Recommended" concept** distinct from "Featured"
(e.g. admin's personal recommendations vs paid featured slots), we'd add
a new `is_recommended` boolean column and a second toggle button.

**Ask user which they mean before building.**

---

### 5. 📱 Make ZYVA an actual installable app

**User wants:** Real app in App Store + Google Play, not just website.

**Roadmap (already discussed):**

**Phase 1 — PWA polish (do this first, no cost)**
- Verify PWA manifest is complete: `/public/manifest.webmanifest`
- Add missing icons in multiple sizes (192, 512)
- Add splash screens
- Test "Add to Home Screen" on iPhone + Android
- **This ALONE gives ~90% of "native app" experience for free**

**Phase 2 — Google Play (~€22 one-time)**
- Install Capacitor: `npm install @capacitor/core @capacitor/android`
- `npx cap init "ZYVA" "com.zyva.app"`
- `npx cap add android`
- Install Android Studio on Windows (free)
- Build APK/AAB → upload to Google Play Console
- ~24 hour review
- Now live in Google Play

**Phase 3 — Apple App Store (needs Mac or cloud service)**
- Requires Apple Developer Program: €99/year
- Options for building:
  - Buy MacBook (M1/M2 refurb ~€600-900) — user was considering the
    MacBook Neo A18 Pro €799 at Public.gr
  - OR use EAS Build cloud service (~free-25€/month)
- `npx cap add ios`
- Build in Xcode → submit to App Store Connect
- ~1-2 day review
- If offering ANY other social login (Google), Apple mandates Apple Sign-In too

**Recommendation for tomorrow's session:**
Just do **Phase 1 (PWA polish)**. Ship Phase 2 (Google Play) after Turn 2
(organizer flow) is done and there are real users. Phase 3 (iOS) when
revenue justifies the €99/yr + Mac cost.

---

## Prioritized order for tomorrow

**RECOMMENDED SEQUENCE (~4 hours total):**

1. **Fix #1** (admin whitelist bug) — 15 min. Unblocks admin panel usage.
2. **Fix #4** (verify featured toggle works) — 5 min. Just click test.
3. **Build #3** (photo uploads via Supabase Storage) — 45 min.
4. **Build #2** (organizer portal — Turn 2) — 2-3 hours. THE BIG ONE.
5. **Phase 1 of #5** (PWA polish) — 30 min. Save the app-store work for
   after real users show up.

---

## Files/data any new agent needs to know

- **User:** Modestos, non-technical, on Windows using Git Bash
- **Admin email whitelist:** `livezyva@gmail.com`
- **GitHub:** github.com/livezyva/zyva
- **Local project path:** `C:\Users\Modestos Koundourzis\Desktop\zyva`
  ⚠️ **Netlify base directory is set to `zyva`** because files are pushed one
  level too deep on GitHub (in a nested `zyva/` folder). Do NOT try to
  "fix" this on GitHub without also updating Netlify's Base directory setting.
- **Netlify env vars set:** `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ADMIN_EMAILS`, `ADMIN_EMAILS`
- **Supabase project ID:** `gmelqqasahwnqlnupacl`
- **Supabase region:** eu-central-1 (Frankfurt)
- **Latest zip version pushed:** v9 (includes debug logging for admin check)
- **Design tokens:** MUST match cyberpunk/Spotify aesthetic
  - Bg: #000000, Cards: #0A0A0A, Border: #222222
  - Neon: #1DB954, Text: #FFFFFF/#B3B3B3/#666666
  - Fonts: Space Grotesk (headline), Inter (body)
- **All prior gotchas** documented in the full handoff doc (from earlier
  in this session — save it separately)

---

Good night! 🌙 Everything's saved. Tomorrow we start with fix #1 and work
down the list. Reply "morning" or reference this file when you're back.
