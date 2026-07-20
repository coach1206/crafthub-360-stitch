# Route & Component Registry

## Scope disclosure

`src/App.jsx` contains 99 route lines matching SmokeCraft-adjacent
keywords — many are legacy/superseded/demo routes accumulated across
this repo's history (e.g. `education`, `mentors`, `humidor`, `light`,
`complete`, `gold-box`, `shape-size-burn`, `cigar-gauge-guide`,
`knowledge-check-demo`, `smokecraft-visual-proof`,
`smokecraft-image-diagnostic`, `smokecraft/session-1..4`). Full
per-route detail is given below for the **42 routes that make up the
authoritative journey** (27 locked sessions + 5 entry-layer screens + 10
supporting modules, per `session.js`). The remaining ~57 legacy/demo/
diagnostic routes are listed as an appendix with status **DEPRECATED or
UNKNOWN** rather than individually detailed — auditing each would be a
separate pass; none of them are part of the locked spine and none should
be touched by Golden Box/gamification work.

## Entry-layer screens (outside the 27-session count)

| Route | Component | Live/Static | Persisted | Verification |
|---|---|---|---|---|
| `/smokecraft` | `SmokeCraft.jsx` (Launch) | Live | N/A | VERIFIED_COMPLETE |
| `/smokecraft/enroll` | Enroll/Guest Pass | Live | Session storage | VERIFIED_COMPLETE |
| `/smokecraft/venue-select` | `VenueSelect.jsx` | Live | Journey context | VERIFIED_COMPLETE |
| `/smokecraft/identity` | Personal Dashboard | Live | Journey context | VERIFIED_COMPLETE |
| `/smokecraft/resume` | `ResumeJourney.jsx` | Live | Server journey (Management Sync) | VERIFIED_COMPLETE |

## 27 locked-session routes

See `02-LOCKED-SESSION-REGISTRY.md` for the full per-session table
(route, component, status, backend dependency, live-interaction,
asset, quiz, XP, Golden Box relevance, known gap, do-not-touch — all
already captured there to avoid duplicating the same 27 rows twice).
Cross-reference: every route in that table is `/smokecraft/<id-or-alias>`
exactly as declared in `App.jsx`.

## Supporting modules (contextual, outside the 27-session count)

| Route | Requires | Live/Static | Verification | Do-not-touch |
|---|---|---|---|---|
| `/smokecraft/golden-box` | entry | Live (rules-acceptance UI only) | FUNCTIONAL BUT INCOMPLETE — real checkbox/acknowledgment UI, but not the interactive competition system the mandate targets | Extend, do not replace the acceptance-gate role |
| `/smokecraft/mentor-selection` | entry | Live | VERIFIED_COMPLETE (card UI) / EXISTS_NEEDS_UPDATE (data persistence, see Gap #4) | YES |
| `/smokecraft/seed-soil` | mentor | Live | EXISTS_NEEDS_UPDATE (session-JSONB only, no normalized table) | YES, extend |
| `/smokecraft/wrapper-strength` | format | Live | EXISTS_NEEDS_UPDATE (not deep-audited this pass) | YES pending confirmation |
| `/smokecraft/request-purchase` | humidor-match | Live | VERIFIED_COMPLETE | YES |
| `/smokecraft/smokecraft-challenge` | scorecard | Live | EXISTS_NEEDS_UPDATE (one-off scoring screen, not a recurring quest system) | YES, extend |
| `/smokecraft/second-humidor-match` | scorecard | Live | EXISTS_NEEDS_UPDATE (not deep-audited this pass) | YES pending confirmation |
| `/smokecraft/mini-tasting` | scorecard | Live | EXISTS_NEEDS_UPDATE (not deep-audited this pass) | YES pending confirmation |
| `/smokecraft/connections` | passport-stamp | Live | VERIFIED_COMPLETE | YES |
| `/smokecraft/management-sync` | passport-stamp | Live | VERIFIED_COMPLETE (Packages A-E, this session) | YES |

## Additional live, verified destinations found this pass (not in `session.js`'s 3 lists)

| Route | Component | Status |
|---|---|---|
| `/smokecraft/management-sync/analytics` | `ManagementSyncAnalytics.jsx` | VERIFIED_COMPLETE (Package D) — venue-manager-only real analytics |
| `/smokecraft/leaderboard` | `Leaderboard.jsx` (355 lines) | VERIFIED_COMPLETE |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus.jsx` (10 lines) | STATIC SHELL — single approved image, no interaction |

## Appendix — legacy/demo/diagnostic routes (not part of the locked spine)

Not individually detailed this pass; flagged DEPRECATED or UNKNOWN,
none authorized for use by Golden Box/gamification work: `mentor-login`,
`intake`, `profile` (x2, different sub-trees), `education`, `mentors`,
`humidor` (x2), `light`, `complete`, `gold-box` (legacy alias),
`shape-size-burn`, `cigar-gauge-guide`, `knowledge-check-demo`,
`mini-tasting-module`, `challenge`, `mini-tasting-round`, `flavor-dna`
(confirmed a 5-line stub, see audit report), `pairing`, `pairing-mastery`,
`demo-reset`, `session/start`, `passport` (full sub-tree: profile, stamps,
directory, connections, events, benefits, scan, how-it-works, ceremony,
leaderboard, passport-networking, grand-lounge-ranking — a **separate**
Passport 360 module, distinct from SmokeCraft's own `passport-stamp`
session), `menu`, `venue-commerce`, `order`, `ticket-tapper/staff-specials`,
`cart`, `checkout`, `payment-success`, `order-status`, `mentor-console`,
`smokecraft-visual-proof`, `smokecraft-image-diagnostic`,
`smokecraft/venue-pilot-package`, `smokecraft-checkout`,
`novee-os/final-readiness`, `smokecraft-panel`, `smokecraft/error-log`,
`smokecraft/feature-flag-admin`, `smokecraft/session-1` through `session-4`
(legacy numbered-session routes, superseded by the locked 27-session
spine — do not confuse with the current `session.js` session numbers).
