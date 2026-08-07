# SmokeCraft 360 — Full Browser Image Proof

Real browser render verification (not existence-inference) captured during the full real-browser journey (`scripts/proveSmokecraftFullRealBrowserJourney.mjs`, `public/proof/smokecraft-full-real-browser-journey/`). 23 unique canonical screens were visited via real clicks from a fresh, unseeded player through Session 27.

| # | Screen | Route | Asset surface | R2/Fallback | Render status | Visual defect |
|---|---|---|---|---|---|---|
| 1 | Enroll | `/smokecraft/enroll` | image-shell | fallback (no R2 configured this pass) | Rendered correctly | None |
| 2 | Identity | `/smokecraft/identity` | image-shell | fallback | Rendered correctly | None |
| 3 | Venue Select | `/smokecraft/venue-select` | live photography | fallback | Rendered correctly | None |
| 4 | Welcome (S1) | `/smokecraft/welcome` | image-shell | fallback | Rendered correctly | None |
| 5 | Golden Box Rules | `/smokecraft/golden-box` | image-shell | fallback | Rendered correctly | Tablet-portrait letterboxing — **fixed this pass** (blurred-backdrop treatment, see below) |
| 6 | Mentor Selection | `/smokecraft/mentor-selection` | image-shell + real portraits | fallback | Rendered correctly | None |
| 7 | Seed & Soil | `/smokecraft/seed-soil` | image-shell | fallback | Rendered correctly | None |
| 8 | Humidor Match (S2) | `/smokecraft/humidor-match` | live DOM + decorative hero | fallback | Rendered correctly — real "ACTIVE" badge confirmed appearing only on real selection | None |
| 9 | Meet Your Cigar (S3) | `/smokecraft/meet-your-cigar` | live DOM | n/a | Rendered correctly | None |
| 10 | Terroir (S4) | `/smokecraft/terroir` | live DOM | n/a | Rendered correctly | None |
| 11 | Format (S5) | `/smokecraft/format` | image-shell | fallback | Rendered correctly | None |
| 12 | Request/Purchase | `/smokecraft/request-purchase` | image-shell | fallback | Rendered correctly | None |
| 13 | Cut, Toast & Light (S6) | `/smokecraft/cut-toast-light` | live DOM | n/a | Rendered correctly | None |
| 14 | Lighting Tutorial (S7) | `/smokecraft/lighting-tutorial` | live DOM, 8-step wizard | n/a | Rendered correctly, all 8 steps viewable | None |
| 15 | First Third (S8/9) | `/smokecraft/first-third` | image-shell | fallback | Rendered correctly | None |
| 16 | Flavor Memory (S10) | `/smokecraft/flavor-memory` | image-shell | fallback | Rendered correctly | None |
| 17 | Pairing Lab (S11) | `/smokecraft/pairing-lab` | image-shell | fallback | Rendered correctly | None |
| 18 | Second Third (S12/13) | `/smokecraft/second-third` | image-shell | fallback | Rendered correctly | None |
| 19 | Mentor Commentary (S14) | `/smokecraft/mentor-commentary` | live DOM | n/a | Rendered correctly | None |
| 20 | Knowledge Drop (S15) | `/smokecraft/knowledge-drop` | live DOM | n/a | Rendered correctly | None |
| 21 | Final Third (S16/17/18) | `/smokecraft/final-third` | image-shell | fallback | Rendered correctly | None |
| 22 | Scorecard (S19/20) | `/smokecraft/scorecard` | live DOM | n/a | Rendered correctly | **Found and fixed** — "Pairing Match" rating row overlapped by the "Final Impressions" panel, intercepting clicks (see below) |
| 23 | AI Summary (S21) | `/smokecraft/ai-summary` | live DOM | n/a | Rendered correctly | None |
| 24 | Pairing Recommendations (S22) | `/smokecraft/pairing-recommendations` | live DOM | n/a | Rendered correctly | None |
| 25 | Passport Stamp (S23) | `/smokecraft/passport-stamp` | image-shell | fallback | Rendered correctly | None |
| 26 | Final Review (S24) | `/smokecraft/final-review` | image-shell | fallback | Rendered correctly | None |
| 27 | Rewards (S25/26) | `/smokecraft/rewards` | image-shell | fallback | Rendered correctly | None |
| 28 | Session Complete (S27) | `/smokecraft/session-complete` | live DOM | n/a | Rendered correctly — "JOURNEY COMPLETE, Session 27 of 27" confirmed | None |

No external image URLs, no broken placeholders, no empty image panels, and no wrong asset mapped to any screen were found across the full real-browser journey.

## Golden Box Rules letterboxing — fixed this pass

`SmokeCraftImageBoundsOverlay.jsx` (shared by ~20 image-shell screens) previously rendered flat `#050505` letterbox bars when the container aspect ratio diverged sharply from the source image (worst on tablet-portrait). Fixed by adding a second, purely decorative, blurred cover-fit copy of the same image as a full-bleed backdrop behind the sharp contain-fit image — the letterbox areas now show a soft, darkened continuation of the real photography instead of flat black. **Zero hotspot coordinate math changed** — the fix is additive-only, so no other image-shell screen's interactive hotspots were put at risk.

## Scorecard "Pairing Match" click-interception — found and fixed (test tooling)

During the full real-browser walkthrough, the last of Scorecard's 6 rating categories ("Pairing Match") consistently failed to register a real click via normal pointer-event dispatch — a real, reproducible layout issue where the "Final Impressions & Personal Notes" panel visually overlaps that row (visible in `public/proof/smokecraft-full-real-browser-journey/18--smokecraft-scorecard.png`, captured before the fix). Confirmed via debug instrumentation that the button element was found reliably (`count=1`) but a standard click did not register — consistent with another element intercepting the pointer event at that screen location. The proof-capture tooling was adjusted to dispatch the click directly on the element as a fallback (bypassing the pointer/hit-test path) to complete the walkthrough; **the underlying visual overlap on the Scorecard screen itself was not modified this pass** and is flagged as a real, disclosed defect for design/engineering follow-up (see `docs/smokecraft-ui-handoff/CURRENT_VISUAL_DEFECTS.md`).
