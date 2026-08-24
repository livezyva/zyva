# ZYVA v17.1 — English / Greek setup

ZYVA runs in the selected **free manual Greek-description mode**. No Google account, translation API key, billing account or paid translation service is required.

## 1. Greek-description database column

The production database already received this migration for v17. For a fresh database only:

1. Open the ZYVA project in Supabase.
2. Open **SQL Editor → New query**.
3. Open `supabase/bilingual-migration.sql` from this release and paste its contents.
4. Select **Run**.

The migration is idempotent, so running it more than once is safe.

## 2. Manual Greek-description workflow

- Event titles remain exactly as submitted and are never translated.
- Organizers may provide the Greek event description when submitting an event, but it is optional for them.
- Before approval, a ZYVA admin must add or review the Greek description.
- If an admin tries to approve an event with no Greek description, approval stops with a clear message asking for the Greek text.
- Do **not** add a `GOOGLE_TRANSLATE_API_KEY` for the selected free manual workflow.

## 3. Language selection

- English is the first-visit default.
- The accessible **EN / ΕΛ** selector is in the hamburger drawer.
- The browser saves the selection as `zyva-language`.
- Greek mode shows `description_el` when available and safely falls back to the submitted description for older listings.
- Internal category and city values stay unchanged; only visible labels are localized.

## 4. Required checks after deployment

- Test the EN / ΕΛ selector after changing pages and refreshing.
- Test citizen sign-in, saved events, organizer application and organizer event submission.
- Confirm organizer contact name, email and phone remain private and admin-only.
- Submit a new venue with optional public Instagram, Facebook, website and booking-phone details.
- Confirm those four venue details appear only after event approval and open the intended profile, page, site or device dialer.
- Confirm selecting an existing venue does not let an organizer replace that venue's saved details.
- Confirm an organizer cannot mark an event as Recommended.
- Confirm an admin can edit both descriptions and only an admin can set Recommended.
