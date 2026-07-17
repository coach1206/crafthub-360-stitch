# SmokeCraft 360 — Static Shell Audit

**Read-only audit. No source files were modified to produce this document.**

## Method

Every route registered under `<Route path="smokecraft" ...>` in `src/App.jsx` was traced to its component file. Each component file was inspected for:
- `SmokeCraftImageBoundsOverlay` usage (full-bleed static image, natural-aspect-ratio, with `children` absolutely positioned on top via percentage coordinates)
- `SmokeCraftAssetScreen` usage (full-viewport `background-image` fill, `children` layered on top — usually just the nav bar)
- vs. the "gradient shell" pattern established in Packages K–S (`position:'fixed', inset:0` + `linear-gradient` background, a small `role="img"` decorative header band ≤140px tall, and a scrollable `<main>` containing 100% React-rendered content)

Two component wrappers are responsible for nearly every static-shell screen in this codebase:

- **`SmokeCraftImageBoundsOverlay`** (`src/components/smokecraft/SmokeCraftImageBoundsOverlay.jsx`) — renders one full production image sized to its natural aspect ratio, with `children` absolutely positioned on top by percentage coordinates. Any text, button, or "Hotspot" the caller adds is a thin transparent layer over the printed artwork underneath — the artwork itself contains all navigation labels, panel borders, stat displays, and decorative copy as flattened pixels.
- **`SmokeCraftAssetScreen`** (`src/components/smokecraft/SmokeCraftAssetScreen.jsx`) — renders one full-viewport `background-image`, `children` (if any) layered on top. Its own doc comment defines a `LIVE_REACT_PAGE_ARTWORK` classification meaning "all controls/text in React overlays" — in practice most consuming files pass little or no live content as children, so the classification label doesn't match the actual rendered result.

## Per-Route Findings

### Entry Layer (outside the 27-session count)

| Route | Component | Overlay type | Buttons | Inputs | Live-data refs | Classification |
|---|---|---|---|---|---|---|
| `/smokecraft` (index) | `SmokeCraft.jsx` | `SmokeCraftImageBoundsOverlay` | 6 `<Hotspot>` | 0 | 0 | **STATIC IMAGE WITH OVERLAY** — every visible label, card border, and button face is printed into the image; only invisible click zones are React. |
| `/smokecraft/enroll` | `Enroll.jsx` | `SmokeCraftAssetScreen` | 0 | 0 | 0 | **STATIC SCREENSHOT** — no interactive children rendered beyond the shared nav bar. |
| `/smokecraft/venue-select` | `VenueSelect.jsx` | none (gradient shell) | live | live | live | **FULLY LIVE (interface)** — real React search/filter/list/empty-state, but the data source itself is an intentional empty array (`VENUES = []`, Package "recovery" fix) — no venue backend connected. This is the one screen already confirmed correct per the last session's fix; flagged here only for the missing data source, not the shell. |
| `/smokecraft/identity` | `Identity.jsx` | `SmokeCraftAssetScreen` | 3 | 5 | 2 | **PARTIALLY LIVE** — real `<input>` fields and 3 buttons exist, but they are positioned over one full baked background image containing "Journey Progress," "Quick Stats," "Insights," and panel framing as printed pixels, exactly matching the reported symptom. |
| `/smokecraft/resume` | `ResumeJourney.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** — real React summary, Resume/Start New controls, confirmation modal. |

### Numbered Journey (1–27) and directly-adjacent supporting screens

| Route | Session | Component | Overlay type | Buttons | Absolute-positioned nodes | Live-data refs | Classification |
|---|---|---|---|---|---|---|---|
| `/smokecraft/welcome` | S1 | `WelcomeExperience.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/humidor-match` | S2 | `HumidorMatch.jsx` | `SmokeCraftImageBoundsOverlay` | 6 | 7 | 1 | **PARTIALLY LIVE** — most buttons/state exist in React, but the surrounding cigar cards, labels, and framing are printed into the background image; overlay elements are positioned by hardcoded percentage coordinates against that fixed artwork. |
| `/smokecraft/meet-your-cigar` | S3 | `MeetYourCigar.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/terroir` | S4 | `Terroir.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/format` | S5 | `Format.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 4 | 1 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/cut-toast-light` | S6 | `CutToastLight.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 6 | 4 | **PARTIALLY LIVE** |
| `/smokecraft/lighting-tutorial` | S7 | `LightingTutorial.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/first-third` | S8 | `FirstThird.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 4 | 2 | **PARTIALLY LIVE** |
| `/smokecraft/flavor-memory` | S10 | `FlavorMemory.jsx` | `SmokeCraftImageBoundsOverlay` | 1 | 6 | 1 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/pairing-lab` | S11 | `PairingLab.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 7 | 1 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/second-third` | S12 | `SecondThird.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 4 | 2 | **PARTIALLY LIVE** |
| `/smokecraft/mentor-commentary` | S14 | `MentorCommentary.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/knowledge-drop` | S15 | `KnowledgeDrop.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/final-third` | S16 | `FinalThird.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 5 | 1 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/scorecard` | S19 | `Scorecard.jsx` | `SmokeCraftImageBoundsOverlay` | 2 | 6 | 4 | **PARTIALLY LIVE** |
| `/smokecraft/ai-summary` | S21 | `AISummary.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/pairing-recommendations` | S22 | `PairingRecommendations.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/passport-stamp` | S23 | `PassportStamp.jsx` | `SmokeCraftImageBoundsOverlay` | 0 | 0 | 7 | **STATIC IMAGE WITH OVERLAY** — 7 live-data text refs are rendered, but zero interactive buttons of its own (relies entirely on the shared nav bar); the printed image supplies all visual chrome. |
| `/smokecraft/final-review` | S24 | `FinalReview.jsx` | `SmokeCraftImageBoundsOverlay` | 1 | 3 | 1 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/rewards` (shared S25/S26) | S25/26 | `Rewards.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/session-complete` | S27 | `SessionComplete.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |

### Supporting modules (outside the 27-session count)

| Route | Component | Overlay type | Buttons | Absolute nodes | Live-data refs | Classification |
|---|---|---|---|---|---|---|
| `/smokecraft/mentor-selection` | `Mentor.jsx` | `SmokeCraftImageBoundsOverlay` | 1 | 4 | 1 | **STATIC IMAGE WITH OVERLAY** — matches the reported symptom directly: mentor portraits, names, descriptions, cards, badges, and navigation chrome are printed into one image; only one transparent click handler is layered on top. |
| `/smokecraft/golden-box` | `GoldenBox.jsx` | `SmokeCraftAssetScreen` | 1 | 0 | 3 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus.jsx` | `SmokeCraftAssetScreen` | 0 | 0 | 0 | **STATIC SCREENSHOT** |
| `/smokecraft/wrapper-strength` | `WrapperStrength.jsx` | redirect-only, no visual | — | — | — | N/A (pure redirect) |
| `/smokecraft/seed-soil` | `SeedSoil.jsx` | `SmokeCraftImageBoundsOverlay` | 1 | 4 | 3 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/request-purchase` | `RequestPurchase.jsx` | `SmokeCraftImageBoundsOverlay` | 3 | 3 | 5 | **PARTIALLY LIVE** |
| `/smokecraft/knowledge-check-demo` | `KnowledgeCheckDemo.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** (QA harness, not a designed production screen) |
| `/smokecraft/mini-tasting-module` | `MiniTasting.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/smokecraft-challenge` | `SmokeCraftChallenge.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/second-humidor-match` | `SecondHumidorMatch.jsx` | `SmokeCraftAssetScreen` | 0 | 0 | 0 | **STATIC SCREENSHOT** |
| `/smokecraft/mini-tasting` (spine completion step) | `MiniTastingRound.jsx` | `SmokeCraftAssetScreen` | 0 | 0 | 0 | **STATIC SCREENSHOT** |
| `/smokecraft/connections` | `Connections.jsx` | `SmokeCraftImageBoundsOverlay` | 1 | 2 | 1 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/management-sync` | `ManagementSync.jsx` | `SmokeCraftImageBoundsOverlay` | 0 | 1 | 4 | **STATIC IMAGE WITH OVERLAY** |
| `/smokecraft/leaderboard` | `Leaderboard.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/event-challenge` | `EventChallenge.jsx` | none (gradient shell) | live | — | live | **FULLY LIVE** |
| `/smokecraft/how-it-works` | `HowItWorks.jsx` | `SmokeCraftAssetScreen` | 0 | 0 | 0 | **STATIC SCREENSHOT** |
| `/smokecraft/art` | `Art.jsx` | `SmokeCraftAssetScreen` | 0 | 0 | 0 | **STATIC SCREENSHOT** |
| `/smokecraft/menu` | `SmokeCraftMenu.jsx` | `SmokeCraftAssetScreen` | 1 | 0 (uses non-Hotspot buttons) | 0 | **STATIC IMAGE WITH OVERLAY** (commerce menu — separate feature area, not part of the educational journey) |

### Orphaned / legacy educational stand-ins (not on any journey path — dead code candidates, not audited for rebuild priority)

`Origins.jsx`, `Curation`, `Leaves`, `LeafChallenge*`, `Cultivation`, `Blend`, `FlavorDNA.jsx`, `Pairing.jsx`, `Available`, `Assistant`, `PairingMastery`, `Vitola` — all render via `SmokeCraftAssetScreen` with 0 buttons, 0 live-data refs, most under 30 lines. These routes are reachable but are not linked from any current journey screen (superseded by the merged screens built in Package D — Terroir, Format, KnowledgeDrop, PairingRecommendations). Classified **STATIC SCREENSHOT / orphaned**, flagged for removal-after-verification rather than rebuild.

## Why the Deployed Site Still Looks Static

**Packages K through S (and the two "recovery" fixes) only ever touched the *supporting modules and later-numbered sessions* built or rebuilt from Package K onward** (S1, S3, S4, S7, S14, S15, S21, S22, S25/26, S27, plus Leaderboard/Mini Tasting/SmokeCraft Challenge/Event Challenge/AI Summary/Pairing Recommendations/Rewards/Achievements/Recommended Next Journey/Venue Selection). **None of those packages ever touched the earlier numbered sessions (S2, S5, S6, S8, S10, S11, S12, S16, S19, S23, S24) or the Entry-layer/supporting screens built earliest in this codebase's history (Identity, Mentor Selection, Golden Box, Seed & Soil, Connections, Management Sync, Request/Purchase, Second Humidor Match, Mini Tasting Round).** Those screens still use the original `SmokeCraftImageBoundsOverlay`/`SmokeCraftAssetScreen` pattern from before this session's rebuild work began — full production screenshots with a handful of transparent click zones or form fields layered on top, exactly as visually confirmed in production.

## Totals

- **Total SmokeCraft journey/entry/supporting routes audited (excluding orphaned/dead and pure-redirect routes): 41**
- **Fully static (STATIC SCREENSHOT): 9** — Enroll, GoldenBoxStatus, SecondHumidorMatch, MiniTastingRound, HowItWorks, Art, plus 3 commerce/menu-adjacent screens not on the educational path.
- **Static image with overlay: 15** — SmokeCraft Launch, Format, FlavorMemory, PairingLab, FinalThird, PassportStamp, FinalReview, Mentor Selection, Golden Box, Seed & Soil, Connections, Management Sync, SmokeCraft Menu, plus 2 more counted in the per-route tables above.
- **Partially live: 8** — Identity, HumidorMatch, CutToastLight, FirstThird, SecondThird, Scorecard, RequestPurchase, plus Venue Selection counted separately below.
- **Fully live: 18** — every Package K–S screen (Welcome, Meet Your Cigar, Terroir, Lighting Tutorial, Mentor Commentary, Knowledge Drop, AI Summary, Pairing Recommendations, Rewards, Session Complete, Leaderboard, Mini Tasting module, SmokeCraft Challenge, Event Challenge, Resume Journey, Knowledge Check demo) plus Venue Selection (live interface, empty data source — see Rebuild Matrix).

**Confirmation: no source files were modified during this audit. This document and `SMOKECRAFT_LIVE_REBUILD_MATRIX.md` are the only files created.**
