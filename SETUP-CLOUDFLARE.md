# ZYVA — Cloudflare Workers deployment

This version keeps the existing Netlify site untouched while deploying the same ZYVA application to Cloudflare Workers with OpenNext.

## What changed

- Next.js upgraded from 14.2.5 to 16.3.2.
- React upgraded from 18 to 19.
- React-Leaflet upgraded for React 19 compatibility.
- Cloudflare OpenNext and Wrangler added.
- Supabase Postgres is accessed through Cloudflare Hyperdrive.
- Next.js 16 asynchronous route parameters are supported.
- The optional local SQLite adapter remains available outside Cloudflare.
- The Cloudflare Worker is configured in `wrangler.jsonc`.
- Nightly cleanup can move from Netlify to Supabase Cron.

## Existing Hyperdrive configuration

- Name: `zyva-supabase`
- Binding used by the code: `HYPERDRIVE`
- Configuration ID: `3f99371e1df14e7594d90305ffa24162`
- Query caching: disabled intentionally so event edits and approvals appear immediately.

Do not commit or share the origin database password or full origin connection string.

## Cloudflare build settings

Connect the GitHub repository `livezyva/zyva` to a Cloudflare Workers Builds project.

Use:

- Root directory: `/`
- Node version: `22` or newer (the project declares `node >=22`)
- Build command: `npm run cf:build`
- Deploy command: `npm run cf:deploy`

The build creates a standard OpenNext Worker. `cf:deploy` uses `--keep-vars` so runtime values created in Cloudflare are not removed by later deployments.

## Workers Builds variables

Add these in Cloudflare's **Build → Variables and secrets** section. Next.js needs every `NEXT_PUBLIC_*` value while it compiles the browser application.

- Secret: `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` = the private direct PostgreSQL URL for `zyva_cloudflare` on port 5432 with `sslmode=require`
- Secret: `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the same legacy anon key used in Netlify
- Text: `NEXT_PUBLIC_SUPABASE_URL=https://gmelqqasahwnqlnupacl.supabase.co`
- Text: `NEXT_PUBLIC_ADMIN_EMAILS=livezyva@gmail.com`

Never put the database URL, password, or Google Translation key in a `NEXT_PUBLIC_*` variable.

The following non-secret runtime values are already declared in `wrangler.jsonc`:

- `NEXT_PUBLIC_SUPABASE_URL=https://gmelqqasahwnqlnupacl.supabase.co`
- `NEXT_PUBLIC_ADMIN_EMAILS=livezyva@gmail.com`
- `ADMIN_EMAILS=livezyva@gmail.com`

For v17 automatic Greek descriptions, add `GOOGLE_TRANSLATE_API_KEY` as an encrypted **Runtime** secret. See `SETUP-BILINGUAL.md`. It is not a build variable.

## Hyperdrive binding

`wrangler.jsonc` binds the existing Hyperdrive configuration as:

```text
HYPERDRIVE
```

Do not add `DATABASE_URL` to Cloudflare. The Worker receives a temporary pooled connection string from the Hyperdrive binding.

Netlify must continue using its existing Supabase Transaction Pooler `DATABASE_URL` on port 6543. Cloudflare Hyperdrive is the only exception: its origin configuration uses Supabase Direct Connection on port 5432 because Hyperdrive performs its own pooling.

## Supabase Auth URLs after Cloudflare provides a URL

After the first deployment, Cloudflare provides a `*.workers.dev` address. In Supabase:

1. Open **Authentication → URL Configuration**.
2. Keep the existing Netlify URL while testing.
3. Add the Cloudflare callback URL to **Redirect URLs**:

```text
https://YOUR-WORKER.workers.dev/auth/callback
```

4. Also add:

```text
https://YOUR-WORKER.workers.dev/auth/reset
```

Do not change the primary Site URL until the Cloudflare deployment passes all tests.

## Nightly cleanup

After Cloudflare is confirmed stable, run:

```text
supabase/cloudflare-migration.sql
```

in the Supabase SQL Editor. It schedules the same deletion policy at 02:00 UTC: events are removed seven days after their end time.

## Required production tests

Test these before directing users to Cloudflare:

1. Homepage event list loads.
2. Recommended carousel loads.
3. Filters and search work.
4. Map and List views work.
5. Event details and directions work.
6. Email/password and Google sign-in work.
7. `livezyva@gmail.com` is detected as ADMIN.
8. Admin event create/edit/delete/Recommend work.
9. Organizer application approval and rejection work.
10. Organizer event submission and admin approval work.
11. Supabase Storage photo upload works.
12. Saved events work.
13. Hamburger navigation and all role-aware links work.

Keep Netlify online until every item passes.

## Local verification commands

```bash
npm ci
npm run build
npm run cf:build
npm audit --omit=optional
```

The verified Cloudflare bundle is approximately 1.2 MiB compressed, under the 3 MiB Workers Free limit at the time this version was prepared.
