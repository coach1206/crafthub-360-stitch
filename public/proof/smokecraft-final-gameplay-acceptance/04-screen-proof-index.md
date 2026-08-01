# 04 — Screen Proof Index

Disclosed scope reduction (per mandate section 3): full desktop + tablet
+ mobile sweep on 4 key screens (Welcome, Scorecard, Rewards, Golden Box
Build), desktop-only on the remaining 10 representative screens, plus 2
extra desktop-only proof screens (live-data-honesty check, post-reload
check). This is 24 real screenshots, not the full 5-viewport x 27-screen
matrix (135 combinations), which the mandate explicitly names as
infeasible for this pass.

Viewports used: **desktop** 1440x900, **tablet** 834x1194 (iPad-portrait
class), **mobile** 390x844 (iPhone-class).

| Screen | Route | Desktop | Tablet | Mobile |
|---|---|---|---|---|
| Welcome | `/smokecraft/welcome` | `screenshots/desktop/01-welcome.png` | `screenshots/tablet/01-welcome.png` | `screenshots/mobile/01-welcome.png` |
| Venue Select | `/smokecraft/venue-select` | `screenshots/desktop/02-venue-select.png` | — | — |
| Mentor Selection | `/smokecraft/mentor-selection` | `screenshots/desktop/03-mentor-selection.png` | — | — |
| Humidor Match (selection) | `/smokecraft/humidor-match` | `screenshots/desktop/04-humidor-match.png` | — | — |
| First Draw (tasting) | `/smokecraft/first-third` | `screenshots/desktop/05-first-third.png` | — | — |
| Scorecard (rating) | `/smokecraft/scorecard` | `screenshots/desktop/06-scorecard.png` | `screenshots/tablet/06-scorecard.png` | `screenshots/mobile/06-scorecard.png` |
| Rewards | `/smokecraft/rewards` | `screenshots/desktop/07-rewards.png` | `screenshots/tablet/07-rewards.png` | `screenshots/mobile/07-rewards.png` |
| Passport | `/smokecraft/passport` | `screenshots/desktop/08-passport.png` | — | — |
| Skill Tree | `/smokecraft/skill-tree` | `screenshots/desktop/09-skill-tree.png` | — | — |
| Leaderboard | `/smokecraft/leaderboard` | `screenshots/desktop/10-leaderboard.png` | — | — |
| Golden Box — Build | `/smokecraft/golden-box` | `screenshots/desktop/11-golden-box-build.png` | `screenshots/tablet/11-golden-box-build.png` | `screenshots/mobile/11-golden-box-build.png` |
| Golden Box — Competitions | `/smokecraft/golden-box/competitions` | `screenshots/desktop/12-golden-box-competitions.png` | — | — |
| Golden Box — Results/Award | `/smokecraft/golden-box/results/:id` | `screenshots/desktop/13-golden-box-results.png` | — | — |
| Session Complete (final state) | `/smokecraft/session-complete` | `screenshots/desktop/14-session-complete.png` | — | — |
| (extra) Live-data-honesty check | `/smokecraft/rewards` | `screenshots/desktop/15-rewards-live-data-check.png` | — | — |
| (extra) Post-reload persistence check | `/smokecraft/session-complete` | `screenshots/desktop/16-session-complete-after-reload.png` | — | — |

All 24 screenshots are real Playwright captures against a real production
build (`vite preview`) and a real backend, using one real, fully-completed
demo-player identity (see `05-live-data-honesty.md`) and a real, finalized
Golden Box competition with a real first-place award. No screenshot was
staged, retouched, or hand-assembled.

Each screen was asserted (via `scripts/verify-smokecraft-final-gameplay-acceptance.mjs`)
to render with zero real console errors, zero failed critical network
requests, and at least one enabled/clickable primary control. Final run:
**82/82 assertions passed** (see `09-regression-results.md`).
