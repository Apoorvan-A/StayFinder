# API Design

REST, JSON, served by FastAPI under `/api`. Interactive docs at `/docs`.
Identity comes from a signed **HttpOnly session cookie** (`sf_session`); the backend resolves
the current user from it and is authoritative for all validation, pricing, and ownership. The
frontend sends requests with `credentials: "include"`.

## Conventions
- Pagination: `?page=1&page_size=18` → `{ items: [...], page, page_size, total, total_pages }`.
- Money returned as integer cents; the frontend formats currency.
- Errors: `{ "error": { "code": "BOOKING_CONFLICT", "message": "..." } }` with the right status.

## Error codes
`LISTING_NOT_FOUND` (404) · `BOOKING_CONFLICT` (409) · `VALIDATION_ERROR` (422) ·
`FORBIDDEN` (403) · `UNAUTHORIZED` (401) · `NOT_FOUND` (404) · `DUPLICATE_FAVORITE` (409).

**Location privacy:** the public `GET /api/listings/{id}` never includes the exact address —
only the city/country and an area description. The exact address appears only in a confirmed
reservation's detail (`GET /api/bookings/{id}`) and in the owner's host listing endpoint.

## Endpoints

### System
- `GET /api/health` → `{ status: "ok" }`

### Auth
- `GET /api/auth/config` → `{ google_client_id }` (whether Google sign-in is available)
- `GET /api/auth/me` → current user (401 if anonymous)
- `POST /api/auth/google` → verify a Google ID token, upsert user, set session cookie
- `POST /api/auth/demo` → `{ role }` starts a demo guest/host session (same cookie mechanism)
- `POST /api/auth/become-host` → promote current user to host
- `POST /api/auth/logout` → clear the session cookie

### Listings
- `GET /api/listings` — query: `location, check_in, check_out, guests, min_price, max_price,
  property_type, category, amenities (repeatable), bedrooms, beds, min_rating, sort, page,
  page_size`. Availability-aware when dates present.
- `GET /api/listings/{id}` — full detail (images, amenities, host, rating, review_count)
- `GET /api/listings/{id}/availability` — booked date ranges
- `GET /api/listings/{id}/reviews` — reviews + aggregate
- `GET /api/categories` · `GET /api/amenities` — filter metadata

### Bookings
- `POST /api/bookings/quote` — `{ listing_id, check_in, check_out, guests }` → server price breakdown + availability check (no persistence)
- `POST /api/bookings` — create (atomic, re-checks conflict → 409), returns confirmation
- `GET /api/trips` — current user's bookings with listing
- `GET /api/bookings/{id}` — reservation detail for a participant (guest or the listing's host);
  exact address + coordinates included only when the reservation is `confirmed`
- `POST /api/bookings/{id}/cancel` — guest-only; allowed before the check-in date; frees dates
- `POST /api/bookings/{id}/message` — get-or-create the booking's conversation and post a message

### Messaging (participant-only)
- `GET /api/conversations` — current user's threads (counterparty, last message, unread count)
- `POST /api/conversations` — `{ listing_id, body }` start/reuse a thread as a guest
- `GET /api/conversations/{id}` — thread + messages (marks counterparty messages read)
- `POST /api/conversations/{id}/messages` — reply

### Listings (metadata)
- `GET /api/listings/price-range` — dataset min/max nightly price for the filter
- `GET /api/host/listings/{id}` — owner-only detail including the private exact address (for editing)

### Favorites
- `GET /api/favorites` — current user's wishlist (full listing cards)
- `POST /api/favorites/{listing_id}` — add (idempotent-ish; 409 on dup)
- `DELETE /api/favorites/{listing_id}` — remove

### Host (host role and ownership enforced from the session cookie)
- `GET /api/host/metrics` — listings count, upcoming/total reservations, revenue, avg rating
- `GET /api/host/listings` — owned listings
- `POST /api/host/listings` — create
- `PATCH /api/host/listings/{id}` — update (owner only → 403 otherwise)
- `DELETE /api/host/listings/{id}` — delete (cascades dependent bookings and other listing data)
- `GET /api/host/reservations` — reservations across owned listings
