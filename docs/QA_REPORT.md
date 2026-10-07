# Production Release QA Report

Audit date: October 7, 2026. Source baseline: `30b0c46`; fixes: `235f315`, `55b3e25`.

## Scope and evidence policy

The user explicitly requested skipping browser-dependent checks during this final audit. This report covers executable API checks, source inspection, automated tests, HTTP route checks, deployment statuses, and persistence across a Railway redeploy. Browser visuals, DevTools, keyboard interaction, incognito evaluation, real Google chooser/login, and inbox delivery are **not newly verified**. Earlier browser passes are historical evidence only.

## Reproduced defects and fixes

| Severity | Defect | Evidence | Fix / verification |
|---|---|---|---|
| P0 | Availability read and insertion were not serialized | Separate SQLite connections both created overlapping confirmed rows with a widened read/write gap | `235f315`: acquire `BEGIN IMMEDIATE` before availability; targeted tests and production races pass |
| P1 | Guest could bypass hosting promotion through host APIs | Production Demo Guest `POST /api/host/listings` returned 201; temporary probe removed | `55b3e25`: shared host-role dependency for every host route; targeted tests and production 403 check pass |

No frontend or concierge feature changes were made in this audit. No known unresolved P0/P1 defect remains within the tested API scope. Skipped checks are not treated as passing.

## Automated gates

- Backend: **100 passed in 9.27 seconds** on Python 3.10.9 / pytest 8.3.4.
- Frontend ESLint: no warnings/errors.
- TypeScript: `tsc --noEmit` passes.
- Production build: `next build` passes, including static generation and dynamic route compilation.
- Build used an isolated copy of tracked frontend files and production API origin, avoiding contention with the existing dev server.

## Production API audit

**198 successful checks** covered demo login, cookie attributes, auth/me, anonymous protected behavior, exact-origin credentialed CORS, Google preflight, malformed Google-token handling, public Google client configuration, seed inventory, location casing/whitespace/unknown search, every returned category, filters/sort, details/reviews/availability, address omission, rating consistency, coordinates, favorites, and host ownership/role denial.

Cookies: HttpOnly, Secure, SameSite=None, path `/`; exact Vercel CORS origin with credentials. Anonymous auth/me/favorites/trips/conversations/host calls returned expected 401. Malformed Google credentials returned 401; this does not prove a fresh real Google login.

Additional production API workflow verified host create/edit/public update, dashboard revenue/reservation changes matching booking snapshots, guest–host messages/reply, participant Trips/reservations, same-account host promotion retaining history, then restoration of Demo Guest role.

## Booking concurrency

- Users: Demo Guest, user 1; Demo Host, user 2. Independently authenticated HTTP clients with separately issued cookies. Same-user double submit used user 1 intentionally.
- Method: thread pool plus start barrier; real HTTPS POST requests to the deployed API.
- **14 scenarios / 28 requests: 16 × 201, 12 × 409.**
- Five exact-date races: one winner/one conflict each.
- Inside, beginning, end, surrounding overlap races: one winner/one conflict each.
- Adjacent intervals, both orders: two successes each.
- Same-user double submit: one success/one conflict.
- Cancel/rebook and repeat competition for the freed interval: one winner/one conflict each.
- **500 count: 0; lock errors: 0; double bookings: 0.**
- Winning price snapshots sum correctly. Losing users cannot read/cancel another user's booking on an unrelated host's listing.
- Active overlapping count was checked through both users' Trips responses, deduplicated by booking ID. Direct Railway database access was unavailable; file-backed automated tests also inspect database rows.
- Production three-user race was skipped because no third authenticated production identity was available without real Google browser login. A three-user automated race passes.
- Only the race winner sends confirmation mail in a mocked-provider regression. Production demo accounts skip email.
- QA bookings on original listings were cancelled, preserving honest cancellation history and restoring availability. Temporary role-gate probe listing was deleted.

Result: **PASS for the exercised production race invariant**.

## Concierge grounding

| Request | Observed intent | Results |
|---|---|---|
| India | location India | 0 |
| Beachfront villa in Greece for 4 with a pool | Greece, 4, Villa, Beachfront, Pool | 0 |
| Cheapest places in Lisbon | Lisbon, price_asc | 1 real listing |
| Antarctica, 50 guests, under $1, pool | Antarctica/50/Villa/Pool | 0 |

All result IDs belonged to existing inventory. No provider code was changed. Railway logs were not accessed; these responses do not independently prove the Gemini HTTP status of each call.

## HTTP and source checks

Production home, help, privacy, terms, representative listing, Trips, Wishlist, host, and messages route shells returned 200. Random path returned 404. Nonexistent positive listing IDs return a client route shell (200), while the listing API returns 404; rendered error UX was skipped. No localhost API reference appeared in the fetched route HTML. `/api/health` returned `{"status":"ok"}`, `/docs` and `/openapi.json` returned 200, and a sample OpenStreetMap tile returned 200.

Source inspection confirms client-only Leaflet, single property pin, directions URL fallback, credentialed fetch, anonymous favorites gating, and matching cookie deletion. This is not a functional map, popup, refresh, or focus test.

## Persistence across redeploy

Before the redeploy trigger was pushed, production QA state was recorded: 32 original seed IDs, favorite on listing 5, edited temporary host listing 33, confirmed booking 37 (code JY0T3V53, total 82,260 cents), conversation 3 with guest and host messages, and cancelled original-listing booking 35.

Railway reported revision `1d1b625` successfully deployed (deployment `78421404-45bc-422a-ad72-0854d23c0fe8`). All recorded data survived: the original 32 seed IDs, favorite, two-message conversation, confirmed booking and its 82,260-cent snapshot, cancelled booking, and edited host listing. Health returned 200. Fresh demo sessions worked; cookie continuity from a pre-restart browser session was not tested. Cancelling the temporary booking freed availability and removed its revenue from host metrics; logout/relogin worked with matching cookie deletion flags. The temporary listing, its booking/thread, and added favorite were removed; inventory returned to the original 32 IDs.

**PASS: SQLite data persistence across service redeploy/process replacement.** A separate dashboard Restart action and post-restart Google browser login were not performed.

## Integration limits

- Google production login was confirmed by the user before this audit. Current config, preflight, malformed-token behavior and mocked Google auth tests pass; no fresh real login/refresh/reuse was performed here.
- Real Resend confirmation and cancellation inbox delivery were not reverified. Demo accounts deliberately skip email. Provider failure/no-rollback and idempotency cases pass in automated tests.
- Map rendering, directions navigation, galleries/share, compact-header interactions, 1440/1280/1024/768/430/390 visuals, keyboard focus, browser refresh, console/network inspection and fresh-incognito flow were skipped.

## Repository hygiene

A pattern scan of 168 tracked files and the last 20 commits found no Google API key, Resend key, GitHub token, JWT, or private key patterns. No real env file or database is tracked. Development defaults in examples are intentional; this pattern scan is not a guarantee that every possible credential format is detected.

README/design docs reflect deployed architecture and current test counts. Public GitHub rendering and visual Mermaid rendering are browser checks and are skipped; source/link validation is performed separately.

## Release decision

The tested API scope passes with no known unresolved P0/P1. The requested browser-free audit can be completed; **full original acceptance remains unverified** because browser and real email checks were excluded. Do not represent this as a complete live visual/Google/inbox certification.
