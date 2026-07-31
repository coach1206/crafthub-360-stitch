# 08 — Completion and Progression, Including a Real Defect Found and Fixed

## Completion gate

A player must not complete Sessions 3/4/15 by opening the route, opening all panels, clicking every checkpoint without responding, clicking Next, or sending a client-claimed `completed`/`allVisited` flag — all verified live via direct denial tests (see docs 02-04, 06).

## A real, pre-existing defect found and fixed during this pass

While verifying Session 3's completion live in the browser, the evidence-submission call succeeded (`201`) but the session never actually completed server-side — no `POST .../complete` request ever fired, and `completedSessions` stayed empty. Root-caused to `src/context/GuestSessionContext.jsx`'s `awardSessionRewards(sessionId)`:

```js
const rewards = getSessionRewards(sessionId)
if (!rewards) return   // <-- hard exit, before ANY local or server update
```

`src/constants/smokecraftRewards.js` had **no entry at all** for `'meet-your-cigar'` or `'terroir'` — `getSessionRewards()` returned `null` for both, so `awardSessionRewards()` silently no-op'd for these two sessions specifically, every time, for both local state tracking and the server completion call. This means Sessions 3 and 4 could never actually complete server-side through the real completion path — **before, not because of, this pass** — a previously-promised functional interaction (session completion) proven broken.

**Fixed** by adding real reward-table entries for both sessions at the standard 75 XP used throughout the table (matching the scale of every other exploration/selection session), with no new badge invented for either (existing rules only — no badge was ever promised for these two sessions).

## Verified after the fix

- No XP on route visit, checkpoint click alone, or draft save (API tests).
- XP only after valid final completion, exactly once (API + browser).
- Correct next-step unlock (browser — real navigation to the true next route for all 3 sessions).
- Skill Tree remains synchronized (`scripts/validateSmokecraftSkillTreeAuthority.mjs` re-run clean).
- Reload preserves completion (browser).
