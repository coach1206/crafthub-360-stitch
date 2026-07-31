# 02 — Session 19 (Scorecard) Report

- Route: `/smokecraft/scorecard` → `src/pages/smokecraft/Scorecard.jsx`
- Categories (unchanged from the existing real UI, not invented): `appearance`, `construction`, `draw`, `burn`, `flavor`, `pairing`, each rated 1-5.
- Optional fields: `personalNotes` (string, ≤2000 chars), `meta` (`durationMinutes`, `puffCount`, `relightCount`, each range-validated).

## New server architecture

- `server/services/smokecraft/scorecardEvaluationService.js` — `submitScorecardCompletion()` requires **all 6** categories present and each an integer 1-5 (a complete review, per the session's own learning objective — deliberately stricter than Package A's "at least one" rule for exploratory tasting notes, since this session's role is a *complete* assessment). Computes the weighted overall score server-side (same weights the old in-memory route already used: flavor 30%, draw 20%, burn 15%, construction 15%, appearance 10%, pairing 10% — reused, not reinvented). Writes evidence to `smokecraft_activity_attempts` (`activity_type='scorecard'`, `activity_key='scorecard'`), `xp_awarded=0`.
- `hasScorecardEvidence()` — gates `completeSession()` for `sessionId==='scorecard'` only.
- `validateScorecardDraftPayload()` — narrow field/vocabulary validation for the shared draft table, scoped only to `activityKey==='scorecard'`.

## Endpoints

- `POST /api/smokecraft/player-state/scorecard/submit` (new, `requireSmokeCraftIdentity`-protected) — real evidence submission.
- `GET/PUT /api/smokecraft/player-state/tasting/scorecard/draft` (existing generic routes, reused with `activityKey='scorecard'`).
- `POST /api/smokecraft/player-state/sessions/scorecard/complete` (existing generic route, now gated).

## Client

`Scorecard.jsx` rewritten to load its draft from the server on mount (honest loading/error phases), autosave/manually save via the server draft route, validate all 6 categories client-side before attempting submission, submit real evidence via `submitScorecard()` (new `GuestSessionContext` callback) **before** either completion path runs (the same ordering fix Package A required), and no longer calls the old unauthenticated in-memory route at all.
