# Backend Ownership Map

| Interaction | Canonical API | Canonical service | Persistence | Client-claimable? |
|---|---|---|---|---|
| Generic session completion (all 21) | `POST /api/smokecraft/player-state/sessions/:sessionId/complete` | `playerStateService.js#completeSession` | `smokecraft_session_completions` | No — XP looked up server-side by `sessionId`; idempotent on retry (`UNIQUE_VIOLATION` returns original row, never duplicates) |
| Pairing (Sessions 11, 22) | `server/routes/pairingEngineRoutes.js` | `pairingEngineService.js` | `smokecraft_pairing_saves` / `smokecraft_pairing_save_revisions` | No — real server scoring/explanation |
| Mentor guidance (Session 14) | `server/routes/mentorGuidanceRoutes.js` | mentor guidance service (HF5B-2) | guidance/activity-derived state | No — real, activity-derived, honest fallback |
| Passport stamp status (Session 23) | GET status endpoint only | passport-stamp status service | claim record (gated on S24) | Read-only; no client-claimable submission found |
| First/Second/Final Third tasting (8, 12, 16) | none dedicated | `GuestSessionContext.jsx` local reducer only | localStorage-backed context state only | N/A — never reaches the server at all for the tasting data itself (only the generic completion call does) |
| Scorecard rating (19) | none dedicated | `GuestSessionContext.jsx` local reducer only | local state only | Same as above |
| Selection/exploration sessions (2, 3, 4, 5, 6, 10, 15) | none dedicated | `GuestSessionContext.jsx` local reducer only | local state only | Same as above |

## Flags

- **Frontend-only scoring/claimed-completion**: not found for the
  completion mechanism itself (server-owned everywhere) — but the
  *interaction content* for 12 of 21 sessions never reaches any server
  endpoint, so there is nothing for the server to validate even if it
  wanted to.
- **localStorage-only authority**: confirmed for the 12 PARTIAL/
  VISUAL_ONLY sessions' interaction data specifically (not for
  completion/XP, which remains server-authoritative) — this matches
  the app's own pre-existing "approved non-authoritative cache" pattern
  used elsewhere (e.g. `GuestSessionContext` generally), so it is not a
  new architectural violation, but it does mean these 12 sessions'
  actual player answers are never verified.
  A real, already-built alternative exists and is unused by 3 of these
  sessions specifically: `saveTastingDraft`/`submitTastingCompletion`
  (server-authoritative tasting-draft persistence, already used by
  `MiniTasting.jsx` elsewhere in the app) is available but not called
  by `FirstThird.jsx`/`SecondThird.jsx`/`FinalThird.jsx`.
- **Duplicate service ownership**: none found — no session's
  interaction data is written to two different competing stores.
- **Missing authorization**: none found — every real endpoint (pairing,
  mentor guidance, session completion) is properly guest-identity-scoped.
- **Missing idempotency**: none found in the paths that exist — the
  question for the 12 partial/visual-only sessions is that no
  server-side idempotency question even arises, since no server
  submission exists to protect.
