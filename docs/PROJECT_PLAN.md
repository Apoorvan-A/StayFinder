# Historical Project Plan

This is the original planning record, not a current roadmap. The deployed implementation and release scope are documented in README, ARCHITECTURE, and QA_REPORT. Feature development is frozen; unimplemented planning ideas are not current product claims.

## Goal
A polished, original Airbnb-style marketplace that an evaluator experiences as unusually
complete: browse → search → filter → listing detail → book → trips → favorites → host CRUD,
with Airbnb-level UI fidelity and server-authoritative booking correctness.

## Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind, Lucide, date-fns, react-day-picker, Sonner, SWR.
- Backend: FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite, pytest.
- Money as integer cents. Google sign-in + demo sessions over an HttpOnly session cookie.

## Phases
1. Foundation (structure, boot both apps, health, CORS, docs) ✅ docs
2. Database (models, constraints, indexes)
3. Seed (24–36 realistic listings, hosts, reviews, bookings, favorites)
4. Backend listing APIs (browse, detail, filter, availability, reviews)
5. Frontend shell (layout, navbar, demo switcher, search, categories, card grid)
6. Search / filters with URL state
7. Listing detail (gallery, amenities, reviews, calendar, sticky reservation card)
8. Booking (quote, conflict check, checkout, confirmation)
9. Trips (upcoming/past/cancelled + cancel)
10. Favorites / wishlist
11. Host (dashboard metrics, listing CRUD, reservations)
12. Responsive
13. Standout (interactive map, recently viewed) — only after core is strong
14. Tests
15. Visual polish
16. Deployment readiness
17. README / docs
18. Final production + hiring-manager audit

## Assumptions (documented)
- Real Google auth with HttpOnly session cookies; demo sessions use the same mechanism so
  evaluators need no credentials. Ownership enforced server-side from the session.
- No Alembic: SQLite demo uses `create_all` + idempotent seed for reliability.
- Images use curated royalty-free remote URLs (Unsplash) + local fallbacks; documented licensing.
- Reviews can be seeded; leaving a review post-stay is a bonus if time permits.
