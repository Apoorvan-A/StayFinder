# API Design

REST, JSON, served by FastAPI under `/api`. Interactive docs at `/docs`.
Identity comes from a signed **HttpOnly session cookie** (`sf_session`); the backend resolves
the current user from it and is authoritative for all validation, pricing, and ownership. The
frontend sends requests with `credentials: "include"`.

## Conventions
- Pagination: `?page=1&page_size=18` → `{ items: [...], page, page_size, total, total_pages }`.
- Money returned as integer cents plus a formatted field where helpful.
- Errors: `{ "error": { "code": "BOOKING_CONFLICT", "message": "..." } }` with the right status.

## Error codes
`LISTING_NOT_FOUND` (404) · `BOOKING_CONFLICT` (409) · `VALIDATION_ERROR` (422) ·
`FORBIDDEN` (403) · `UNAUTHORIZED` (401) · `NOT_FOUND` (404) · `DUPLICATE_FAVORITE` (409).

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
- `GET /api/listings/{id}/availability?months=n` — booked date ranges
- `GET /api/listings/{id}/reviews` — reviews + aggregate
- `GET /api/categories` · `GET /api/amenities` — filter metadata

### Bookings
- `POST /api/bookings/quote` — `{ listing_id, check_in, check_out, guests }` → server price breakdown + availability check (no persistence)
- `POST /api/bookings` — create (atomic, re-checks conflict → 409), returns confirmation
- `GET /api/trips` — current user's bookings grouped/with status
- `POST /api/bookings/{id}/cancel` — owner-only; frees dates

### Favorites
- `GET /api/favorites` — current user's wishlist (full listing cards)
- `POST /api/favorites/{listing_id}` — add (idempotent-ish; 409 on dup)
- `DELETE /api/favorites/{listing_id}` — remove

### Host (ownership enforced against `X-Demo-User-Id`)
- `GET /api/host/metrics` — listings count, upcoming/total reservations, revenue, avg rating
- `GET /api/host/listings` — owned listings
- `POST /api/host/listings` — create
- `PATCH /api/host/listings/{id}` — update (owner only → 403 otherwise)
- `DELETE /api/host/listings/{id}` — delete (safe w.r.t. bookings)
- `GET /api/host/reservations` — reservations across owned listings
