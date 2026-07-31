# Required-Interaction Definition (Canonical, This Pass)

A **required interaction** is a meaningful player action — assessment,
classification, placement, matching, ordering, hotspot identification,
construction inspection, flavor/pairing decision, or mentor-guided
response — whose **outcome is evaluated server-side**, and whose
correctness/completeness is verified before session completion and XP
are granted.

## Does NOT qualify by itself

Reading text, watching media, opening a modal, clicking Next/Complete,
viewing an image, viewing mentor text, navigating to another route, a
frontend-only toggle, a decorative control, or a static diagram without
player input — even if real player input is captured into local
component/context state, if that input is never submitted to a server
endpoint that evaluates it.

## Key architectural finding this definition is built on

Verified by direct source read (not assumed): every one of the 21
primary sessions completes through ONE shared, real,
idempotent, server-authoritative mechanism —
`awardSessionRewards()` (client, `GuestSessionContext.jsx`) →
`completeSessionOnServer()` (client API, `playerStateApiClient.js`) →
`handleCompleteSession()` (server controller) →
`completeSession()` (server service, `playerStateService.js`) →
`smokecraft_session_completions` (DB, unique per guest+session).

`handleCompleteSession()` looks up the XP award server-side from
`sessionRewardTable.js` by `sessionId` alone — **the client cannot
spoof or dictate XP amount**, and duplicate calls are idempotent
(confirmed in the source: a `UNIQUE_VIOLATION` on retry returns the
original completion, never a second one). This means XP-safety and
completion-idempotency hold universally across all 21 sessions.

However, this same shared endpoint's request body carries **only
`sessionId`** — it has no field for, and therefore cannot evaluate, the
player's actual interaction answer or selection. So while "you cannot
fake how much XP you get" is true everywhere, "your answer must be
correct to complete" is only true for sessions that ALSO call a
second, dedicated, answer-evaluating endpoint before the generic
completion call fires.

Only 3 sessions do that today (11, 14, 22 — verified by source
inspection of each session component's own imports and API calls, not
by keyword-matching rendered text as the prior audit pass did). The
prior audit's "3 of 21 confirmed via keyword scan" number and this
pass's "3 of 21 have a real, dedicated, evaluated interaction"
finding happen to agree in count, but were derived by two independent
and different methods (rendered-text keyword matching vs. source-level
API-call inspection) — this pass's finding should be treated as the
more architecturally precise of the two, since it traces the actual
request/response path rather than searching for the word "quiz" in
rendered text.
