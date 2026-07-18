# SmokeCraft 360 — Known Failure Register

Tracked, not permanently excused. Every failure below was confirmed present on the pre-Entry-Flow-package baseline (commit `5b2d5ed3`) by running the same suite against a stashed/baseline build earlier this session — i.e. these are real, reproducible defects, not test flakiness, and not introduced by any work done this session.

| # | Test | Route | Defect | First observed | Current status | Assigned package | Source files (likely) | Root cause | Fix commit | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `verify-interactions.mjs` Suite 3 | `/smokecraft/pairing-lab` → downstream | Pairing recommendation not built/persisted | Confirmed on baseline `5b2d5ed3` | Open | C (Pairing Lab rebuild) | `PairingLab.jsx`, `utils/pairingEngine.js` | Not yet root-caused — needs investigation during Package C | — | — |
| 2 | `verify-interactions.mjs` Suite 4 | `/smokecraft/humidor-match` | Cigar preset buttons — 0 found | Confirmed on baseline `5b2d5ed3` | Open | B (Humidor Match rebuild) | `HumidorMatch.jsx` | Not yet root-caused — needs investigation during Package B | — | — |
| 3 | `final-acceptance.mjs` | `/smokecraft/request-purchase` | Empty-state gate message not visible | Confirmed on baseline `5b2d5ed3` | Open | B (Request/Purchase rebuild) | `RequestPurchase.jsx` | Not yet root-caused | — | — |
| 4 | `final-acceptance.mjs` | `/smokecraft/request-purchase` | Self-Order option not visible on screen | Confirmed on baseline `5b2d5ed3` | Open | B | `RequestPurchase.jsx` | Not yet root-caused | — | — |
| 5 | `final-acceptance.mjs` | `/smokecraft/request-purchase` | Purchase Review does not show selected cigar | Confirmed on baseline `5b2d5ed3` | Open | B | `RequestPurchase.jsx` | Not yet root-caused | — | — |
| 6 | `final-acceptance.mjs` | `/smokecraft/request-purchase` | Special notes not restored after reload | Confirmed on baseline `5b2d5ed3` | Open | B | `RequestPurchase.jsx` | Not yet root-caused | — | — |
| 7 | `final-acceptance.mjs` | `/smokecraft/mentor-selection` | Live data "Don Alejandro" / "Dominican Republic" not visible | Confirmed on baseline `5b2d5ed3` | **RESOLVED** | A (Mentor Selection rebuild) | `Mentor.jsx` | Confirmed: mentor detail data was baked into the composite image, not read from a live source | `<Package A commit — pending approval>` | Verified via `final-acceptance.mjs` — "Don Alejandro"/"Dominican Republic" now render live from `src/modules/smokecraft/smokeCraftMentors.js` |
| 8 | `final-acceptance.mjs` | `/smokecraft/seed-soil` | Live data "Corojo" / "Volcanic" not visible | Confirmed on baseline `5b2d5ed3` | Open | C (Seed & Soil rebuild) | `SeedSoil.jsx` | Same pattern — baked, not React-rendered | — | — |
| 9 | `final-acceptance.mjs` | `/smokecraft/humidor-match` | Live data "Oliva Serie V" / "Nicaragua" not visible | Confirmed on baseline `5b2d5ed3` | Open | B | `HumidorMatch.jsx` | Same pattern | — | — |
| 10 | `final-acceptance.mjs` | `/smokecraft/cut-toast-light` | Live data "Gentle Toast" / "Cedar Spill" not visible | Confirmed on baseline `5b2d5ed3` | Open | C | `CutToastLight.jsx` | Same pattern | — | — |
| 11 | `final-acceptance.mjs` | `/smokecraft/first-third` | Live data "Opening flavors noted" / "Draw assessed" not visible | Confirmed on baseline `5b2d5ed3` | Open | D | `FirstThird.jsx` | Same pattern | — | — |
| 12 | `final-acceptance.mjs` | `/smokecraft/second-third` | Live data "Flavor development noted" not visible | Confirmed on baseline `5b2d5ed3` | Open | D | `SecondThird.jsx` | Same pattern | — | — |
| 13 | `final-acceptance.mjs` | `/smokecraft/request-purchase` (mobile 390×844) | 9 unintentional small-text nodes found | Confirmed on baseline `5b2d5ed3` | Open | B | `RequestPurchase.jsx` | Not yet root-caused, likely baked label text scaled down at mobile width | — | — |
| 14 | `final-acceptance.mjs` (INVESTOR DEMO) | `/smokecraft/request-purchase` | Cigar selection does not carry forward from Humidor Match | Confirmed on baseline `5b2d5ed3` | Open | B | `HumidorMatch.jsx`, `RequestPurchase.jsx`, `SmokeCraftJourneyContext.jsx` | Not yet root-caused — likely a `journey.selectedCigar` write/read mismatch between the two screens | — | — |

## Pattern observed

Failures 7–12 share one root cause category: **the affected screens are still in "static image + overlay" or "partially live" classification** (per `SMOKECRAFT_STATIC_SHELL_AUDIT.md`) — the specific product/flavor-note names the tests look for are baked into the approved production image as decorative sample text, not rendered by React from real state. This is not a coincidence: it is direct evidence that Packages B, C, and D (which rebuild exactly these routes) will resolve failures 7–12 as a side effect of the planned rebuild, *if* the rebuild correctly moves that content into React reading from real `journey`/`session` state rather than re-baking new sample text.

Failures 1–6, 13, 14 are concentrated on `/smokecraft/humidor-match`, `/smokecraft/pairing-lab`, and `/smokecraft/request-purchase` — the same three screens, suggesting a shared data-flow defect in how `selectedCigar`/pairing state moves between them. This should be root-caused **once**, early in Package B, rather than three times.

## Status

13 of 14 known failures remain open, assigned to their responsible package (B/C/D). **Failure #7 is resolved** as a confirmed side effect of the Package A Mentor Selection rebuild — exactly the pattern predicted above. None of the remaining failures are being excused as permanently out of scope. This register will be updated with root cause, fix commit, and verification result as each package is executed.
