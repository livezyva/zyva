# 🔑 Add Google Sign-In (15 minutes)

Follow these steps in order. All one-time setup.

Cost: **€0**. Google gives Sign-In free forever, no credit card required.

---

## What we're setting up

Three parts:
1. **Google Cloud Console** — tell Google "my app is allowed to use Google Sign-In"
2. **Supabase** — paste the credentials into Supabase so it can talk to Google
3. **Test** — click the button and log in

I already added the code (there's now a "Continue with Google" button on
your `/auth` page). It just needs the credentials to actually work.

---

## Step 1 — Create a Google Cloud project (3 min)

1. Go to **https://console.cloud.google.com**
2. Sign in with **livezyva@gmail.com** (or any Google account you want to own this project)
3. Top of the page, click the **project dropdown** (says something like "My Project" or has a project name in it)
4. Click **"New Project"**
   - **Project name:** `ZYVA`
   - **Organization:** leave as-is (or "No organization")
   - Click **Create**
5. Wait ~30 seconds while Google provisions the project
6. Once it's ready, click the notification bell → **Select Project** (or use the dropdown at the top to switch to `ZYVA`)

---

## Step 2 — Configure the OAuth consent screen (3 min)

Google needs to know what your app is called, what it does, and where to send users.

1. In the left sidebar (three-line menu top-left) → **APIs & Services** → **OAuth consent screen**
2. If asked which type of app:
   - Select **External** (this means anyone can sign up, not just people in your Google Workspace)
   - Click **Create**
3. Fill in **App information:**
   - **App name:** `ZYVA`
   - **User support email:** `livezyva@gmail.com`
   - **App logo:** skip for now (optional)
4. Scroll to **App domain** section:
   - **Application home page:** `https://zyva1.netlify.app`
   - **Application privacy policy link:** skip for now (you'll add later)
   - **Application terms of service link:** skip for now
5. **Authorized domains:** click **+ Add domain** → type `netlify.app` → press Enter
6. **Developer contact information:** put `livezyva@gmail.com`
7. Click **Save and continue**

**Next screen — Scopes:**
- Just click **Save and continue** (no changes needed)

**Next screen — Test users:**
- Click **+ Add users** → add `livezyva@gmail.com` (so you can test before publishing)
- Click **Save and continue**

**Final screen — Summary:**
- Click **Back to dashboard**

⚠️ **Your app is in "Testing" mode** right now. That's fine for launch — anyone whose email you add as a test user can log in. To let ANY Gmail user sign up, you'll later click **"Publish app"** on this same page (Google may ask for verification if your app collects sensitive data, but for basic Sign-In it usually publishes instantly).

For now, keep it in Testing mode. You can add more test users any time.

---

## Step 3 — Create OAuth credentials (3 min)

1. Left sidebar → **APIs & Services** → **Credentials**
2. Top of the page → click **+ Create credentials** → **OAuth client ID**
3. **Application type:** `Web application`
4. **Name:** `ZYVA Web Client`
5. **Authorized JavaScript origins:** click **+ Add URI** for each:
   - `https://zyva1.netlify.app`
   - `http://localhost:3000` (so it works when you test locally later)
6. **Authorized redirect URIs:** click **+ Add URI** and add this one:
   - `https://gmelqqasahwnqlnupacl.supabase.co/auth/v1/callback`
   
   ⚠️ **This is critical** — this is where Google sends users after they log in with Google. Supabase catches it and completes the sign-in.
7. Click **Create**

A popup appears with two long strings:
- **Client ID** — starts with numbers, ends with `.apps.googleusercontent.com`
- **Client Secret** — starts with `GOCSPX-`

**COPY BOTH INTO A NOTEPAD FILE** and save it. Label them:
```
GOOGLE CLIENT ID:
1234567890-abcdefg.apps.googleusercontent.com

GOOGLE CLIENT SECRET:
GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

You can always come back to Credentials to see them again if you lose the popup.

---

## Step 4 — Paste them into Supabase (2 min)

1. Go to **https://supabase.com/dashboard** → your zyva project
2. Left sidebar → **Authentication** (padlock 🔒 icon)
3. Sub-menu → **Providers**
4. Scroll down the list → find **Google** → click on the row (it expands)
5. Toggle **Enable Google provider** to **ON** (green)
6. Paste:
   - **Client ID (for OAuth):** paste your Google Client ID
   - **Client Secret (for OAuth):** paste your Google Client Secret
7. **Callback URL (for OAuth)** — Supabase shows you a URL like:
   ```
   https://gmelqqasahwnqlnupacl.supabase.co/auth/v1/callback
   ```
   Verify this matches what you added to Google in Step 3.7 above. If not, copy this one and go back to Google Cloud → Credentials → your OAuth Client → edit the redirect URI to match.
8. Scroll down → click **Save**

---

## Step 5 — Push the code and test (5 min)

The code has a new "Continue with Google" button on the `/auth` page.
You just need the latest zip (v8) pushed to GitHub, then wait for Netlify.

**In Git Bash inside your `zyva` folder:**

```
git add .
git commit -m "Add Google sign-in button"
git push
```

Netlify rebuilds in 2-3 min. Then:

1. Open **https://zyva1.netlify.app/auth**
2. You should see a big **"Continue with Google"** button above the email form
3. Click it → Google login popup appears
4. Sign in with **livezyva@gmail.com** (the test user you added)
5. Google redirects back to ZYVA, you're signed in
6. Look at the header top-right → you should see your avatar + the **★ Admin** button

---

## Common issues

**"Access blocked: This app's request is invalid"**
→ The redirect URI in Google doesn't match Supabase. Go back to Step 3.7 and 4.7 and make sure the URLs are IDENTICAL (character-for-character).

**"Error 403: access_denied" or "This app isn't verified"**
→ You're not in the test users list. Google Cloud Console → APIs & Services → OAuth consent screen → Test users → add your email.

**Button does nothing / spinning forever**
→ Google credentials aren't saved in Supabase. Go back to Step 4 and make sure both Client ID and Client Secret are filled in, and toggle is ON.

**"redirect_uri_mismatch"**
→ Same as first issue. The URL Google is being asked to redirect to doesn't match what you told it to allow. Fix by pasting the exact Supabase callback URL into both places.

---

## To let ANY Gmail user sign up (not just test users)

When you're ready to launch publicly:

1. Google Cloud Console → APIs & Services → OAuth consent screen
2. Top of the page → click **"Publish app"**
3. Google may ask you to verify your app if you're using sensitive scopes (you're not — you're only using basic profile/email), so it usually publishes instantly
4. Now anyone with a Gmail account can click "Continue with Google" and sign up

Do this whenever you're ready to open the doors publicly. Until then, only test users can use Google Sign-In (but email/password still works for everyone).
