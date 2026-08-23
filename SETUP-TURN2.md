# 🚀 Turn 2 setup — organizer flow (10 minutes)

You just pushed v10 which adds the **organizer portal**. Two SQL migrations
in Supabase are required before the code will work. Follow in order.

---

## Step 1 — Run the migration (5 min)

Adds two new tables (`profiles` and `organizer_applications`), extends the
`events` table, and creates a trigger that auto-creates a profile row when
a new user signs up.

1. Open **Supabase → SQL Editor** (or use direct link:
   https://supabase.com/dashboard/project/gmelqqasahwnqlnupacl/sql/new )
2. Click **+ New query**
3. Copy the entire contents of `supabase/turn2-migration.sql` from your
   project folder
4. Paste into the SQL editor
5. Click **Run** (or Ctrl+Enter)
6. Should say **Success. No rows returned**

Verify by clicking **Table Editor** — you should see two new tables:
- `profiles`
- `organizer_applications`

## Step 2 — (Optional) Load fake test data (1 min)

So your admin queue isn't empty and you can practice approve/reject.

1. SQL Editor → **+ New query**
2. Paste the contents of `supabase/turn2-seed-test-data.sql`
3. Click **Run**
4. Should say something like "Query returned successfully"

You now have 3 fake pending applications (Guaba Beach Bar, Rialto Theatre,
The Rockwood) in the admin queue.

## Step 3 — Backfill your own admin profile (30 sec)

If you already signed up as `livezyva@gmail.com` before this migration,
you don't have a `profiles` row yet. Fix it:

1. SQL Editor → **+ New query**
2. Paste and Run:
   ```sql
   INSERT INTO profiles (id, role, full_name)
   SELECT id, 'ADMIN', COALESCE(raw_user_meta_data->>'full_name', email)
   FROM auth.users
   WHERE email = 'livezyva@gmail.com'
   ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
   ```
3. Should say "Success" and inserted 1 row.

## Step 4 — Push v10 to GitHub (3 min)

Same drill as before. In Git Bash inside your `zyva` folder:

```
git add .
git commit -m "Turn 2: organizer flow + admin approval"
git push
```

Wait ~3 min for Netlify to rebuild.

---

## What you can now do

### As admin (livezyva@gmail.com)

1. Sign in → click **★ Admin** → new **Organizers** tab appears
2. See the 3 fake pending applications (Guaba, Rialto, Rockwood)
3. Click **Approve** on one → they become an approved organizer
4. Click **Reject** on another → modal asks for a reason → they see it

### As a regular user (test with another Gmail)

1. Sign up with a different Gmail account
2. Header shows **"List an event"** button
3. Click it → apply form → submit
4. See "Application pending" status
5. Come back as admin → approve them
6. Come back as the user → header now shows **"+ New event"** → click →
   opens the 4-step wizard → submit → goes to admin queue

### The full flow

```
Guest → Signs up → CITIZEN role
CITIZEN → Applies → PENDING application
Admin → Approves → CITIZEN promoted to ORGANIZER
ORGANIZER → Submits event → event in PENDING_APPROVAL
Admin → Approves event → event goes LIVE
```

---

## Files added / changed

- `supabase/turn2-migration.sql` — schema changes (run this)
- `supabase/turn2-seed-test-data.sql` — optional test data
- `lib/supabaseServer.js` — added `requireOrganizer` + role loading
- `lib/supabase.js` — added `getAuthToken` + role in `getCurrentAuth`
- `components/Header.jsx` — contextual "List event" / "New event" CTA
- `components/admin/EventForm.jsx` — `asOrganizer` mode (submits as PENDING)
- `app/apply/page.jsx` — public application form
- `app/organizer/page.jsx` — organizer dashboard
- `app/admin/page.jsx` — added Organizers tab
- `app/api/organizer/apply/route.js` — POST/GET applications
- `app/api/organizer/events/route.js` — POST/GET organizer's events
- `app/api/admin/organizers/route.js` — GET applications for admin
- `app/api/admin/organizers/[id]/route.js` — PATCH approve/reject

---

## What's next

Once organizer flow is proven working, next candidates:

- **Photo uploads via Supabase Storage** (~45 min) — real image picker in
  the event form instead of URL paste
- **Google OAuth "Publish app"** (~5 min) — currently only test users can
  Google-sign-in; publish so any Gmail user can sign up
- **Email notifications** via Resend (~30 min) — email organizers when
  their application/event is approved/rejected
- **Custom domain zyva.live** (~10 min)
- **PWA polish** — proper icons, splash screens
