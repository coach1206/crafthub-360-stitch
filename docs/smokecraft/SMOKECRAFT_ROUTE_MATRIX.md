# SmokeCraft Route Matrix — Prompt 1

Baseline commit: `d6469504a2a83ab4acfb27e89a25064d505d4d55`
Branch: `recovery/smokecraft-codex-final`

This document is the human-readable summary layer over the mechanically-generated
raw extraction in `SMOKECRAFT_ROUTE_MATRIX_RAW.md` (produced by
`scripts/smokecraftRouteInventory.mjs`, which parses `src/App.jsx` directly rather
than being hand-transcribed) and the session-level detail in
`SMOKECRAFT_27_SESSION_AUDIT.md` (produced by `scripts/smokecraft27SessionAudit.mjs`,
reading `VISIT_STRUCTURE`/`SMOKECRAFT_SCREEN_MANIFEST`/`SC_ASSETS` directly).

**Total routes registered under `/smokecraft`: 109** (raw JSX `<Route>` elements,
including nested sub-groups like `golden-box/*`, `passport/*`, `cart` etc., and
including `Navigate` redirect/alias entries).

## Route classification

| Category | Count | Source |
|---|---|---|
| Entry-layer routes (Landing, Enroll/Guest Pass, Identity, Venue Selection) | 4 | `SMOKECRAFT_SCREEN_MANIFEST` entry-type entries |
| Curriculum session routes (S1–S27) | 27 | `VISIT_STRUCTURE`, see `SMOKECRAFT_27_SESSION_AUDIT.md` |
| Legacy `Navigate` redirects/aliases (`/intake`, `/entry`, `/profile`, `/education`, `/mentors`, `/humidor`, `/light`, `/complete`, `/smokecraft/session-1`) | 9 (see raw matrix) | raw route extraction |
| Golden Box sub-group (`golden-box`, `golden-box/status`, `golden-box/competitions`, `.../judge`, `.../judge/entries/:id`, `.../entries/:id/blend`, `.../results/:id`, etc.) | 12 | raw route extraction |
| Passport sub-group (`passport`, `passport/stamps`, `passport/activity`, etc.) | ~6 | raw route extraction |
| Cart/checkout sub-group (`cart`, `checkout`, `payment-success`, `order-status`) | 4 | raw route extraction |
| Remaining supporting/challenge/leaderboard/mentor/collections/pairing/etc. routes | remainder | raw route extraction |

Full per-route detail (path, raw element JSX) is in `SMOKECRAFT_ROUTE_MATRIX_RAW.md`.

## Landing-page navigation sources (verified against source, not hand-guessed)

The Landing page (`src/pages/SmokeCraft.jsx`) contains **zero inline hardcoded
route strings** — every control calls `resolveSmokeCraftLandingAction(actionId,
journeyState)` (single canonical resolver, `src/constants/smokecraftLandingActions.js`),
confirmed by direct source read. The complete action enum
(`SMOKECRAFT_LANDING_ACTIONS`) has exactly **9 members**:

| Action ID | Destination (from `SMOKECRAFT_LANDING_DESTINATIONS` / `resolveSmokeCraftEntryDestination`) | Notes |
|---|---|---|
| START | earliest incomplete entry step (Enroll → Identity → Venue → Welcome, or resume-in-progress session) | verified in the navigation-authority pass (previous session) |
| RESUME | same resolver as START, non-destructive | |
| START_NEW | Identity (if enrolled) or Enroll (if not) | fixed in the navigation-authority pass — previously incorrectly resolved to Venue Selection, skipping Identity |
| HOW_IT_WORKS | `/smokecraft/how-it-works` | |
| REWARDS | `/smokecraft/rewards-center` | |
| RANKINGS | `/smokecraft/leaderboard` | |
| PASSPORT | `/smokecraft/passport` | |
| PAIRING | `/smokecraft/pairing` | |
| CRAFTHUB | `/smokecraft/crafthub` | confirmed via screenshot (previous pass) to render its own distinct "CRAFTHUB 360 — Venue Table Experience" screen, not Session 1 |

## Bottom in-session navigation (`SmokeCraftNavBar`)

`src/components/smokecraft/SmokeCraftNavBar.jsx` renders exactly 2 controls
(Primary/Continue, Secondary/Back) as real `<button>` elements — confirmed by
source read, not a transparent-hotspot-over-image pattern. Its own docstring
records a previously-fixed defect (primary button rendering unconditionally
even when no primary handler was supplied) — already fixed, not reopened here.

**Separately, and NOT the same thing:** several approved images (e.g.
`session 1.png`) have a decorative 6-icon strip (Home/Journey/Learn/Create/
Pairing/Mentor) **baked into the artwork itself**. This is visually
navigation-shaped but is not a live control. **Classified as `DEAD VISUAL
CONTROL — REPAIR REQUIRED (Prompt 3)`** — see the defect register.

## Known route mismatches from this operation's history (already fixed, verified via test + screenshot)

- Venue Selection previously routed to Identity as "next" and Enroll as
  "back," skipping Identity in both directions — **fixed**, see commit
  `b5f6fa6b`.
- Venue Selection's approved image bled baked sidebar/stats content at wide
  viewports due to `background-size: cover` — **fixed**, see commit
  `d6469504`.
- No other route-to-component mismatch was found and reproduced via
  screenshot in the CraftHub/Leaderboard/Welcome investigation from the
  immediately preceding pass.

## Scope note

A full click-through verification of all 109 routes (with per-route title,
asset, and live-vs-baked classification) was not performed in this pass —
see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` for what is deferred to Prompt 2,
and the Part 11 screenshot set for the routes that WERE actually opened and
captured this pass.
