# Package F — Fix and Verification Summary

Covers: Session 25 interaction proof, pre-completion locked-reward proof, invalid-attempt proof,
server-completion proof, XP/progression proof, reward exactly-once proof, concurrency proof,
cross-player denial, localStorage spoof rejection, reload persistence.

## The fix

`src/pages/smokecraft/Rewards.jsx`:
- Imports the existing, already-proven `fetchPlayerState()` client (`src/services/smokecraft/playerStateApiClient.js`) — the same client already used by the leaderboard. No second fetch path invented.
- On mount (and on Retry), fetches `GET /api/smokecraft/player-state` and stores `{ xpTotal, rankLabel }` in `serverXpState`.
- `totalXP` (feeding the displayed "available"/"earned"/"lifetime" XP boxes, current rank, progress bar, and every rank-milestone Claim button's locked/available logic) is now `usingServerXp ? serverXpState.xpTotal : (session?.xp || 0)` — server value used whenever reachable; local value used only as an explicit, never-mislabeled fallback when offline/unreachable.
- A hidden `data-testid="s25-xp-source"` marker exposes `'server'` vs `'local-fallback'` for verification.
- After a real Claim/Continue action (`awardSessionRewards()`), `refreshServerXp()` re-fetches the canonical total shortly after so the display doesn't go stale post-award.
- No change to the completion/XP-award write path, badge logic, or achievement-criteria computation — all reused unmodified.

## Live verification (20-step mandate list) — results

All 20 scenarios were exercised via the two new test suites (43 total assertions, 0 failures):

| # | Scenario | Suite | Result |
|---|---|---|---|
| 1 | Authorized access | API #1 | PASS |
| 2 | Unauthorized denial | API #2 | PASS |
| 3 | Cross-player denial | API #13, browser (isolated seeded contexts) | PASS |
| 4 | Real interaction submission | Browser (real click on Continue) | PASS |
| 5 | Invalid/incomplete interaction | API #5, Browser (missing idempotency key) | PASS |
| 6 | Completion gating | API #7 | PASS |
| 7 | Reward not awarded early | API #4, Browser (locked tier before award) | PASS |
| 8 | Reward awarded after valid completion | API #7, Browser | PASS |
| 9 | Reward exactly once | API #8, #10 | PASS |
| 10 | XP exactly once | API #7–#9 | PASS |
| 11 | Progression exactly once | API #9 (S25+S26 = exactly 100 XP) | PASS |
| 12 | Duplicate submission | API #8, Browser | PASS |
| 13 | Concurrent submission | API #10 (3 concurrent, 1 wins) | PASS |
| 14 | Reload persistence | API #11, Browser (real page reload) | PASS |
| 15 | Already-completed behavior | API #12 | PASS |
| 16 | Direct API bypass attempt | API #6 | PASS |
| 17 | localStorage spoof rejection | API #14 | PASS |
| 18 | Audit event creation | API #15 (structural) | PASS |
| 19 | Route/instructions/keyboard/viewport | Browser | PASS |
| 20 | Offline / session-expired | Browser | PASS |

Full detail: `api-results.json`, `browser-results.json`.
