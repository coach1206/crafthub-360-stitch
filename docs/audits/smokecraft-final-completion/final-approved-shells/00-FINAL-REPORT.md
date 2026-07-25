# 00 — Final Report: Final Approved-Shell Conversion Pass

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `8244423a2402d4591e602f3e45570b7fbdff6d6a` — verified local=remote, clean tree, before this pass.

## Method

A background agent converted 4 of the 6 named screens before hitting an account spend limit and stopping mid-task (before touching `Rewards.jsx`/`ResumeJourney.jsx`, and before committing). The orchestrating session picked up directly from that exact checkpoint — verified the 4 completed conversions for correctness, investigated the remaining 2 screens, and found both have a genuine asset-content blocker rather than a fixable code gap (see below). No work was discarded or redone.

## Non-negotiable rule applied

Every converted screen renders its approved image via `SmokeCraftImageBoundsOverlay` — the same established, non-destructive, aspect-ratio-preserving, percentage-positioned-overlay pattern already used correctly by `Format.jsx`/`Terroir.jsx` and the prior pass's `HowItWorks.jsx`/`RewardsCenter.jsx` fixes. No Claude-composed layout stands in for an approved image on any of the 4 converted screens.

## Per-screen result

### 1. Leaderboard.jsx — CONVERTED
Approved asset: `public/assets/smokecraft/LEADERBOARD 111.png`
Rendered hash verified == approved file hash (sha256 `7120ab3b…`). No "James Carter", no "18,750 XP", no stale "4435 XP" anywhere in the rendered DOM (verified live). Real overlays for rank/points/badges/filters. Old decorative-band/generic-list layout removed entirely.

### 2. PairingRecommendations.jsx — CONVERTED
Approved asset: `public/assets/smokecraft/personlized pairing 222.png`
Renders the approved image as the full shell. Real choose/reject-alternate interactivity preserved (`chooseAsPrimary`/`rejectCategory`, journey-persisted) — carried forward from the pre-existing working logic, not rebuilt.

### 3. Identity.jsx — CONVERTED
Approved asset: `public/assets/smokecraft/IDENTY.png`
Rendered hash verified == approved file hash (sha256 `00668504…`). No stale "Greg Guy" on a fresh entry. Existing correct blank-by-default field behavior (from the earlier `journey.identity` reset fix) preserved — only the visual shell changed.

### 4. Pairing.jsx — CONVERTED
Approved asset: `/assets/smokecraft-reference/approved/smokecraft-pairing.png`
`background-size: cover` cropping replaced with the same `SmokeCraftImageBoundsOverlay` intrinsic-sizing approach used elsewhere — the full composition now renders intact, no clipping.

### 5. Rewards.jsx (S25 curriculum screen) — NOT CONVERTED, genuine asset-content blocker
Approved asset: `public/assets/smokecraft/REWARDS 222.png`. Unlike its sibling `ACHIEVMENTS.png` (a genuine blank-value template — every stat literally shows `--`/`-- / --`/`+-- XP`), `REWARDS 222.png` is a **fully-baked mock dashboard** with fake specific numbers printed directly into the pixels: "TOTAL POINTS 2,750 XP", "BADGES EARNED 12", "PASSPORT STAMPS 5", a "2,750 / 5,000 XP" progress bar, and four reward cards with fixed prices (2,500/3,500/5,000/1,000 XP) for rewards that don't correspond to any real, configured reward system. There are no blank zones to overlay real data into — using this image as the full shell would mean either showing the baked fake numbers alongside/behind real ones, or covering the entire composition with opaque boxes, which defeats using the image at all. This is a defect in the approved asset itself (it needs to be re-exported with blank value zones, the way `Reward Center.png` and `ACHIEVMENTS.png` already are), not something fixable in code without either fabricating data or discarding the image. Left on its existing decorative-header-band usage, which was independently verified this pass to show 100% real, live-computed values (total XP, rank, XP breakdown by category, rank-tier claim status, earned badges) — no fake numbers reach the actual rendered data fields.

### 6. ResumeJourney.jsx — NOT CONVERTED, no approved asset exists
Confirmed via exhaustive filename search (`find public/assets -iname "*resume*"` and variants) — **no dedicated approved Resume/Start image exists anywhere in this repository.** `SC_ASSETS.resume` already explicitly documents this in its own comment: *"Entry layer — Resume/Start New Journey decorative header (visual-only enhancement; ResumeJourney.jsx has no image of its own to date)"* — it currently uses an unrelated Golden Box interior photo (`golden-box-hero-v2.jpg`) purely as decoration. Treating an unrelated photo as the screen's "approved design" would be the opposite of this mandate's intent. Left as-is; its Start/Resume/Start-New resolution logic (via `computeJourneyStatus`/the existing 3-state CTA contract) is unchanged and already correct.

## Test

`verify-smokecraft-final-approved-shells.mjs` — 13/13. Covers the 4 converted screens' hash verification and stale-data absence, plus documents (rather than silently passes over) the 2 genuinely-blocked screens with assertions that confirm no fake data leaks through on either.

## Retargeted assertion (not weakened)

`verify-smokecraft-tactile-haptic-interactions.mjs`'s Pairing Recommendations check previously required the `SmokeCraftTactileCard` component specifically. Since the approved-image-shell conversion correctly uses plain positioned buttons over the image's own zones — the same pattern `Format.jsx`/`Terroir.jsx` use, neither of which uses `SmokeCraftTactileCard` either — the assertion was retargeted to check for `SmokeCraftImageBoundsOverlay` instead, while keeping its real behavioral checks (`chooseAsPrimary`/`rejectCategory` presence) unchanged.

## Regressions

| Suite | Result |
|---|---|
| `verify-smokecraft-final-approved-shells.mjs` (new) | 13/13 |
| `verify-smokecraft-approved-landing-control-plane.mjs` | 62/62 |
| `verify-smokecraft-canonical-runtime.mjs` | 19/19 |
| `verify-smokecraft-canonical-journey-authority.mjs` | 25/25 |
| `verify-smokecraft-zero-legacy-runtime.mjs` | 9/9 |
| `verify-smokecraft-zero-old-visuals.mjs` | 20/20 |
| `verify-smokecraft-tactile-haptic-interactions.mjs` | 71/71 (1 assertion retargeted, see above) |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 |
| `verify-passport-security-unified-identity.mjs` | 59/59 |
| `npm run build` | pass |

All at or above every previously documented baseline. No test was weakened.

## Build / startup / health

`npm run build` passes. Backend `/api/health` returns 200. Preview server (`vite preview` :5050) returns 200.

## Files changed

Modified: `src/pages/smokecraft/Leaderboard.jsx`, `src/pages/smokecraft/Identity.jsx`, `src/pages/smokecraft/Pairing.jsx`, `src/pages/smokecraft/PairingRecommendations.jsx`, `verify-smokecraft-tactile-haptic-interactions.mjs` (1 retargeted assertion). New: `verify-smokecraft-final-approved-shells.mjs`, `public/proof/smokecraft-final-approved-shells/**`, this documentation set.

## Remaining blockers

Two of the six named screens remain genuinely un-convertible without either fabricating data or misrepresenting an unrelated photo as an approved design:
- `Rewards.jsx` needs `REWARDS 222.png` re-exported with blank value zones (matching its own sibling `ACHIEVMENTS.png`'s existing template design) before a real conversion is possible.
- `ResumeJourney.jsx` needs a dedicated approved Resume/Start image to exist at all before any conversion is possible.

Both are asset-provisioning gaps for the repo owner, not code defects.

**Status: FAIL — ONE OR MORE SCREENS STILL USE A CLAUDE-COMPOSED, CROPPED, GENERIC, OR DECORATIVE-BAND LAYOUT**

4 of 6 named screens are now genuinely converted and verified. The remaining 2 are honestly blocked by the approved assets' own content (one has no blank zones to overlay, one doesn't exist yet) — disclosed plainly rather than forced into a fabricated-looking conversion.
