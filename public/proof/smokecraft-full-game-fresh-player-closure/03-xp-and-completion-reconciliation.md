# 03 — XP and Completion Reconciliation

## Method

Rather than hand-transcribing expected XP values (error-prone and a second,
competing source of truth), the fresh-player script **dynamically imports
the exact same reward data the server itself consults**:
`SESSION_REWARDS` from `src/constants/smokecraftRewards.js`, which is the
one file `server/services/smokecraft/sessionRewardTable.js#getSessionRewardXp`
reads at completion time (`entry.xp`). The client-side test computes:

```
expectedXp = sum over the 22 distinct completed session ids of SESSION_REWARDS[id].xp
```

and then asserts the server's own `GET /api/smokecraft/player-state`
response reports exactly that total — not a value the test invented.

## Result (this run)

| Metric | Value |
|---|---|
| Distinct session ids completed | 22 / 22 |
| Expected XP (server-owned reward table) | **1175** |
| Server-reported `xpTotal` after the run | **1175** |
| Match | **Exact** |
| Duplicate completion rows for any session id | **0** (checked explicitly) |
| Passport-360 journey-completion stamp claimed | **Yes** (`status/anything` confirms) |

## Why this is a real reconciliation, not a tautology

The server never trusts a client-submitted XP amount for session completion
— this was independently re-verified in this same run: the generic
completion endpoint accepts only `idempotencyKey` in its body; any
`xpAwarded`/`rewardEarned`/`completed` fields sent by prior test packages
(Package F, Package D, Package E) were proven ignored. So the 1175 total
was computed exclusively server-side, from the server's own lookup table,
per session, and persisted to `smokecraft_session_completions` — the same
lookup this document's `expectedXp` computation independently re-derives
from the same source file. Two independent computations (server's live
lookup at completion time vs. this document's post-hoc sum) agreeing
exactly is the actual reconciliation.

## Badges

`SESSION_REWARDS` declares badge ids 1:1 with certain session completions
(Holistic Fix 5A). The fresh-player script checked for a `badges` array on
the player-state response; this build's player-state payload does not
currently surface a `badges` field distinct from `completedSessions` (badge
awarding happens in the same atomic transaction as completion, per the
source comments in `sessionRewardTable.js`, but is not separately exposed
by this endpoint in a `badges` array). The script honestly skipped that
assertion rather than fabricating a pass — see `08-known-limitations.md`.
