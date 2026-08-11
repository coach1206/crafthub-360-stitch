# SmokeCraft 360 — Designer Change Boundaries (Doc 10 of 10)

This document states plainly what a UI designer **may** change on
`integration/smokecraft-main-candidate` and what they **must not** change,
grounded in the actual architecture documented in docs 01–09 rather than
abstract rules. When in doubt, treat anything not explicitly listed under
"MAY" as off-limits until confirmed with the owner or an engineer.

**Status: NOT MERGED into `main`. NOT DEPLOYED. NOT OWNER-APPROVED.** Same
standing constraints as the rest of this package apply to any change made
under the "MAY" list below — it still doesn't authorize merge or deploy.

---

## MAY change

| Area | What this means concretely, on this branch |
|---|---|
| **Spacing** | `padding`, `margin`, `gap`, `clamp()` sizing values inside `src/constants/smokecraftLiveScreenTokens.js` (`cardStyle`, `heroBannerStyle`, `pageShellStyle`) and per-screen inline styles. Adjusting these does not touch any gating or completion logic — they're pure layout. |
| **Opacity** | The gradient overlay values in `SmokeCraftOwnerHeroBackground.jsx` (currently `rgba(6,8,12,0.74)…0.88`, tuned once already to bury baked-in title text — see doc 06) and the `GLASS = 'rgba(233,193,118,0.06)'` card translucency in `smokecraftLiveScreenTokens.js`. Retuning either is squarely visual. |
| **Panel treatment** | Card/panel background, border, border-radius, box-shadow — anything under `cardStyle`/`heroBannerStyle`/`pageShellStyle`. The underlying `position: relative; zIndex: 2` on the content wrapper (see doc 06's CSS-stacking fix) must stay, but its visual skin (color, blur, border) is open. |
| **Typography hierarchy** | Font sizes, weights, letter-spacing, and which text reads as a heading vs. body vs. label. The screen's actual copy (button labels, headings, instructional text) is content, not styling — see "live DOM controls" under MUST NOT if a change would alter what a label *says* rather than how it *looks*. |
| **Image positioning** | `bgPosition` / `bgSize` props on `SmokeCraftOwnerHeroBackground` (already tuned per-screen — see doc 06, e.g. `"center 30%"` on Final Third, `"center top"` on Request/Purchase). Repositioning within the *same* image is fine; swapping which image file is used is not (see "owner images without approval" below). |
| **Visual layering** | Z-index values, blur/backdrop-filter, layering of decorative elements *above or below* the live content — as long as the invariant from doc 06 holds: background image at the bottom, live DOM content always on top and always clickable. Verify with a real click-through after any layering change, the same way the CSS-stacking bug was caught and fixed on this branch. |
| **Motion / transitions** | Adding, removing, or retiming CSS transitions/animations (hover states, fade-ins, the passport-stamp animation's visual timing, etc.), as long as no transition is gating advancement — a "Continue" button must still be clickable and functional the instant it renders, not only after an animation completes. |
| **Responsive polish** | Breakpoint-specific spacing/sizing/wrapping fixes at the 5 viewports referenced in doc 07 (`tablet-primary` 1180×820, `tablet-secondary` 1024×768, and others per the broader responsive-proof claim). Regenerate the visual proof (doc 06's regeneration steps) after any responsive change. |
| **Readability** | Contrast, text-shadow, background-dimming behind text — the entire reason the gradient overlay and card translucency exist. This is explicitly *encouraged* work, not just permitted, per the standing instruction that led to the CSS-stacking and baked-title fixes in this branch's own history (doc 06). |
| **Visual depth** | Shadows, subtle parallax/blur layering, depth cues between the background photography and foreground cards — anything that makes the screen read as layered rather than flat, without changing what's clickable or in what order. |
| **Balance between photography and interface** | The core subject of the most recent visual pass on this branch (doc 06): how much of the owner's photo shows through vs. how dominant the card/interface surface is. Rebalancing this — lighter overlay, smaller cards, different crop emphasis — is fair game, provided the three hard constraints from that pass still hold: no flat opaque panel reintroduced, no baked title/text duplicated on screen, live controls never obscured. |

---

## MUST NOT change

| Area | What this means concretely, on this branch |
|---|---|
| **Route order** | The 25-entry canonical route order in doc 02 / `SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json`, and the route paths themselves in `src/App.jsx`. This order was locked and verified by a real-browser trace (doc 07, `canonicalJourneyPass: true`, 24/24 checkpoints). A route rename or reorder breaks that proof silently. |
| **Stage order** | The 27-session / 6-phase spine and its merges (doc 02) — which sessions render on which screen, and which phase each belongs to. This is sourced from `src/constants/session.js`'s locked `VISIT_STRUCTURE`; it is not a design decision. |
| **Progression logic** | What counts as "done" on a given screen, what unlocks next, `completeStep()` calls, `journey.*` state writes that drive advancement. This lives in each screen's component logic and journey context, not its styling. |
| **Gating logic** | `SmokeCraftSessionGuard`, `requires="..."` prerequisites on supporting-module routes (doc 03), and the two confirmed required-interaction gates (Final Third's flavor-chip minimum, Scorecard's 6-category minimum — doc 02/07). These were specifically verified to genuinely block on zero input; a visual change must never make a gate cosmetically appear satisfied without the underlying state actually being set. |
| **Backend contracts** | Request/response shapes, field names, and endpoint paths documented in doc 09 (`pos360_smokecraft_*`, `eat_smokecraft_*`, `passport_360_*` tables and their API routes). A frontend visual change must never rename a field being sent to `createOrderIntent()`, `syncManagement()`, `awardPassportStampLive()`, etc. |
| **Session state** | The shape and meaning of `journey.*` fields (`journey.selectedCigar`, `journey.passportStamp`, `journey.flavorMemory`, etc.) read throughout the spine and relied on by later screens (e.g. Session Complete's recommendation engine, doc 09 §3). Restyling a screen must not incidentally stop it from writing a field a later screen depends on. |
| **POS360 behavior** | Order-intent creation, handoff-request creation, staff-action recording, and — critically — the loyalty-accrual trigger (fires *only* on a real `order_fulfilled` staff action, never on request creation, never from gameplay XP — doc 09 §1). No visual change should alter when or whether these calls fire. |
| **E.A.T. behavior** | The session-completion sync sequence fired from `SessionComplete.jsx` (doc 09 §2: `syncManagement` → `recordGuestActivity` → `createManagerAlertSync` → `createInventorySignalSync` → `writeEATSyncAuditEvent`). This is fire-and-forget by design (a backend failure must never block or falsely-succeed the guest's own completion) — don't wrap it in anything that changes that guarantee. |
| **Passport / Rewards logic** | Stamp-claim deduplication (`dedupe_key`), XP amounts (server-authoritative via `sessionRewardTable.js` — the client never controls an XP number, doc 09 §3), badge auto-grant tied to session completion, and the deterministic (non-AI) recommendation scoring in `recommendedJourneyService.js`. None of this is a styling concern; don't let a component refactor touch it incidentally. |
| **Live DOM controls** | Every button, input, chip, and form field that currently does something real (doc 07's functional proof: `allScreensPass: true`, real navigation on every "Continue," genuine click-through confirmed on Identity and traced across all 14). A designer may restyle a control, but must not remove it, make it decorative, or change what it submits. This is also the standing instruction that shaped the entire most recent visual pass on this branch — see doc 06's explicit "preserve all live DOM controls, text, buttons, data." |
| **Completion rules** | What marks a session/screen "complete" server-side and client-side (`completedSteps`, `session-complete` guard checks, the two required-interaction gates listed under gating logic above). This is functional state, not a visual state to be simulated. |
| **Owner images without approval** | The 14 owner-provided hero images (`public/assets/smokecraft/owner-rebuild/*`) and their derived crops are the owner's own photography, wired in a prior phase of this same branch with explicit owner-provided assets. Swapping, replacing, or generating new imagery to stand in for them requires the owner's approval — the same standing rule that applied throughout the owner-rebuild visual pass (doc 06). Repositioning/recropping/retuning overlay on the *existing* approved images is a MAY (see above); introducing different imagery is not.

---

## The dividing line, in one sentence

**If a change only affects how a screen looks and not what it does, when it
unlocks, what it sends to a backend, or which exact image is shown — it's a
MAY. If it touches order, gating, state, contracts, or asset identity —
it's a MUST NOT**, and needs an engineer or the owner, not a design pass.
