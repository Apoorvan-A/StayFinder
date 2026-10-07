# Release Verification Matrix

Current audit: October 7, 2026. Browser checks were skipped at the user's request.

| Area | Evidence | Result |
|---|---|---|
| Public inventory/search/categories/filters | 198-check production API audit | PASS |
| Demo Guest/Host, auth/me, cookie/CORS | Independent production clients | PASS |
| Favorites persistence/removal | Production API | PASS |
| Booking prices, overlap, adjacency, cancellation | Production API and automated tests | PASS |
| 14 production race scenarios | 16 successes / 12 conflicts; no double booking/500/lock errors | PASS |
| Three production users | Requires third Google identity | SKIPPED |
| Three automated users and winner-only mail | File-backed SQLite regression tests | PASS |
| Host CRUD, metrics, role and ownership | Production API and tests | PASS |
| Messaging/reply/history | Production API and tests | PASS |
| Concierge grounding | India/Greece/Lisbon/impossible production prompts | PASS |
| Health/docs/routes/sample tile | HTTP probes | PASS |
| Persistence across final redeploy | Recorded QA data and 32 seed IDs survived Railway revision 1d1b625; fixtures cleaned | PASS |
| Google real chooser/login/refresh | Browser-dependent | SKIPPED |
| Real confirmation/cancellation inbox delivery | Real Google identity/email evidence unavailable | SKIPPED |
| Responsive/header/map/gallery/share/focus | Browser-dependent | SKIPPED |
| Browser console/network/incognito | Browser-dependent | SKIPPED |
| Full backend tests | 100 passing | PASS |
| Frontend lint/typecheck/build | Commands completed successfully | PASS |
| Pattern secret scan/tracked private files | Tracked files and recent history | PASS |

See [QA_REPORT.md](QA_REPORT.md) for exact scope, fixes, counts, and limitations. Historical manual browser passes are not promoted to current production passes.
