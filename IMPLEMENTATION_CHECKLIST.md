# Implementation Checklist

Live source of truth for progress. An item is checked only when implemented **and** verified.

## Foundation
- [x] Repo structure (`frontend/`, `backend/`, `docs/`)
- [x] Planning docs
- [x] FastAPI app boots + CORS + `/health`
- [x] Next.js + TS + Tailwind boots
- [x] `.env.example` for both apps

## Database
- [x] SQLAlchemy models (User, Listing, ListingImage, Amenity, ListingAmenity, Booking, Review, Favorite)
- [x] Constraints (FKs, unique, check), indexes
- [x] Money stored as integer cents
- [x] `create_all` bootstrap

## Seed Data
- [x] 2 hosts, 1 guest demo users + reviewers
- [x] 32 realistic listings across varied destinations
- [x] Images, amenities, reviews, existing bookings, favorites
- [x] Deterministic / re-runnable

## Backend Listing APIs
- [x] List + pagination
- [x] Detail
- [x] Filtering (location, price, type, amenities, guests, beds/bedrooms)
- [x] Availability endpoint
- [x] Reviews endpoint

## Booking Engine
- [x] Quote (server-side pricing)
- [x] Half-open overlap check
- [x] Atomic create + re-check (409 on conflict)
- [x] Validation (dates, guests, capacity, past dates)
- [x] Price snapshot persisted
- [x] Status transitions (pending/confirmed/cancelled)
- [x] Cancel frees availability

## Favorites
- [x] Add / remove / list, no duplicates

## Host
- [x] Metrics from real data
- [x] Listing CRUD with ownership enforcement
- [x] Reservations across owned listings

## Frontend
- [x] Layout + sticky navbar + demo-user switcher
- [x] Search bar (location/dates/guests) with URL state
- [x] Category row + filter modal
- [x] Listing grid + cards + skeletons + empty/error states
- [x] Pagination / load-more
- [x] Listing detail (gallery, host, amenities, reviews, calendar, sticky reservation card)
- [x] Gallery modal
- [x] Checkout flow + mock payment + confirmation
- [x] My Trips (upcoming/past/cancelled) + cancel
- [x] Wishlist
- [x] Host dashboard + CRUD forms + reservations

## Cross-cutting
- [x] Responsive (verified desktop + mobile; Tailwind breakpoints throughout)
- [x] Accessibility (semantic, keyboard, labels, focus, Esc-to-close modals)
- [x] Toasts
- [x] 404 + error UI

## Testing
- [x] Backend pytest (listings, booking matrix, ownership, favorites, CRUD) — 39 passing
- [x] Frontend build + typecheck + lint clean

## Deployment / Docs
- [x] `.env.example`, no hardcoded localhost in prod paths
- [x] Deploy config (frontend Vercel notes, backend `render.yaml`)
- [x] README (setup, architecture, schema, API, demo users)
- [x] Final production audit (no AI refs / debug leftovers)
- [ ] Push to public GitHub repo (needs user's account)
- [ ] Deploy to Vercel + Render (needs user's accounts)
