# QA Report

Exhaustive release-audit pass. Issues were fixed and re-verified, not just logged.

## Automated baseline (start of QA)
- Backend: **63 pytest tests pass**
- Frontend: TypeScript clean · ESLint clean · production build clean
- Git: clean working tree; no tracked `.env`, `app.db`, or secrets

## Database / seed integrity (clean reseed)
- 23 users · 32 listings · 160 images (5/listing) · 22 amenities · 15 bookings · 177 reviews ·
  4 favorites · 2 conversations · 5 messages
- No junk titles (`Test`/`Sample`/`New`), no orphan images, no duplicate favorites, no listing
  without images, 32/32 unique coordinates, no reversed/zero-night bookings, no out-of-range
  review ratings, all three demo identities present.

## Security / authorization (27/27 automated probes pass)
- Auth required on `/trips`, `/favorites`, `/conversations`, `/host/*` (401 when anonymous).
- IDOR blocked server-side: a host cannot edit/delete another host's listing (403); a user
  cannot read another user's reservation (403) or conversation (403).
- Validation enforced server-side: reverse/zero-night/past dates, guest count 0 and over
  capacity, invalid listing id → 404, non-integer id → 422, `page_size > 48` → 422.
- XSS: user text (messages, etc.) is stored verbatim and rendered as **escaped text** by React;
  no `dangerouslySetInnerHTML`/`innerHTML` anywhere.
- No secrets committed; `localhost` appears only as overridable env defaults.

## Console / network
- No browser console errors across anonymous, guest and host routes.
- All API requests return 2xx during representative flows; no 4xx/5xx, no runaway polling.

## Findings by severity

### P0 — release blockers
None.

### P1 — major (fixed)
- **Broken listing images on the home grid (~6/25).** Root cause: Next's dev image optimizer
  returns corrupt thumbnails for some remote Unsplash images under concurrent load (200 status,
  so `<img>` `onError` never fires). **Fix:** serve remote imagery unoptimized (raw URLs load
  reliably) + a `SafeImage` wrapper that falls back to a placeholder on genuine failure.
  **Verified:** 0 broken images on home grid (25) and listing gallery (19).

### P2 — quality (fixed)
- **Stale README claims:** host-ownership table said "~16 listings" (pre-rebalance) and a
  "Live demo" section implied deployment. Updated to the real 6-host distribution and an
  explicit "not yet deployed" note; documented the unoptimized-image decision.

### P3 — polish
- Map popup uses a raw `<img>` (acceptable inside a Leaflet popup; no optimizer involved).

## Responsive
- No horizontal page overflow at 375/390 on home, listing detail (map + swipeable gallery),
  checkout, messages thread, trips, host. Category bar centers at 1440/1280/1024 and scrolls
  cleanly at 768.

## Google OAuth
- Implementation/config ready via `GOOGLE_CLIENT_ID`; when unconfigured the Google button is
  simply hidden and demo access stays prominent (no technical warning). **Live production OAuth
  must be configured and smoke-tested after deployment URLs exist** — deferred by design.

## Accepted limitations
- No standalone `/hosts/{id}` profile page (deferred; host details surface on the listing).
- No Playwright E2E (behavior covered by 63 backend tests + manual critical-flow checks).
- SQLite (appropriate for the assignment; Postgres is the documented production path).
