# ZYVA v17 — English / Greek setup

Do these steps only after the v17 ZIP has been reviewed and before deploying v17.

## 1. Add the Greek-description database column

1. Open the ZYVA project in Supabase.
2. Open **SQL Editor** → **New query**.
3. Open `supabase/bilingual-migration.sql` from this release and paste its contents.
4. Select **Run**.

The migration is idempotent: running it more than once is safe.

## 2. Automatic Greek descriptions (Google Cloud Translation)

ZYVA never translates an event title. The English description remains the main submitted description. Organizers and admins can add an optional Greek description manually.

When an admin approves an event with no Greek description, the server calls Google Cloud Translation once and saves the result in `events.description_el`. It is not translated again on every page view. Admins can edit the saved Greek text afterward.

The implementation uses the supported Google Cloud Translation API v2. Automatic translation requires a private `GOOGLE_TRANSLATE_API_KEY` runtime secret. Never name it `NEXT_PUBLIC_*` and never put it in the ZIP or GitHub.

Until that key is configured, an admin can still approve an event by entering its Greek description manually. If both the Greek description and API key are missing, approval stops with a clear message instead of publishing an untranslated listing.

### Cloudflare secret location

Cloudflare dashboard → **Workers & Pages** → **zyva** → **Settings** → **Variables and Secrets** → **Runtime** → add:

- Name: `GOOGLE_TRANSLATE_API_KEY`
- Type: Secret
- Value: the private Google Cloud Translation API key

This is a runtime secret, not a Workers Builds variable. A new source build is not required when only this runtime secret changes, but deploy v17 only after the database migration has run.

## 3. How language selection works

- English is the default for a first visit.
- The accessible **EN / ΕΛ** control is in the hamburger drawer.
- The choice is stored in the browser as `zyva-language` and remains selected on later visits.
- Event titles are displayed exactly as submitted in both languages.
- In Greek mode, ZYVA displays `description_el` when available and safely falls back to the submitted description otherwise.
- Internal category and city values remain unchanged for filters and database queries; only their visible labels are translated.

## 4. Required pre-deployment checks

- Run `npm run build`.
- Run `npm run cf:build` with Node 22 or newer.
- Test the EN / ΕΛ selector after changing pages and refreshing.
- Test citizen sign-in, saved events, organizer application, organizer submission, admin organizer approval, event approval, edit, rejection and deletion.
- Confirm an organizer cannot mark an event as Recommended.
- Confirm the admin can edit both descriptions and only the admin can set Recommended.
- Keep the current Netlify site unchanged until Cloudflare v17 passes all tests.
