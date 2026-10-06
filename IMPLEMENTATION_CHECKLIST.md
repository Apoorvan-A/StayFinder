# Implementation Checklist

Live source of truth for progress. An item is checked only when implemented **and** verified.

## Foundation
- [x] Repo structure (`frontend/`, `backend/`, `docs/`)
- [x] Planning docs
- [x] FastAPI app boots + CORS + `/health`
- [ ] Next.js + TS + Tailwind boots
- [x] `.env.example` for backend

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
- [ ] Layout + sticky navbar + demo-user switcher
- [ ] Search bar (location/dates/guests) with URL state
- [ ] Category row + filter modal
- [ ] Listing grid + cards + skeletons + empty/error states
- [ ] Pagination / load-more
- [ ] Listing detail (gallery, host, amenities, reviews, calendar, sticky reservation card)
- [ ] Gallery modal
- [ ] Checkout flow + mock payment + confirmation
- [ ] My Trips (upcoming/past/cancelled) + cancel
- [ ] Wishlist
- [ ] Host dashboard + CRUD forms + reservations

## Cross-cutting
- [ ] Responsive (1440/1280/1024/768/430/390)
- [ ] Accessibility (semantic, keyboard, labels, focus)
- [ ] Toasts
- [ ] 404 + error UI

## Testing
- [ ] Backend pytest (listings, booking matrix, ownership, favorites, CRUD)
- [ ] Frontend build + typecheck + lint clean

## Deployment / Docs
- [ ] `.env.example`, no hardcoded localhost in prod paths
- [ ] Deploy config (frontend Vercel, backend Render)
- [ ] README (setup, architecture, schema, API, demo users)
- [ ] Final production + hiring-manager audit
