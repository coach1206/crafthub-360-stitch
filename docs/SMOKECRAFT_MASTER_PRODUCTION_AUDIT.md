# SmokeCraft 360 — Master Production Audit (Phase 1, Read-Only)

No source files were modified to produce this document. All findings are derived directly from the active router (`src/App.jsx`), the locked journey registry (`src/constants/session.js`), the asset registry (`src/constants/smokecraftAssets.js`), the filesystem under `public/assets/`, and the two per-route classification passes already completed this session (`docs/SMOKECRAFT_STATIC_SHELL_AUDIT.md`, `docs/SMOKECRAFT_LIVE_REBUILD_MATRIX.md`), which are treated as authoritative rather than re-derived from scratch.

## 1–2. Branch / commit

- Branch: `recovery/smokecraft-codex-final`
- HEAD: `8295d2f6` — "feat(smokecraft): rebuild Launch and Enroll over approved GitHub design assets"

## 3. Working-tree status at audit start

Clean (`git status --short` → no output).

## 4. Routes found

`src/App.jsx` registers **105 SmokeCraft-scoped route matches** (includes redirects/aliases). Distinct real screens (non-redirect, non-alias): **~74**, spanning the numbered spine, entry layer, supporting modules, commerce sub-flow, and orphaned educational stand-ins. Full enumeration is in `SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md` and `SMOKECRAFT_ROUTE_IMAGE_MASTER_MAP.md`.

## 5. Journey registry entries found

- `VISIT_STRUCTURE` (`session.js`): 6 phases, **27 numbered sessions** (`TOTAL_SESSIONS = 27`), some sessions share one screen via `mergedInto` (S8/S9, S12/S13, S16–S18, S19/S20, S25/S26).
- `ENTRY_LAYER_SCREENS`: 5 screens, all `implemented: true`.
- `SUPPORTING_MODULES`: 9 screens, each with a `requires` gate.
- Legacy `SMOKECRAFT_FLOW` array (28 entries) still exists in the same file — it is **not** the source of truth (superseded by `VISIT_STRUCTURE`), used only by two now-secondary helpers (`getNextSmokecraftRoute`, `getLastSmokecraftRoute`). No current route guard reads it. Flagged as a stale-but-harmless legacy structure, not deleted during this audit.

## 6. Current sequence found in code

27-session, 6-phase locked spine — confirmed current, not "8-visit" or "24-session." No stale terminology found in `session.js` itself. (The stale "8-visit journey" copy previously found baked into `Enroll.jsx` was already corrected in a prior package this session.)

## 7. Asset directories found

| Directory | File count |
|---|---|
| `public/assets/smokecraft-reference/approved/` | 44 (incl. 1 subdirectory `batch-22`) |
| `public/assets/smokecraft/` (raw uploads, top level) | 67 |
| `public/assets/smokecraft/cropped/` | 41 |
| `public/assets/smokecraft/optimized/` | 7 (`.webp`) |
| `public/assets/smokecraft/source/`, `/golden-box/`, `/cigars/` | subdirectories, not separately inventoried line-by-line this pass |

## 8. Total SmokeCraft image assets found

**~152** top-level PNG/JPG files across the three primary directories (44 + 67 + 41), before subdirectories. Full inventory in `SMOKECRAFT_COMPLETE_APPROVED_ASSET_INVENTORY.md`.

## 9. Documents created this pass

- `docs/SMOKECRAFT_MASTER_PRODUCTION_AUDIT.md` (this file)
- `docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md`
- `docs/SMOKECRAFT_COMPLETE_REBUILD_MATRIX.md`
- `docs/SMOKECRAFT_COMPLETE_APPROVED_ASSET_INVENTORY.md`
- `docs/SMOKECRAFT_ROUTE_IMAGE_MASTER_MAP.md`
- `docs/SMOKECRAFT_KNOWN_FAILURE_REGISTER.md`

## 10. Audit commands run

```
git branch --show-current
git log -1 --oneline
git status --short
grep -n "smokecraft" src/App.jsx
wc -l src/constants/session.js
find public/assets/smokecraft-reference/approved -type f
find public/assets/smokecraft -maxdepth 1 -type f
find public/assets/smokecraft/cropped -type f
grep -oE "[A-Za-z0-9%&,.' -]+\.(png|jpg|jpeg)" src/constants/smokecraftAssets.js
```
Plus a Python set-diff cross-referencing every filename on disk against every URL-decoded filename referenced in `smokecraftAssets.js`, to identify unmapped/orphaned image files without opening and re-classifying all ~150 of them individually.

## 11. Confirmation: no source code changed during this audit

Confirmed. Only `docs/*.md` files were created/read in this phase. `git status --short` will show only new files under `docs/`.

## 12. Confirmation: existing verified work preserved

Confirmed intact, not touched this phase:
- Launch (`SmokeCraft.jsx`) — approved-image rebuild (commit `8295d2f6`)
- Enroll (`Enroll.jsx`) — approved Guest Pass rebuild (commit `8295d2f6`)
- Identity (`Identity.jsx`) — live rebuild (commit `5b2d5ed3`)
- Venue Selection (`VenueSelect.jsx`) — strict empty-state fix (commit `4b848255`)
- Resume (`ResumeJourney.jsx`) — logic untouched, decorative header only (commits `ac8624a1`/`8295d2f6`)

---

## Findings: routes by classification

Reusing the classification already completed in `SMOKECRAFT_STATIC_SHELL_AUDIT.md`, cross-checked against the current registry. Counts, restated here for the master audit:

| Classification | Count (approx.) | Examples |
|---|---|---|
| **Fully live (approved)** | ~24 | Welcome, MeetYourCigar, Terroir, LightingTutorial, MentorCommentary, KnowledgeDrop, AISummary, PairingRecommendations, Rewards, SessionComplete, Leaderboard, EventChallenge, VenueSelect, Resume, Identity, Enroll, SmokeCraft (Launch) |
| **Static image + overlay (invisible hotspots)** | ~16 | Mentor Selection, Format, FlavorMemory, PairingLab, FinalThird, PassportStamp, FinalReview, Connections, ManagementSync, GoldenBox, SeedSoil |
| **Partially live** | ~7 | HumidorMatch, CutToastLight, FirstThird, SecondThird, Scorecard, RequestPurchase |
| **Static screenshot (zero interactivity)** | ~10 | GoldenBoxStatus, SecondHumidorMatch, MiniTastingRound, HowItWorks, Art |
| **Orphaned / not on any journey path** | ~12 | Origins, Curation, Leaves, LeafChallenge*, Cultivation, Blend, FlavorDNA, Pairing, Available, Assistant, PairingMastery, Vitola |
| **Commerce sub-flow (out of educational-journey scope)** | 8 | Menu, VenueCommerce, Cart, Checkout, PaymentSuccess, OrderStatus |
| **Pure redirects/aliases** | ~26 | `/intake`, `/entry`, `/profile`, `/education`, `/mentors`, `/humidor`, `/light`, `/complete`, `/gold-box`, `/mentor`, `/shape-size-burn`, `/challenge`, `/mini-tasting-round`, `/session/start`, `/passport`, `/smokecraft/session-1..4`, etc. |

## Findings: stale/wrong Next-Back routes

None newly found beyond what `SMOKECRAFT_STATIC_SHELL_AUDIT.md` already flagged. `getEntryRoute()` in `SmokeCraft.jsx` (fixed prior session, preserved) is the only entry-routing logic; the numbered spine's Next/Back is driven by `SmokeCraftSessionGuard` + `VISIT_STRUCTURE` order, which is internally consistent.

## Findings: missing persistence

No new gaps found in the entry layer or numbered spine — all currently-live screens write to `useGuestSession`/`useSmokeCraftJourney` per the established two-context pattern. Screens still in "static image + overlay" or "partially live" state (list above) have **not** been individually re-audited for persistence gaps in this pass; that level of detail is deferred to each route's own package in `SMOKECRAFT_COMPLETE_REBUILD_MATRIX.md`.

## Findings: hardcoded/fabricated data

Confirmed still present wherever a route is classified "static image + overlay" (the baked pixels are, by definition, fabricated/static UI). No *new* instances of fabricated live-data text were found in currently-live screens.

## Findings: wrong approved image / generic replacement layout

None currently — the two rebuilt-this-session routes (Launch, Enroll) now use the correct approved assets (`smokecraft-landing.png`, `smokecraft-guest-pass.png`). No route is currently using a "generic replacement layout" in place of an approved image; the risk this protocol warns against was avoided by course-correcting before completing more of Package A.

## Findings: missing responsive behavior / nonfunctional controls

Not independently re-verified per-route in this pass (would require opening and interacting with each of the remaining ~33 non-fully-live routes). Deferred to per-package execution, tracked in the rebuild matrix.

---

## Addendum — Package A → B handoff correction

A post-completion trace found Mentor Selection hardcoded a jump straight to `/smokecraft/format` (S5), skipping Seed & Soil, Humidor Match, Meet Your Cigar, and Terroir. This was **not** evidence of a second stale "8-visit/24-session" system in the live render path — every component in the actual render chain (`LockedSmokeCraftScreen.jsx`, `smokecraftJourney.js`) correctly reads `TOTAL_VISITS=6`/`TOTAL_SESSIONS=27`. The literal "8-visit/24-session" strings exist only in orphaned modules (`smokecraftJourneyContract.js`, `VisitLockGuard.jsx`) that are imported in `App.jsx` but never mounted on any route — confirmed dead code, not a live defect. Full trace and fix in `docs/SMOKECRAFT_AUTHORITATIVE_ROUTE_GRAPH.md`.

**SMOKECRAFT MASTER RECOVERY AUDIT COMPLETE**
