# Current Production Release — October 7, 2026

This section supersedes the historical deployment handoff below. Current repository and production behavior are authoritative.

- Public repository: https://github.com/Apoorvan-A/StayFinder; branch `master`.
- Frontend: https://stay-finder-alpha-neon.vercel.app — Vercel.
- Backend: https://stayfinder-api-production-5645.up.railway.app — Railway.
- API docs: https://stayfinder-api-production-5645.up.railway.app/docs.
- SQLite: `/var/data/stayfinder.db` on persistent `/var/data`; `SEED_ON_STARTUP=0`; one backend instance.
- Google Identity Services, demo guest/host, Gemini and Resend integrations are implemented. Production Google login was confirmed before this final audit; current real inbox delivery is not certified.
- `235f315` serializes SQLite booking creation with `BEGIN IMMEDIATE`.
- `55b3e25` requires the host role on every hosting API route.
- `1d1b625` triggered a Railway redeploy; recorded favorites/messages/bookings/host edits and all 32 original listing IDs survived. Temporary fixtures were removed.
- Gates: 100 backend tests; frontend lint, typecheck, production build pass.
- Production API audit: 198 checks; 14 race scenarios, 16 successes/12 conflicts, no double booking/500/lock errors.
- Final audit browser scope was excluded explicitly; do not promote old browser results to new production verification. Read `QA_REPORT.md` for evidence and limits.
- Feature development remains frozen. Only demonstrated bugs or factual documentation corrections are in scope.
- Git author for deployments: `Apoorvan A`, verified email `apoorvan.a2023@vitstudent.ac.in`. Check deployment status after pushes rather than assuming success.

## Historical handoff (superseded)

The remaining content is retained as historical context. Its pending configuration, old revision, private-repository, initial-push and deployment steps are obsolete; do not execute them as a current plan.

---

# StayFinder — Deployment Handoff

For another coding agent to continue without this conversation's history. Base every action on
the **actual repository**; verify with `git status`/`git log` before changing anything.

---

## 1. Project summary

StayFinder is an original, Airbnb-style property-rental marketplace built as an SDE full-stack
take-home. Guests browse/search/filter stays, view rich listing pages, book a date range (with
real availability + server-computed pricing), manage trips, favorite/wishlist, message hosts,
and use an **AI Concierge** for natural-language discovery; hosts create/edit/delete listings
and see a dashboard, reservations and messages.

**Status:** feature-complete and release-audited (exhaustive QA already done). **Feature freeze
is in effect** — only deployment-required changes should be made now. Nothing has been pushed or
deployed yet.

Major flows (all working): browse → search → filter → listing → book → checkout → confirmation
→ trips → reservation detail (exact address + Google Maps directions); favorites/wishlist;
guest↔host messaging; host become-host → CRUD → dashboard/reservations; AI concierge;
transactional booking/cancellation emails.

---

## 2. Tech stack

**Frontend** — Next.js **14.2.35** (App Router), TypeScript (strict), Tailwind CSS, SWR, Lucide,
react-day-picker, Sonner, Leaflet/react-leaflet, date-fns, clsx/tailwind-merge.
**Backend** — FastAPI, SQLAlchemy 2.0 (typed), Pydantic v2, SQLite, Uvicorn, itsdangerous
(signed cookies), google-auth, httpx; pytest.

**External integrations:**
- **IMPLEMENTED** (works locally now): Leaflet/OpenStreetMap maps; Google Maps *directions*
  external link; AI concierge deterministic fallback; email service with graceful skip.
- **IMPLEMENTED BUT REQUIRES PRODUCTION CONFIG**: Google OAuth sign-in (needs `GOOGLE_CLIENT_ID`
  + authorized origins); Gemini concierge (needs `AI_API_KEY`); Resend email delivery (needs
  `EMAIL_API_KEY` + verified sender; real recipients need Google sign-in).
- **INTENTIONALLY OMITTED**: Redis/queues/workers, WebSockets, real payments, Postgres,
  Docker requirement, Playwright E2E, public `/hosts/{id}` profile page, password/OTP auth,
  multiple OAuth providers.

---

## 3. Repository structure

```
backend/
  app/
    main.py              # FastAPI app, CORS, lifespan (create_all + seed_if_empty)
    config.py            # Settings (env-driven); get_settings() (lru_cached)
    database.py          # engine, SessionLocal, Base, get_db (SQLite FK pragma)
    deps.py              # DbSession, CurrentUser/OptionalUser, session cookie helpers
    errors.py            # AppError hierarchy + handlers ({error:{code,message}})
    serializers.py       # ORM -> ListingCard/ListingDetail/HostListingDetail
    seed.py              # idempotent seed (32 listings, 6 hosts, demo users, messages)
    models/              # user, listing(+image), amenity, booking, review, favorite, message
    schemas/             # pydantic: user, listing, booking, review, message, concierge, common
    services/
      listing_service.py booking_service.py availability.py pricing.py
      host_service.py favorite_service.py review_service.py messaging_service.py
      auth_service.py    # session token sign/verify, Google verify, demo users
      concierge/         # fallback.py (parser), provider.py (GeminiProvider), service.py
      email/             # provider.py (ResendProvider), templates.py, service.py
    routers/             # health, auth, listings, bookings, favorites, host, messages, concierge
  tests/                 # pytest: listings, bookings, ownership, favorites, host_crud, auth,
                         # messaging, concierge, emails  (conftest.py = in-memory DB + helpers)
  requirements.txt  pytest.ini  .env.example
frontend/
  src/
    app/                 # routes (see section 6); layout.tsx, globals.css, icon.svg, not-found
    components/          # Navbar, SearchBar(search/), CategoryRow, ListingCard/Grid, FilterModal,
                         # SafeImage, map/ (PropertyMap, ResultsMap), listing/, trips/, host/,
                         # messaging/, concierge/, auth/, ui/ (Container, Modal), EmptyState…
    hooks/               # useAuth, useFavorites, useConcierge
    lib/                 # api.ts (typed fetch client), format.ts, cn.ts, icons.tsx, constants.ts
    types/               # index.ts (all shared TS types)
  package.json  tsconfig.json  next.config.mjs  tailwind.config.ts  .env.example  .env.local
docs/                    # ARCHITECTURE, DATABASE_DESIGN, API_DESIGN, TEST_STRATEGY,
                         # AIRBNB_DESIGN_ANALYSIS, PROJECT_PLAN, QA_REPORT, QA_TEST_MATRIX, HANDOFF
render.yaml              # (legacy Render blueprint; deployment target is now Railway — see §15)
README.md  .gitignore  .gitattributes
```

API client: `frontend/src/lib/api.ts` (`apiGet`/`apiSend`/`fetcher`, `credentials:"include"`,
`NEXT_PUBLIC_API_URL`). Backend entry: `backend/app/main.py`.

---

## 4. Architectural decisions (do not casually undo)

**Booking (`services/booking_service.py`, `availability.py`, `pricing.py`):**
- Server-authoritative **availability** with **half-open `[check_in, check_out)`** intervals;
  overlap = `existing.check_in < req.check_out AND existing.check_out > req.check_in`.
- Create is **transactional** and **re-checks conflicts** inside the transaction → `409`.
- **Server-authoritative pricing**; a **price snapshot** is frozen on each booking.
- Cancellation allowed **only before check-in**; cancelling frees the dates.

**Authorization:** identity is resolved **server-side from the signed session cookie**, never
from request body/IDs. IDOR is blocked for bookings, listings, conversations, favorites, host
resources (guest/host rules enforced in services + tested).

**AI Concierge:** the LLM **only** parses a structured `SearchIntent`; the backend validates and
**grounds** it in real inventory vocabulary and runs the existing search — **real DB listings
only**, availability-aware. **Deterministic fallback** parser when Gemini is unavailable. The
LLM never queries the DB or performs actions.

**Email:** booking is **committed before** any email attempt; email is best-effort and its
failure never rolls back a booking. **Idempotent** sends; **demo accounts never email strangers**.

**Database:** SQLite is intentional for this assignment; no Postgres migration before submission.
**Infra:** no Redis, queues, microservices, or Docker requirement.

---

## 5. Database model summary

SQLite; money stored as **integer cents**. Models (`backend/app/models/`):
- **User** — `id, name, email(unique), avatar_url, role(guest|host), is_superhost,
  is_demo_switchable, bio, host_since_year, response_rate, response_time, languages,
  provider(demo|google), provider_subject_id(unique), created_at`.
- **Listing** — host-owned; `nightly_price_cents, cleaning_fee_cents, max_guests, bedrooms, beds,
  bathrooms, property_type, category, check_in_time, check_out_time, area_description, address
  (private), latitude, longitude, rating/review_count(derived), is_guest_favorite, timestamps`.
  Indexes: city, nightly_price_cents, property_type, category. CHECK: price ≥ 0, guests ≥ 1.
- **ListingImage** (url, sort_order, alt_text) · **Amenity** / **ListingAmenity** (M2M, unique).
- **Booking** — `check_in, check_out, guest_count, status(pending|confirmed|cancelled)`, price
  snapshot columns, `confirmation_code(unique)`, **`confirmation_email_sent_at`**,
  **`cancellation_email_sent_at`**, timestamps. CHECK check_out>check_in; indexes
  (listing_id,status),(guest_id).
- **Review** (rating 1–5 CHECK, comment, author, optional booking_id) · **Favorite** (unique
  (user_id,listing_id)).
- **Conversation** (listing_id, guest_id, host_id; unique (listing_id,guest_id); indexes guest/host)
  · **Message** (conversation_id, sender_id, body, is_read, created_at; index (conversation_id,created_at)).

**Seeding:** `python -m app.seed` drops+recreates+seeds deterministically (32 listings across 6
hosts, 3 demo users, reviews, bookings, favorites, 2 conversations). On startup, `seed_if_empty`
seeds only an empty DB (gated by `SEED_ON_STARTUP`).

---

## 6. Routes / API

**Frontend routes:** `/`, `/listings/[id]`, `/checkout`, `/trips`, `/trips/[id]`, `/wishlist`,
`/messages`, `/messages/[id]`, `/host`, `/host/listings`, `/host/listings/new`,
`/host/listings/[id]/edit`, `/host/reservations`, `/help`, `/privacy`, `/terms`, plus a 404.

**Backend endpoint groups (prefix `/api`):**
- `GET /health`
- **auth**: `GET /auth/config|me`, `POST /auth/google|demo|become-host|logout`
- **listings**: `GET /listings` (search/filter/paginate), `/listings/{id}`,
  `/listings/{id}/availability|reviews`, `/listings/price-range`, `/categories`, `/amenities`
- **bookings**: `POST /bookings/quote|bookings`, `GET /trips|bookings/{id}`,
  `POST /bookings/{id}/cancel|message`
- **favorites**: `GET/POST/DELETE /favorites...`
- **host**: `GET /host/metrics|listings|reservations`, `GET/POST/PATCH/DELETE /host/listings...`
- **messages**: `GET/POST /conversations...`
- **concierge**: `POST /concierge`
Interactive docs at `/docs`. Most likely touched during deploy: `/health`, auth (CORS/cookies),
`/concierge`, bookings (email).

---

## 7. Authentication

Cookie-session auth. Anonymous users browse/search/view/map/reviews; booking, favorites, trips,
messaging and hosting require a session (polished auth modal, context preserved).
- **Demo Guest / Demo Host**: `POST /api/auth/demo {role}` → sets session for a built-in identity
  (Alex Morgan / Sofia Ramos). Self-heals role so "demo guest" is always a guest.
- **Google OAuth**: frontend gets an ID token via Google Identity Services → `POST /api/auth/google`
  → backend verifies with `google-auth`, **upserts a user keyed on provider subject id**, sets a
  signed **HttpOnly** cookie. When `GOOGLE_CLIENT_ID` is unset the Google button is simply hidden
  (demo stays prominent) — no error.
- Session: `itsdangerous`-signed cookie `sf_session`, HttpOnly, `COOKIE_SECURE`/`COOKIE_SAMESITE`
  configurable; backend resolves the user from it (`deps.py` + `auth_service.py`).
- **Guest → host**: `POST /api/auth/become-host` flips role on the same account (no duplicate user).

**Google OAuth production config is still pending — final production URLs are not yet set.**
Env vars used: `GOOGLE_CLIENT_ID` (backend; served to the frontend via `/api/auth/config`),
`SESSION_SECRET`, `COOKIE_SECURE`, `COOKIE_SAMESITE`.

---

## 8. Gemini AI Concierge

Files: `backend/app/services/concierge/{provider.py,fallback.py,service.py}`,
`backend/app/schemas/concierge.py`, `backend/app/routers/concierge.py`; frontend
`src/hooks/useConcierge.tsx`, `src/components/concierge/{ConciergePanel,ConciergeLauncher}.tsx`.

- **Provider abstraction**: `LLMProvider` protocol + **`GeminiProvider`** (Generative Language API,
  `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=…`,
  `responseMimeType=application/json` + `responseSchema=INTENT_SCHEMA`, temperature 0).
  `get_provider()` returns it when `AI_PROVIDER=gemini` + `AI_API_KEY` set.
- **Default model**: `gemini-3.8-flash` (`DEFAULT_GEMINI_MODEL`); override with `AI_MODEL`.
- **SearchIntent** fields: location, check_in, check_out, guests, min/max_price_cents,
  property_type, category, bedrooms, beds, amenities[], sort.
- **Fallback** (`fallback.py`): deterministic keyword/regex parser (word-boundary matching),
  used when no key or on **any** provider error/timeout/malformed response.
- `service.run()` validates/grounds the intent, maps amenity names→IDs, runs
  `search_listings` (availability-aware), returns real listings + interpretation + `query_string`
  (to open normal Explore). Example requests: "beachfront villa in Greece for 4 with a pool",
  "cozy cabin under $300", "lakefront cabin under $400", "cheapest places in Lisbon".
- **`AI_API_KEY` is NOT committed.** With no key, the deterministic parser runs.

---

## 9. Transactional email

Files: `backend/app/services/email/{provider.py,templates.py,service.py}`, triggered in
`backend/app/routers/bookings.py`.
- **Provider abstraction**: `EmailProvider` protocol + **`ResendProvider`**
  (`POST https://api.resend.com/emails`). `get_provider()` returns `None` when unconfigured → skip.
- **Confirmation**: sent best-effort **after** the booking commits (branded HTML + text: property,
  code, host, dates/nights/guests, full price, exact address + Get-directions, policy, "View
  reservation" CTA using `FRONTEND_URL`).
- **Cancellation**: sent after a successful cancellation.
- **Idempotency**: `Booking.confirmation_email_sent_at` / `cancellation_email_sent_at`.
- **Recipient** is always the authenticated user's email (`booking.guest.email`) — never a
  request-body address. **Demo accounts (`provider=="demo"`) are skipped.** Failures are logged
  (`logging`) and swallowed; booking stays confirmed.
Env vars: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`.
**Production email delivery is not yet configured/tested.**

---

## 10. Maps

- **Leaflet + OpenStreetMap tiles** (no API key), loaded client-only via dynamic import
  (`src/components/map/`). `PropertyMap` shows a single **pin** on the public listing
  (approximate city coordinates; **no exact street address** shown publicly) and the exact pin on
  a confirmed reservation. `ResultsMap` shows **price markers** for the current filtered listings
  (desktop split view + mobile fullscreen), with card↔marker highlighting.
- **Google Maps directions**: an external link `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
  shown only on confirmed reservations.
- **Attribution**: OpenStreetMap contributors attribution is included on the tiles — keep it.

---

## 11. Environment variables

Backend names come from `backend/app/config.py` / `.env.example`; frontend from `.env.example`.

| Variable | Local req? | Prod req? | Secret | Purpose | Where |
|----------|-----------|-----------|--------|---------|-------|
| `DATABASE_URL` | no (default sqlite:///./app.db) | yes (volume path) | no | DB location | backend |
| `CORS_ORIGINS` | no (localhost:3000) | yes (Vercel origin) | no | allowed origins | backend |
| `SEED_ON_STARTUP` | no (1) | typically 0 | no | seed empty DB on boot | backend |
| `SESSION_SECRET` | no (dev default) | **yes** | **yes** | sign session cookie | backend |
| `COOKIE_SECURE` | no (0) | yes (1) | no | secure cookie | backend |
| `COOKIE_SAMESITE` | no (lax) | yes (none, cross-site) | no | cookie SameSite | backend |
| `GOOGLE_CLIENT_ID` | no | for Google login | no (public) | OAuth client id | backend→frontend via /auth/config |
| `FRONTEND_URL` | no (localhost:3000) | yes (Vercel URL) | no | email link origin | backend |
| `AI_PROVIDER` | no | for Gemini | no | `gemini` to enable | backend |
| `AI_API_KEY` | no | for Gemini | **yes** | Gemini key | backend |
| `AI_MODEL` | no (default gemini-3.8-flash) | optional | no | model id | backend |
| `EMAIL_PROVIDER` | no | for email | no | `resend` to enable | backend |
| `EMAIL_API_KEY` | no | for email | **yes** | Resend key | backend |
| `EMAIL_FROM` | no (default onboarding@resend.dev) | yes (verified sender) | no | From address | backend |
| `NEXT_PUBLIC_API_URL` | yes (localhost:8000) | **yes** (Railway HTTPS) | no | backend base URL | frontend |

Do **not** put real secret values in the repo. `.env`/`.env.local` are gitignored.

---

## 12. Test / QA status (actually verified)

- Backend **pytest: 79 passed** (booking matrix, ownership/IDOR, favorites, host CRUD, auth,
  messaging, concierge [provider mocked], email [provider mocked]).
- Frontend **ESLint: clean**, **tsc --noEmit: clean**, **`next build`: clean** (18 routes).
- Security/authorization: 27 automated probes all passed (auth gating, IDOR, validation,
  pagination bounds, XSS stored-and-escaped); no `dangerouslySetInnerHTML`.
- Browser QA: exhaustive pass completed (routes, controls, console/network clean, responsive
  1440→375, a11y). See `docs/QA_REPORT.md` and `docs/QA_TEST_MATRIX.md`.

---

## 13. Known issues / accepted limitations

- Google OAuth production config pending (final URLs not set).
- Gemini `AI_API_KEY` not configured (deterministic fallback runs meanwhile).
- Resend `EMAIL_API_KEY`/verified sender not configured (delivery skipped meanwhile).
- No Playwright E2E. No public `/hosts/{id}` profile page.
- SQLite ⇒ **single-instance backend only** in production (no horizontal scaling).

---

## 14. Git state

- Branch **master**; HEAD **`1753664885572bb0cdfb9f7c7a8f0c95af996fce9`**; working tree **clean**.
- Recent meaningful commits (newest first):
  - `1753664` chore: default Gemini model → gemini-3.8-flash
  - `f637ccc` refactor: migrate concierge provider Anthropic → Gemini
  - `cf762ab` docs: concierge + email (README/architecture/.env.example)
  - `d899155` feat: transactional booking + cancellation emails
  - `d0d742e` feat: AI concierge (NL discovery over real inventory)
  - `713d612` QA: gallery image-button accessible names
  - `c117bb6` QA: QA report/matrix, README fixes, untrack build cache
  - `34390f9` QA: fix intermittently broken listing images (SafeImage + unoptimized)
  - `ba9b64f` center category nav; fix tablet header overflow
  - `4b4ad82` prominent centered search, listing map pin, compact booking card
- Nothing pushed to any remote yet.

---

## 15. Deployment target

```
GitHub → Railway (FastAPI backend) → Railway persistent volume (SQLite)
       → Vercel (Next.js frontend)
External: Gemini · Google OAuth · Resend
```
Requirements:
- Backend must bind **`0.0.0.0:$PORT`** (Railway provides `$PORT`).
- SQLite file on a **persistent Railway volume**; set `DATABASE_URL=sqlite:////data/app.db` (or the
  volume mount path). **DB must not reset on redeploy** → set `SEED_ON_STARTUP=0` after first seed,
  or seed once on the volume.
- Keep the backend **single-instance** (SQLite).
- Frontend `NEXT_PUBLIC_API_URL` → the Railway HTTPS URL.
- Production **CORS must allow the Vercel origin**; cross-site cookies need
  `COOKIE_SECURE=1`, `COOKIE_SAMESITE=none`. **Verify cross-origin auth/cookies in a real browser.**
- Secrets only in provider env settings — never in the repo.
- `render.yaml` is a legacy Render blueprint; the current target is Railway. Add Railway config as
  needed (or use the dashboard); don't let the Render file mislead.

---

## 16. Exact next steps (execution order)

1. Verify clean repo + secret scan (`git status`; grep for keys).
2. Push to GitHub (**initially private**).
3. Deploy backend to Railway (start cmd binds `0.0.0.0:$PORT`).
4. Attach a persistent volume.
5. Set `DATABASE_URL` to the volume path; seed once; then `SEED_ON_STARTUP=0`.
6. Verify `GET /api/health`.
7. Test SQLite persistence across a restart/redeploy.
8. Deploy frontend to Vercel (root `frontend/`).
9. Set `NEXT_PUBLIC_API_URL` to the Railway HTTPS URL.
10. Set backend `CORS_ORIGINS` to the Vercel origin; `COOKIE_SECURE=1`, `COOKIE_SAMESITE=none`,
    a strong `SESSION_SECRET`, `FRONTEND_URL`.
11. Production smoke test with Demo Guest/Host (browse, book, trips, messages, host dashboard).
12. Configure `AI_PROVIDER=gemini` + `AI_API_KEY` (+ optional `AI_MODEL`); 13. test real concierge.
14. Configure `GOOGLE_CLIENT_ID` + authorized JS origins (Vercel URL); 15. test Google login/session/logout.
16. Configure `EMAIL_PROVIDER=resend` + `EMAIL_API_KEY` + verified `EMAIL_FROM`;
    17. test real booking confirmation email; 18. test cancellation email.
19. Final production smoke test. 20. Update README with the live URL.
21. Make the GitHub repo public. 22. Final incognito evaluator test. 23. Submit.

---

## 17. Deployment pause points (stop and ask the user)

Stop for account/console actions — the user performs these; **never ask them to paste secrets
into chat** (secrets go directly into Railway/Vercel/Google/Resend dashboards):
- GitHub repo creation/visibility (account permission).
- Railway login/project/volume creation.
- Vercel account authorization/import.
- Gemini API key creation (Google AI Studio).
- Google OAuth console (client id + authorized origins/redirects using final URLs).
- Resend API key + sender/domain verification.

---

## 18. Command cheat sheet

Backend (`backend/`, venv at `backend/.venv`):
```
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # Windows path shown
.venv\Scripts\python -m app.seed                          # create & seed app.db
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
.venv\Scripts\python -m pytest
```
Frontend (`frontend/`):
```
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
npm run lint
npm run typecheck
npm run build
```
Production backend start (Railway): `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

---

## 19. Do NOT

Re-architect · add features · migrate SQLite→Postgres · add Redis/queues · add a Docker
requirement · redesign the UI · repeat exhaustive QA from scratch · weaken tests · commit secrets
· expose Gemini/Resend/Google secrets to the frontend · reset the production DB on every deploy.
Fix only genuine deployment/production defects.

---

## Prompt for the next coding agent

> You are taking over the StayFinder project mid-stream. **First read `docs/HANDOFF.md` in full**,
> then run `git status` and `git log --oneline -15` to confirm the state you're inheriting
> (expected: branch `master`, clean tree, HEAD `1753664`). **Verify current behavior instead of
> re-planning or re-auditing.** The product is under **feature freeze** — make only the changes
> required to deploy. Follow the "Exact next steps" (§16) in order, honoring the "Deployment pause
> points" (§17): stop and ask the user for any account/console action, and **never ask for secrets
> in chat** — secrets go directly into the Railway/Vercel/Google/Resend dashboards. Respect the
> "Do NOT" list (§19): no re-architecture, no new features, no SQLite→Postgres migration, no
> Redis/queues/Docker, no UI redesign, no weakening tests, no committed secrets, and never reset
> the production DB on redeploy. Keep the SQLite backend single-instance on a persistent volume.
> Preserve booking correctness, authorization, the concierge grounding/fallback, and the email
> idempotency/best-effort guarantees. Conserve tokens: don't re-read everything or restate the
> obvious. Verify with `pytest` / `lint` / `typecheck` / `build` only when you change code. Do not
> push or deploy until the user authorizes it.
