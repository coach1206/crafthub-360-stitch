# Executive Summary — Required-Interaction Manifest and 21-Session Audit

Starting commit: `487fd60c` (verified clean baseline).

This pass built the first canonical, repository-backed
`REQUIRED_INTERACTIONS` manifest (`src/constants/smokecraftRequiredInteractions.js`)
defining what interaction each of SmokeCraft's 21 primary curriculum
sessions is required to contain, then audited every session's real
implementation against that definition via direct source inspection —
not a keyword scan, not a guess.

**Headline finding**: the prior premise that "18 of 21 are complete and
exactly 3 are missing" does not hold. The real, verified state is:

- **8 of 21 sessions COMPLETE_AND_VERIFIED** (1, 7, 11, 14, 21, 22, 24, 27)
- **1 of 21 COMPLETE_BUT_UNTESTED** (25)
- **8 of 21 PARTIAL** (3, 4, 8, 12, 15, 16, 19, 23)
- **4 of 21 VISUAL_ONLY** (2, 5, 6, 10)
- **0 MISSING, 0 WRONG_INTERACTION_TYPE, 0 BLOCKED, 0 DUPLICATED**

The architectural root cause is uniform across all 13 non-complete
sessions: every session completes through one real, server-authoritative,
idempotent, XP-safe completion mechanism (`completeSession()`) — but
that shared endpoint accepts only a session ID, never the player's
actual interaction answer, so 12 sessions' real captured player input
(selections, ratings, flavor-wheel taps) is never evaluated or
persisted server-side, and 1 session's data source was not independently
confirmed.

No session is entirely missing an interaction, using the wrong
interaction type, blocked, or duplicated — this is not a "some content
doesn't exist" problem, it is a "some real content isn't wired to
server evaluation" problem, uniformly shaped and grouped into 6 small
implementation packages (see `12-implementation-package-plan.md`),
3 of which require an owner product decision before implementation can
safely begin.

No new SC-D defect was assigned — this is newly-defined scope, not a
confirmed pre-existing broken promise (see `13-defect-classification.md`).

Recommended next package: **Package A — Tasting-Capture Server
Authority** (Sessions 8, 12, 16) — reuses fully existing backend
architecture, no owner decision required, lowest regression risk,
reduces the open-gap count from 12 to 9.
