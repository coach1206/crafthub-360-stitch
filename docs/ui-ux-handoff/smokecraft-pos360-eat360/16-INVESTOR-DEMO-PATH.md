# 16 — Investor Demo Path

## Scope disclosure

This demo path is real, proven, and reused directly from
`public/proof/smokecraft-final-gameplay-acceptance/02-investor-demo-path.md`.
**It covers SmokeCraft 360 and Golden Box only.** POS360 and E.A.T. 360
have no proven investor-demo path — both route trees are `demoBlocked` in
`App.jsx` (see `03-USER-ROLES-AND-RBAC.md`), meaning the platform's own
sanctioned Demo Mode explicitly does not unlock them. Do not build an
investor demo script that assumes POS360/E.A.T. 360 can be shown the same
way.

## Setup before a live demo

1. Open the app fresh, or use **Reset Demo Session** at
   `/smokecraft/demo-reset` if investor-demo mode is already active on
   the device (clears local progress only, never touches the backend).
2. Visit `/smokecraft/demo` and click **Continue in Demo Mode** — the
   app's own sanctioned control (`enterDemoMode()`,
   `src/context/DemoModeContext.jsx` / `src/pages/smokecraft/Demo.jsx`).
   Unlocks in-order navigation across the 27-session spine; does **not**
   mock any screen's data — every screen still reads real, live
   XP/Passport/Golden-Box state from the same server APIs a real player
   uses.
3. For a demo showing a fully completed journey (recommended — most
   illustrative): have an operator pre-complete the 22 required sessions
   via the real API before the walkthrough, or play through live if time
   allows.

## Route order and talking points

| # | Screen | Route | Talking point |
|---|---|---|---|
| 1 | Welcome | `/smokecraft/welcome` | Real orientation dashboard — today's cigar, venue, mentor context, not a static splash. |
| 2 | Venue Select | `/smokecraft/venue-select` | Real venue tie-in to commerce and staff-pairing systems. |
| 3 | Mentor Selection | `/smokecraft/mentor-selection` | Real mentor-guidance engine personalizes later commentary based on actual player activity. |
| 4 | Humidor Match | `/smokecraft/humidor-match` | Server-graded selection — server independently knows the correct answer. |
| 5 | First Draw | `/smokecraft/first-third` | Real sensory-observation capture, stored server-side. |
| 6 | Scorecard | `/smokecraft/scorecard` | Full 6-category rating, server-computed overall score. |
| 7 | Rewards | `/smokecraft/rewards` | XP/rank read live from the canonical server ledger. |
| 8 | Passport | `/smokecraft/passport` | Real Passport-360 stamp, shared platform-wide. |
| 9 | Skill Tree | `/smokecraft/skill-tree` | Progression visualization, retention hook. |
| 10 | Leaderboard | `/smokecraft/leaderboard` | Real player rankings, competitive/social layer. |
| 11 | Golden Box — Build | `/smokecraft/golden-box` | Flagship competition — real custom cigar entry build. |
| 12 | Golden Box — Competitions | `/smokecraft/golden-box/competitions` | Real, live competitions. |
| 13 | Golden Box — Results/Award | `/smokecraft/golden-box/results/:competitionId` | Independent judge scores a real rubric; server computes placement. |
| 14 | Session Complete | `/smokecraft/session-complete` | Data-driven next-journey recommendation. |

Estimated live-presentation duration: ~10-15 minutes at a natural pace.

## Required demo player state

One guest identity, fully completed (22/22 sessions) via the real API,
plus one finalized Golden Box competition with a real first-place award.

## Reset procedure between demos

`/smokecraft/demo-reset` → **Reset & Start Demo** — device-local only,
never touches the backend or other guests.

## Fallback if a step fails live

Every screen has Back; retry or jump via sidebar/nav — no screen is a
hard dependency for the rest of the walkthrough. If Golden Box
judging/award state isn't ready, show the Build screen only and narrate
judging/award from screenshots.

## What NOT to attempt live

- Do not attempt to demo POS360 or E.A.T. 360 "live" via Demo Mode — it
  is explicitly blocked. If a stakeholder wants to see those, use static
  screenshots/code walkthroughs, or a staff-login demo path outside
  investor-demo mode with clear framing that this is unverified,
  in-progress work.
- Do not claim the customer→POS360 handoff (`05-CUSTOMER-TO-POS360-HANDOFF.md`)
  is proven in a live investor context — it has real code but no proof
  coverage.
