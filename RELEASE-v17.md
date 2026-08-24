# ZYVA v17 — Bilingual English / Greek release

## Included

- Persistent, accessible **EN / ΕΛ** selector in the hamburger drawer.
- English remains the first-visit default.
- Greek and English interface text across discovery, filters, List/Map views, Recommended cards, saved events, event details, authentication, organizer application, organizer dashboard/forms, admin dashboard/forms, statuses, validation and user-facing messages.
- Canonical database filter values remain unchanged while category and city labels are localized.
- Event titles always remain exactly as submitted.
- Optional `description_el` field in organizer and admin event forms.
- Greek mode displays the saved Greek description and falls back safely to the submitted description when an older listing has not yet been translated.
- Missing Greek descriptions are translated once through the supported Google Cloud Translation API during admin approval, saved in Supabase, and remain editable by admins.
- Approval stops safely when both the Greek description and translation runtime secret are missing; an admin can always enter the Greek text manually.
- Existing black/neon-green ZYVA design, role-aware drawer, Filters, Map/List, Recommended, cards and listings remain intact.

## Database and runtime setup

Before deploying v17, follow `SETUP-BILINGUAL.md`:

1. Run `supabase/bilingual-migration.sql` in Supabase.
2. For automatic translations, add `GOOGLE_TRANSLATE_API_KEY` as a private Cloudflare Runtime secret. Manual Greek descriptions work without it.

Never commit API keys, database passwords, `.env` files or `.dev.vars` files.

## Verification completed for this ZIP

- Standard Next.js 16 production build passed.
- OpenNext Cloudflare build passed and generated `.open-next/worker.js`.
- Wrangler dry run recognized 119 assets and the existing Hyperdrive binding.
- Worker bundle measured 6196.37 KiB raw / 1244.59 KiB gzip, below Cloudflare Workers Free's 3 MiB compressed-script limit.
- npm production audit reported 0 vulnerabilities.
- Public pages and local event APIs returned HTTP 200.
- Unauthenticated organizer submission remained blocked with HTTP 401.
- Local bilingual event-description database round-trip passed.
- English and Greek dictionaries contain matching non-empty key sets.

This source release has not been pushed to GitHub or deployed to Cloudflare.
