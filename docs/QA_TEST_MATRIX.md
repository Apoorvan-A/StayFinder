# QA Test Matrix

Legend: ✅ pass · 🔧 issue found & fixed

## Routes (17) — all load, correct auth gating, polished states
| Route | Anon | Guest | Host | Notes |
|-------|------|-------|------|-------|
| `/` (explore) | ✅ | ✅ | ✅ | search, categories, filters, grid, map toggle |
| `/listings/[id]` | ✅ | ✅ | ✅ | gallery, map pin, sections, reservation card |
| `/listings/999999` | ✅ | — | — | graceful not-found |
| `/checkout` | gate | ✅ | ✅ | quote, mock pay, confirmation |
| `/trips` | gate | ✅ | ✅ | tabs + cards → detail |
| `/trips/[id]` | gate | ✅ | ✅ | detail, address (confirmed), directions |
| `/wishlist` | gate | ✅ | ✅ | favorites grid / empty state |
| `/messages` | gate | ✅ | ✅ | conversation list, unread |
| `/messages/[id]` | gate | ✅ | ✅ | thread + composer |
| `/host` | gate | become-host | ✅ | metrics from real data |
| `/host/listings` | gate | gate | ✅ | CRUD, delete confirm |
| `/host/listings/new` | gate | gate | ✅ | validated form |
| `/host/listings/[id]/edit` | gate | gate | ✅ | prefilled, address incl. |
| `/host/reservations` | gate | gate | ✅ | rows → detail |
| `/help` `/privacy` `/terms` | ✅ | ✅ | ✅ | static content |
| `/this-route-*` (404) | ✅ | — | — | polished 404 |

## Workflows
| Flow | Result |
|------|--------|
| Browse → search → filter → listing | ✅ |
| Guest book → checkout → confirmation → Trips → reservation detail | ✅ (API + UI) |
| Favorite → wishlist → unfavorite → persist | ✅ |
| Message host → host sees → reply → guest sees (persist) | ✅ |
| Host become-host → dashboard → create → edit → public reflects | ✅ |
| Booking conflict / adjacency / edge cases | ✅ (matrix in pytest) |
| Cancel future booking → frees dates | ✅ |

## Interactive element categories
Navbar/logo ✅ · account menu ✅ · search segments + popovers ✅ · category items ✅ ·
filters (price bounds, Any rooms, dynamic count, clear-all) ✅ · listing cards + hearts ✅ ·
carousel arrows/dots ✅ · Show all photos modal (Esc/close) ✅ · Share (native + copy) ✅ ·
reservation date fields + calendar ✅ · guest steppers ✅ · Show/Hide map + price markers ✅ ·
Get directions (Google Maps URL) ✅ · Message host/guest ✅ · trips/reservation rows ✅ ·
footer links (all real destinations) ✅ · pagination (Show more) ✅.
No dead controls found.

## Viewports
1440 ✅ · 1280 ✅ · 1024 ✅ · 768 ✅ (category scrolls, header no overflow) ·
390/375 ✅ (no horizontal overflow on home, listing, checkout, messages, trips, host).

## Security / authorization probes (27/27)
Auth gating · IDOR (booking/listing/conversation) · validation matrix · pagination bounds ·
XSS storage/escaping · no secrets. All pass.

## Quality gates (final)
Backend pytest 63 ✅ · ESLint ✅ · tsc ✅ · production build ✅ · console/network clean ✅.
