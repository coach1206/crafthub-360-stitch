# 08 — Known Limitations

Documented honestly, not silently omitted.

1. **Badge ledger not directly asserted.** `SESSION_REWARDS` declares
   badge ids tied to certain session completions (Holistic Fix 5A), but
   `GET /api/smokecraft/player-state` in this build does not expose a
   `badges` array distinct from `completedSessions` for this reconciliation
   to check against. The fresh-player script detects this honestly at
   runtime and skips the assertion with a logged explanation rather than
   fabricating a pass. If a `badges` field is added to that endpoint in a
   future pass, this script's existing (but currently inert) badge-check
   code will start asserting automatically — no rewrite needed.

2. **UI smoke pass is representative, not exhaustive.** Per the mandate's
   explicit pragmatic scope, the UI smoke pass drives one full real-UI
   session (Session 1, Entry) plus fresh-load/lock/reload checks — it does
   not click through all 27 sessions in 5 viewports. Full per-session UI
   coverage for the required-interaction sessions already exists in each
   Package A-F's own `*-browser.mjs` suite (110 real-browser checks
   combined, not re-run in this pass per the regression scoping note in
   `07-regression-results.md`, but not superseded either).

3. **Golden Box judging requires a real staff/admin role.** This is
   expected, not a gap: a player cannot judge their own competition entry
   (`judge_self_assignment_prohibited`, a real server rule re-confirmed in
   this pass), so the judge/finalize/award steps necessarily use the same
   fixture admin/judge accounts (`admin@novee.dev`, `manager@novee.dev`)
   every prior Golden Box test package already uses. This does not weaken
   the proof that the *player's* side of Golden Box (build → submit) is
   fully player-driven through the real API — only the judging role, which
   is by design not a player role, uses a staff account.

4. **7-phase vs. 6-phase discrepancy.** The task mandate says "7 phases";
   the one real, canonical `VISIT_STRUCTURE` registry has always been (and
   remains) 6 phases. This was flagged, not silently reconciled — see
   `01-canonical-27-session-map.md`.

5. **One pre-existing, unrelated build-time esbuild warning** ("Duplicate
   key 'border' in object literal") was observed during `npm run build`.
   It is a lint-level warning (not a build failure), predates this pass,
   and is outside this pass's "small, targeted fixes only" scope — noted
   here rather than silently fixed or silently ignored.
