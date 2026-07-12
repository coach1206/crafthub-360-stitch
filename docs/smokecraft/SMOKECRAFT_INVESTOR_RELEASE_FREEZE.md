# SMOKECRAFT 360 — INVESTOR RELEASE FREEZE

## Release Identity

| Field | Value |
|---|---|
| Release name | SmokeCraft 360 Investor-Ready Release |
| Tag | `smokecraft-v1.0.0-investor-ready` |
| Tagged commit | `04efc8c469cffe260223cb1aef48902aacdd5e92` |
| Branch | `claude/beautiful-thompson-r3mm5m` |
| Deployment URL | https://crafthub-360-stitch-git-claude-b-391e46-coach1206-smokecraft360.vercel.app |
| Deployment status | Ready (Vercel, confirmed Jul 12 2026 18:03 UTC) |
| Verification date | July 12, 2026 |

## Final Investor Status

**SMOKECRAFT 360 — INVESTOR READY WITH DISCLOSED LIMITATIONS — FROZEN**

## Test Totals

| Suite | Checks | Pass | Fail | Blocked |
|---|---|---|---|---|
| e2e-smokecraft-final-live-mvp2-closeout.mjs | 71 | 71 | 0 | 0 |
| e2e-smokecraft-mvp2-final-partials-closeout.mjs | 88 | 86 | 0 | 2 |
| e2e-smokecraft-visual-regression.mjs | 29 | 29 | 0 | 0 |
| **Total** | **188** | **186** | **0** | **2** |

Blocked checks: H6 (live DB rollback, no DATABASE_URL) and K-lighthouse (Lighthouse, requires CI-mode Chrome). Both are environment constraints, not defects.

## Viewport Results

| Viewport | Dimensions | Screens | Result |
|---|---|---|---|
| Desktop | 1440×900 | 18 | 18/18 PASS |
| Tablet Landscape | 1024×768 | 18 | 18/18 PASS |
| Tablet Portrait | 768×1024 | 18 | 18/18 PASS |
| Handheld | 430×932 | 18 | 18/18 PASS |
| Mobile | 390×844 | 18 | 18/18 PASS |
| **Total** | | | **90/90 PASS** |

## Visual Regression Results

- Suite: `e2e-smokecraft-visual-regression.mjs`
- Screens captured: 29
- Baselines written: 29/29
- Compare pass: 29/29 PASS at 0.00% diff
- Threshold: 2%
- Viewport: 390×844 (iPhone 14 Pro, 2× scale)

## Approved Route Count

29 routes covered by visual regression baselines.

## Approved Journey Count

24 sessions across 8 visits, defined in `smokecraftJourneyContract.js` with self-validating IIFE. Journey order is frozen.

| Session | Route | Label |
|---|---|---|
| S1 | /smokecraft | SmokeCraft Home |
| S2 | /smokecraft/enroll | Enroll |
| S3 | /smokecraft/golden-box | Golden Box |
| S4 | /smokecraft/mentor-selection | Mentor Selection |
| S5 | /smokecraft/format | Format |
| S6 | /smokecraft/wrapper-strength | Wrapper Strength |
| S7 | /smokecraft/seed-soil | Seed & Soil |
| S8 | /smokecraft/pairing-lab | Pairing Lab |
| S9 | /smokecraft/humidor-match | Humidor Match |
| S10 | /smokecraft/request-purchase | Request Purchase |
| S11 | /smokecraft/cut-toast-light | Cut Toast Light |
| S12 | /smokecraft/first-third | First Third |
| S13 | /smokecraft/second-third | Second Third |
| S14 | /smokecraft/flavor-memory | Flavor Memory |
| S15 | /smokecraft/final-third | Final Third |
| S16 | /smokecraft/scorecard | Scorecard |
| S17–S20 | /smokecraft/connections etc. | Connections / Pairing Review / Final Review / Visit Summary |
| S21 | /smokecraft/passport-stamp | Passport Stamp |
| S22–S23 | /smokecraft/leaderboard etc. | Leaderboard / Passport Connections |
| S24 | /smokecraft/session-complete | Session Complete |

## Known Limitations

### R14 — Image Optimization (PARTIAL)

Optimized WebP variants exist under `public/assets/smokecraft/optimized/` and `public/smokecraft/images/optimized/` with 91–93% file size savings. These variants are not yet referenced by active route components — pages continue to load original approved JPG/PNG assets. Lighthouse measurement is deferred. This is a post-investor performance task. No route component may be modified to reference WebP variants without regression approval and a full visual regression re-run.

### R17 — Database Rollback (PARTIAL)

Rollback tooling (`scripts/migrations/rollback/rollback-master.mjs`) covers all 72 migrations and passes dry-run verification. Live rollback execution requires `DATABASE_URL` environment variable and authorized DBA access. No production database action is authorized under this directive.

## Frozen Assets

- `public/approved/` — 45 approved images, must not be deleted or renamed
- `public/assets/smokecraft/` — all image assets in use by active routes
- `public/smokecraft/images/` — all image assets in use by active routes
- `visual-regression-baselines/` — 29 PNG baseline files locked to this build
- `src/modules/smokecraft/data/smokecraftJourneyContract.js` — frozen journey definition

## Frozen Route Sequence

The 24-session / 8-visit sequence defined in `smokecraftJourneyContract.js` is frozen. The following rules are enforced at import time and must not be changed:

- `totalSessions: 24`
- `totalVisits: 8`
- `oneSessionShortcutAllowed: false`
- `journeyCompressionAllowed: false`
- `flavorMemoryRemovalAllowed: false`
- `visit8Protected: true`
- Flavor Memory must follow Second Third and precede Final Third

## Frozen Typography Standard

Premium dark/gold/obsidian brand system. Typography classes, font weights, and color tokens established in the investor build must not be altered. No font reduction, no color system changes, no brand redesign without founder approval and regression review.

## Frozen Investor-Demo Behavior

- Demo mode activated via `sessionStorage['novee_demo_mode'] = '1'`
- All 24 sessions unlock in demo mode via `isDemoMode` guard in `SmokeCraftProgressContext`
- Demo reset clears `novee_guest_session` and `novee_demo_session_active` from localStorage/sessionStorage
- Demo reset validator (`validateDemoReset`) enforces `targetsProductionDb !== true`
- Demo reset is available to `admin` and `founder_level_0` roles only
- Demo mode must never write to production database or trigger live integrations

## Post-Investor Backlog

See `docs/smokecraft/SMOKECRAFT_POST_INVESTOR_BACKLOG.md`.

## Change-Control Rules

The investor build is frozen at commit `04efc8c4`. A change to this frozen build is permitted only for:

1. Verified security defect
2. Verified data-loss defect
3. Broken deployment
4. Inaccessible critical route
5. Legal or privacy issue
6. Founder-approved release revision

The following changes are **not permitted** against the frozen investor build:

- Redesign preference or experimental styling
- Asset substitution
- Route reordering
- Font reduction
- Hotspot restoration
- Static screenshot restoration
- Navigation changes
- New feature requests
- Performance experimentation

All work beyond the above exceptions must occur on a new branch, after the frozen tag, and must not alter `main` or the tagged commit.
