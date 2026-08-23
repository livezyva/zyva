# 📸 SETUP — Photo uploads via Supabase Storage (~5 min)

The event form now has a green **"Upload photo from your device"** button.
Before it works in production, you need to create the storage bucket in Supabase.

Free tier: 1 GB storage (thousands of event photos).

---

## Step 1 — Create the storage bucket (2 min)

1. Open **https://supabase.com/dashboard** → your **zyva** project
2. Left sidebar → **Storage** (folder icon)
3. Click **"New bucket"** (top right)
4. Fill in:
   - **Name:** `event-covers` (exactly this, lowercase, with hyphen)
   - **Public bucket:** ✅ **TOGGLE ON** (so images are viewable by everyone)
   - **File size limit:** leave default (or set to 5 MB)
   - **Allowed MIME types:** leave empty (or add `image/jpeg,image/png,image/webp`)
5. Click **Save**

You should now see `event-covers` in the buckets list, with a green "Public" badge.

---

## Step 2 — Add upload permissions (2 min)

Right now anyone can VIEW images (because Public), but no one can UPLOAD.
We need to allow signed-in users to upload.

1. Left sidebar → **SQL Editor** → click **+ New query**
2. Paste this and Run:

```sql
-- Allow anyone to read (already implied by Public bucket, but explicit)
CREATE POLICY "Anyone can view event covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-covers');

-- Allow any signed-in user to upload
CREATE POLICY "Authenticated users can upload event covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-covers');

-- Allow uploaders to delete their own uploads (optional but nice)
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-covers' AND auth.uid() = owner);
```

3. Click **Run** — should say **Success. No rows returned**

---

## Step 3 — Push v12 code and test

If you haven't pushed v12 yet, do it now:

```
git add .
git commit -m "Photo upload + new categories (Bars, Restobar, Live Music)"
git push
```

Wait ~3 min for Netlify rebuild.

## Step 4 — Test

1. Sign in as an organizer (marinosk2009 or livezyva)
2. Go to **+ New event**
3. Step 2 (Cover image) — you'll now see a big green **"Upload photo from your device"** button
4. Click it → pick any photo from your phone/laptop
5. Watch the progress bar (10%, 40%, 90%, 100%)
6. Preview appears below
7. Continue through the wizard
8. Submit → event is created with your uploaded photo as the cover

---

## What happens under the hood

When a user picks a photo:
1. Client-side: image is resized to max 1600px on longest side
2. Client-side: converted to JPEG at 82% quality
3. Uploaded to your `event-covers` bucket with a random filename
4. Public URL is auto-generated and saved as the event's `cover_image_url`

**Result:** typical 4 MB phone photo → ~200-400 KB after compression. Fast to
upload, fast to display, no bandwidth waste.

---

## Categories added

The event form and homepage filter now include 3 new categories:

- 🎸 **Live Music**
- 🍹 **Bars**
- 🍸 **Restobar**

Plus the existing:
- 🎧 Clubs & Nightlife
- 🍽️ Restaurants & Dining
- 🏝️ Beach Bars
- 🎪 Festivals & Concerts
- 🎭 Cultural & Pop-ups

Existing events keep their existing category.

---

## Common issues

**"Upload failed: new row violates row-level security policy"**
→ Skipped Step 2. Run the SQL policies above.

**"Upload failed: The resource already exists"**
→ Won't happen normally (we use random filenames), but if it does just retry.

**"Please pick an image file"**
→ You picked a non-image (PDF, video, etc). Only JPG/PNG/WebP allowed.

**"File too big (max 5 MB before compression)"**
→ Original file is over 5 MB. Take a lower-res photo or use an image compression app first.

**Uploaded but shows broken image**
→ Bucket isn't Public. Go back to Step 1 and toggle "Public bucket" on for `event-covers`.

---

## Also — publish Google OAuth (1 min)

While you're at it, right now only test users can sign in with Google.
To let ANY Gmail user sign up:

1. Open **https://console.cloud.google.com/apis/credentials/consent**
2. Make sure your **zyva** project is selected (top-left)
3. Under "Publishing status", click **"PUBLISH APP"**
4. Confirm — publishes instantly (we don't ask for sensitive scopes)

Done. Any Gmail user can now use "Continue with Google" on `/auth`.

**Cost:** €0, forever.
