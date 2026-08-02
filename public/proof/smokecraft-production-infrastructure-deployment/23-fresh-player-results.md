# 23 — Fresh-Player Closure Re-Run Against Infrastructure Baseline

Script: `scripts/verify-smokecraft-full-game-fresh-player.mjs`
Target: real running server on `localhost:3001` (dev-mode, real Postgres
`crafthub_smokecraft_final`), commit `9edbc6c7`.
Identity: fresh, isolated guest — auto-issued by the real API, no manual DB
row insert, no localStorage seed, no header/cookie forgery.

## Result

**62 passed, 0 failed (of 62 total).** Identical to the pre-Package-4
baseline recorded in
`public/proof/smokecraft-full-game-fresh-player-closure/02-fresh-player-run-results.md`.
Every section re-verified real against the current infrastructure baseline:

1. Identity bootstrap — fresh guest starts at 0 XP / 0 completions.
2. All 27 sessions / 22 distinct completion ids walked in canonical route
   order with real evidence submission at every evidence-gated session.
3. Server ledger reconciliation — all 22 sessions present exactly once, no
   duplicates, XP total (1175) matches the server-owned reward table.
4. Golden Box full lifecycle — build, submit, judge, finalize, award, all
   real API calls.
5. Cross-player isolation — a second fresh guest still shows 0 XP / 0
   completions.

No regression from Production Package 4's infrastructure changes
(Dockerfile, CI/CD, env contract, startup validation, health endpoints,
Sharp image-resize pipeline, storage adapter, background jobs, build
exclusion, security/config hardening) — none of that touched the
gameplay/session-completion/evidence-gate/Golden Box code paths this suite
exercises, and the real run confirms it.
