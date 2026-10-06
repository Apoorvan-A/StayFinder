# Test Strategy

Tests validate behavior, not line count. Highest value sits in the booking engine and
ownership enforcement.

## Backend (pytest, isolated in-memory/temp SQLite per test session)
**Listings**: list + pagination shape; location search; price filter; property-type filter;
amenity filter; guest-capacity filter.

**Booking matrix** (the core):
- valid booking succeeds and persists
- confirmed booking blocks its dates
- overlapping booking rejected (409)
- adjacent booking allowed (checkout day == checkin day)
- booking surrounding / inside an existing one rejected
- check_out ≤ check_in rejected
- zero-night rejected
- past dates rejected
- guest_count > max_guests rejected
- guest_count < 1 rejected
- nonexistent listing rejected (404)
- pricing computed server-side (client-sent total ignored)
- cancelled booking frees availability

**Ownership**: host edits own listing; host cannot edit/delete another host's listing (403);
guest cannot hit host mutation endpoints (403).

**Favorites**: add; remove; duplicate favorite rejected/idempotent.

**Host CRUD**: create; update; delete behavior with existing bookings (no orphans).

**Auth**: `/auth/me` requires a session; demo login sets a working session; logout clears it;
first Google login provisions a user and returning login reuses it (Google verification
mocked); invalid/tampered tokens and cookies are rejected; guest→host promotion; a booking is
attributed to the session user, not the request body.

## Frontend
- `next build` + `tsc --noEmit` + `eslint` must pass clean.
- Manual critical-flow verification in a real browser (search → book → trip; favorite; host CRUD).
- Optional Playwright for Flow A (browse→book→confirmation→trips) if time allows.
