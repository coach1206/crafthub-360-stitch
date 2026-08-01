# 02 — Investor Demo Path

Canonical route order for a live investor walkthrough, with a one-line
talking point per screen. Total estimated live-presentation duration:
**~10-15 minutes** at a natural pace (pausing to narrate each screen).

## Setup before a live demo

1. Open the app fresh (or use **Reset Demo Session** at
   `/smokecraft/demo-reset` if investor-demo mode is already active on the
   device — clears local progress only, never touches the backend).
2. Visit `/smokecraft/demo` and click **Continue in Demo Mode** — this is
   the app's own sanctioned, pre-existing investor-demo control
   (`enterDemoMode()`, `src/context/DemoModeContext.jsx` /
   `src/pages/smokecraft/Demo.jsx`). It unlocks in-order navigation across
   the 27-session spine for walkthrough purposes; it does **not** replace
   or mock any screen's own data — every screen still reads its real,
   live XP/Passport/Golden-Box state from the same server APIs a real
   player uses (verified in `05-live-data-honesty.md`).
3. For a demo that should show a *fully completed* journey (recommended —
   most illustrative, shows Rewards/Passport/Golden-Box award state), have
   an operator pre-complete the 22 required sessions once via the real API
   (`scripts/verify-smokecraft-final-gameplay-acceptance.mjs` step 1 does
   exactly this, real HTTP calls, no DB/localStorage edits) before the
   live walkthrough, or simply play through live if more time is available.

## Route order and talking points

| # | Screen | Route | Talking point |
|---|---|---|---|
| 1 | Welcome | `/smokecraft/welcome` | "Every journey starts with a real orientation dashboard — today's cigar, venue, and mentor context, not a static splash screen." |
| 2 | Venue Select | `/smokecraft/venue-select` | "Players choose or skip a real venue — this ties into our venue-humidor commerce and staff-pairing systems." |
| 3 | Mentor Selection | `/smokecraft/mentor-selection` | "A real mentor-guidance engine personalizes commentary later in the journey based on what this player actually does." |
| 4 | Humidor Match (selection session) | `/smokecraft/humidor-match` | "This is a server-graded selection — the server independently knows the correct answer; an incorrect choice never silently completes." |
| 5 | First Draw (tasting session) | `/smokecraft/first-third` | "Real sensory observation capture — aroma, draw, body — submitted and stored server-side, not just kept in the browser." |
| 6 | Scorecard (rating session) | `/smokecraft/scorecard` | "A full 6-category rating with a server-computed overall score — the client can no longer submit its own total." |
| 7 | Rewards | `/smokecraft/rewards` | "XP and rank shown here are read live from the same canonical server ledger every other system uses — not a local cache." |
| 8 | Passport | `/smokecraft/passport` | "A real Passport-360 stamp record certifies journey completion — shared across the whole NOVEE OS platform, not SmokeCraft-only." |
| 9 | Skill Tree | `/smokecraft/skill-tree` | "Visualizes real progression — a retention and re-engagement hook." |
| 10 | Leaderboard | `/smokecraft/leaderboard` | "Competitive/social layer — real player rankings." |
| 11 | Golden Box — Build | `/smokecraft/golden-box` | "Our flagship competition system — players build a real custom cigar entry (wrapper/binder/filler/vitola)." |
| 12 | Golden Box — Competitions | `/smokecraft/golden-box/competitions` | "Real, live competitions a player can enter today." |
| 13 | Golden Box — Results/Award | `/smokecraft/golden-box/results/:competitionId` | "A real, independent judge scores the entry against a server-owned rubric; the server computes placement — here, a real first-place award." |
| 14 | Session Complete | `/smokecraft/session-complete` | "A data-driven recommendation for the player's next journey, built from what they actually did — not a generic dead end." |

## Required demo player state

One guest identity, fully completed (22/22 sessions) via the real API,
plus one finalized Golden Box competition with a real first-place award —
exactly the state `scripts/verify-smokecraft-final-gameplay-acceptance.mjs`
builds and proves. No DB edits, no localStorage seeding.

## Reset procedure between demos

`/smokecraft/demo-reset` → **Reset & Start Demo** — device-local only
(localStorage/sessionStorage), never touches the backend database, other
guests, or the demo player's own server-side record (a fresh server-side
guest identity is auto-issued to the new browser session on next contact,
exactly as it is for any new visitor).

## Fallback if a step fails live

- If a screen fails to load: use **Back** (every screen has one) and
  retry, or jump directly to the next screen via the sidebar/nav — no
  single screen is a hard dependency for the rest of the walkthrough.
- If Golden Box judging/award state isn't ready (requires a separate
  judge/admin action): fall back to showing the **Build** screen only and
  narrate the judging/award flow from `04-screen-proof-index.md`'s
  screenshots instead of live.
