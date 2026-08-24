# ZYVA v17.1 — Public-data privacy and venue contact actions

## Included

- Replaced broad anonymous event and venue database selections with explicit public-field allowlists.
- Anonymous list, detail API and server-rendered event pages now expose only approved event display data and intentionally public venue details.
- Private organizer contact name, email and phone remain available only in authenticated organizer/admin workflows.
- User/reviewer identifiers, internal costs, rejection notes and operational timestamps are excluded from public event responses.
- Pending events are unavailable through the public list, detail API and event page, even when someone knows the slug.
- Added optional bilingual new-venue fields for:
  - Your venue Instagram
  - Your venue Facebook page
  - Your venue website
  - Your public booking phone
- The form clearly separates private organizer contact details from public venue details.
- Server-side validation and normalization accept safe Instagram profiles, Facebook pages, public HTTP(S) websites and phone numbers.
- Newly submitted venue details are saved on the venue record; organizer-created venues are unverified and their events remain pending until admin approval.
- Selecting an existing venue uses its saved canonical details. Event submission cannot silently rewrite another venue.
- Public actions open the venue's Instagram profile, Facebook page and website, while the booking phone uses a `tel:` device-dialer link.
- The free manual Greek-description workflow is clarified in both languages. No Google account, API key or billing is required.
- The permanent black/neon-green interface, Filters, Map/List views, Recommended listings and two-stage organizer/event approval flow remain intact.

## Database changes

No new v17.1 migration is required for the current production database. This release uses the existing venue contact columns and the `description_el` column already added for v17.

## Verification

- `npm run build` passes on Node 24.
- OpenNext Cloudflare build passes.
- Wrangler dry run recognizes 121 assets and a 1,249.43 KiB gzip Worker bundle, below the Workers Free compressed-script limit.
- npm production audit reports 0 vulnerabilities.
- English and Greek dictionaries have matching non-empty key sets (383 keys per language).
- Public list/detail API privacy checks pass.
- Public server-rendered event HTML excludes private/internal field names.
- Pending-event list, API and page exclusion checks pass.
- Instagram, Facebook, website and `tel:` action checks pass.
- Public venue URL/phone normalization and invalid-input rejection checks pass.
- Unauthenticated organizer submission remains blocked with HTTP 401.

## Deployment

Follow `SETUP-CLOUDFLARE.md`. The production `description_el` migration has already been completed. Do not add a translation-service key for the selected manual workflow.

After deployment, complete the click-by-click production checks before outreach. Remove or replace all test listings, including any event titled `Test` or using an `example.com` ticket URL.
