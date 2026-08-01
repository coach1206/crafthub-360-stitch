# 05 — Live-Data Honesty (UI vs. Server Agreement)

## Method

A single demo-player guest identity was built via real HTTP calls to the
same server-authoritative endpoints every prior proof package uses:
22/22 required sessions completed (real selection/tasting/scorecard
evidence submitted and server-graded where required), plus a real, full
Golden Box lifecycle (build → submit → judge → finalize → award, real
distinct judge/admin fixture accounts, real first-place award).

The guest's real, server-issued identity cookie
(`smokecraft_guest_session`, an httpOnly JWT) was then shared with a real
Playwright browser session (via Playwright's `storageState`, the standard
mechanism for propagating a real cookie between browser contexts — not a
localStorage/session hack; sessionStorage's own demo-mode toggle, which
Playwright's `storageState()` does not capture, was separately replayed
via `addInitScript` after being set once for real by an actual UI click
on the app's own sanctioned Demo Mode control — see `02-investor-demo-path.md`).

## Result

On the Rewards screen (`/smokecraft/rewards`):

- Same-session `GET /api/smokecraft/player-state` (called from *inside*
  the same browser page, same cookie) returned `xpTotal: 1175`.
- The rendered page body contains `1175` (twice — in the XP summary tiles
  visible in `screenshots/desktop/07-rewards.png` and
  `screenshots/desktop/15-rewards-live-data-check.png`).
- This confirms Rewards.jsx's `fetchPlayerState()` call (Required-
  Interaction Closure Package F) is genuinely reading and displaying the
  canonical server ledger, not a stale local cache, for this demo player.

On the Golden Box Results screen
(`/smokecraft/golden-box/results/:competitionId`), after the SC-D068 fix
(see `03-visual-acceptance-review.md`): the UI's "released" banner and its
"Official, finalized rankings" section now agree with each other and with
the real server-side `golden_box_results`/`golden_box_awards` state — a
real first-place award for a single real entrant, `90.00` score.

## Post-reload persistence

After a hard page reload on `/smokecraft/session-complete`, a same-session
`GET /api/smokecraft/player-state` call still returned all 22 completed
sessions — confirming completion state is server-persisted, not held only
in React/client memory. Screenshot:
`screenshots/desktop/16-session-complete-after-reload.png`.

## Known, disclosed exception (not a defect in this pass)

Session 25's own itemized XP-breakdown rows (Completed-Session XP,
Passport XP, Pairing XP, Mentor XP — visible as `0 XP` each in
`screenshots/desktop/07-rewards.png`) do not independently sum to the
correct, real, server-verified total (`1175`) shown just above them. This
is the same pre-existing, already-documented gap carried forward from the
Full Game Fresh-Player Closure package (see `10-known-limitations.md`) —
the headline total is correct and server-sourced; only the itemized
breakdown computation (a local, non-authoritative display convenience)
is stale/unconfigured for this reward set.
