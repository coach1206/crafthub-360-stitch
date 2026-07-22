# Phase 6 — Shared Gamification Final Gate

**Starting commit:** `22a49db9186310e02213e13425e169f5ce599c9f` — local `HEAD` and `origin/recovery/smokecraft-codex-final` both matched, working tree clean, before any work began.

## Discovery audit (30 items)

1. `smokecraft_progression_events` (migration 085) confirmed as the only shared progression-event table via `information_schema.tables` (`LIKE '%progression_event%'` → 1 row).
2. Confirmed via migration-source grep (`grep -rln "CREATE TABLE.*progression_event"`) that no competing event table exists anywhere in the schema history.
3. `smokecraft_progression_events` carries a real UNIQUE constraint on `idempotency_key` (`pg_constraint`, `contype = 'u'`).
4. Every smokecraft_* educational route uses the shared `guest_reference` identity convention (`req.smokecraftIdentity.id` via `requireSmokeCraftIdentity`/`bridgeIdentity`), confirmed by source inspection across `challengeHubService.js`, `skillTreeService.js`, `collectionsService.js`, blend-fault and filler-arrangement routes.
5. Challenge Hub's `CHALLENGE_BOOKKEEPING_EVENT_TYPES` exclusion list (`challenge_started`, `challenge_progress_updated`, `challenge_completed`, `challenge_reward_granted`, `challenge_recalculated`) re-inspected in `challengeHubService.js` — confirmed still present and still wired into `evaluateProgress()`'s `AND NOT (event_type = ANY($4::text[]))` clause.
6. Re-verified via a live `POST /challenges/daily-lesson-practice/start` call that a fresh challenge start alone never yields `participationState: 'completed'`.
7. Confirmed a real `challenge_started` event is written to `smokecraft_progression_events` on start (proving the exclusion logic, not event absence, is what prevents self-satisfaction).
8. Skill Tree node definitions (`smokecraft_skill_tree_nodes`, migration 086) inspected: 7 active nodes, `xp_reward` column present but non-zero (10/10/15/15/15/25/20) — a discovery this pass, since prior passes' disclosures assumed zero.
9. Traced `xp_reward`'s only consumer: `skillTreeController.js` exposes it in the API payload as `xpReward`; the frontend (`SkillTree.jsx`) never renders it; no `xp_transactions` row anywhere references Skill Tree. Classified as an inactive reference, not a defect (no fake promise reaches the learner, no double-count occurs).
10. Collections item definitions: all 5 active items have `xp_value = 0` (confirmed unchanged from prior passes).
11. Challenge Hub definitions: both active definitions (1 daily, 1 weekly) have `xp_reward = 0` (confirmed unchanged).
12. `xp_award_rules` table queried for `filler_arrangement_quiz_correct` — confirmed present, `amount = 15`, the one real repeatable XP source in the SmokeCraft educational system.
13. Blend Fault: confirmed via `xp_transactions WHERE reason ILIKE '%blend fault%'` that a real passing attempt awards 0 XP transactions (zero-XP-by-design, consistent with the Blend Fault Backend Scoring pass's disclosure).
14. Passport `total_xp` mirroring re-confirmed as an absolute `SET`, not additive, by calling `POST /synchronize` twice and comparing `xpSummary.totalXp` (unchanged on the second call).
15. Passport stamp dedupe (`dedupe_key` UNIQUE constraint) re-confirmed via two syncs with unchanged `stampSummary.count`.
16. Passport activity history re-confirmed unaffected by repeated read-only syncs (same length before/after a third `/synchronize` call).
17. Skill Tree learner-state uniqueness constraint (`guest_reference`, `node_key`) confirmed present via `pg_indexes`.
18. Collections ownership uniqueness constraint confirmed present (`guest_reference`, `collection_item_key`) plus a separate `idempotency_key` UNIQUE constraint.
19. Challenge instance and challenge learner-state uniqueness constraints confirmed present.
20. Blend Fault attempt and answer uniqueness constraints confirmed present.
21. Passport profile and earned-stamp uniqueness constraints confirmed present.
22. Filler Arrangement completion idempotency re-verified via two live `POST /complete` calls for the same learner — exactly 1 row persists.
23. Traced the real cross-module evidence chain: Skill Tree's "leaf-process" node consumes `smokecraft_filler_arrangement_completion` via the `filler_arrangement_completion` evidence check in `skillTreeService.js` — confirmed by source and by a live end-to-end test.
24. Discovered (not previously documented in this form) that Skill Tree's sequential unlock walk (`recalculate()` in `skillTreeService.js`) skips a node's own evidence check entirely while its prerequisite is unmet — meaning "leaf-process" evidence (Filler Arrangement) is invisible in the API response until "foundation" (Seed & Soil evidence) is cleared first. This is correct, deliberate prerequisite gating, not a defect — documented here since it affected how this pass's own test needed to be constructed.
25. Cross-learner isolation re-verified for Skill Tree, Collections, Challenge Hub, Blend Fault, and Passport — each system's state for a second, fresh guest session is confirmed independent of the first learner's real progress.
26. Golden Box boundary: queried `smokecraft_progression_events` for any `event_type ILIKE '%golden%'` rows — none exist, confirming no Golden Box progression events have been wired into the shared table yet (correctly deferred to Phase 7/8, not built here).
27. Passport's `goldenBox.connected` field re-confirmed `false` — an honest, non-fabricated boundary marker, not a fake award.
28. Source-level fake-gamification sweep of `ChallengeHub.jsx`, `SkillTree.jsx`, `CollectionsCenter.jsx`, `BlendFaultChallenge.jsx`, `PassportProfile.jsx` for hardcoded `streak:`/`rank:`/`leaderboard: [`/XP-total literals — only the pre-existing honest disclosure sentence in `ChallengeHub.jsx:201` matches "streak"/"leaderboard" as plain text.
29. UI-level re-check: no default-selected Skill Tree node, no default-open Challenge Hub detail region, no "Rank #" text, no default-checked Blend Fault answer — all confirmed via live Playwright renders, not screenshots.
30. Confirmed no production code changes were required to close any real defect this pass — Phase 6 is a verification/reconciliation pass; the one code change made was to this pass's own dedicated test script (isolating a synthetic test event from the Challenge Hub self-satisfaction check, and sourcing real Seed & Soil evidence so the cross-learner Skill Tree check could observe genuine divergence) — not to any production file.

## Test-script correction (not a production defect)

The first draft of `verify-smokecraft-phase6-shared-gamification.mjs` produced 3 initial failures, all traced to the test script itself rather than production code:

1. **Challenge self-satisfaction false failure** — the script's own raw DB-level duplicate-insert test (for proving the `idempotency_key` UNIQUE constraint) used the same guest session as the subsequent Challenge Hub self-satisfaction check. The synthetic `phase6_test_event` row it inserted was correctly counted as real "distinct activity" evidence by `evaluateProgress()` (which counts any non-bookkeeping event type, exactly as designed), incidentally satisfying the daily challenge before the self-satisfaction check ran. Fixed by isolating the raw duplicate-insert test to its own dedicated guest session.
2. **Skill Tree `xp_reward = 0` false assumption** — the script asserted all Skill Tree nodes have `xp_reward = 0`, based on a stale extrapolation from Collections/Challenge Hub's genuinely-zeroed patterns. The real seed data (migration 086) has non-zero `xp_reward` values. Fixed by replacing the assertion with a check that this value is real display metadata, never actually granted (no `xp_transactions` reference, no frontend render) — see discovery item 9 above.
3. **Cross-learner Skill Tree false failure** — the script compared full Skill Tree JSON between two learners after only Learner A completed Filler Arrangement, expecting a visible difference. Because Skill Tree's prerequisite gating (discovery item 24) hides "leaf-process" evidence until "foundation" is cleared, the two learners' JSON was legitimately identical — correct behavior, not a cross-learner leak. Fixed by having Learner A also clear "foundation" via the real `/api/smokecraft/seed-soil/progress` endpoint first, making the resulting divergence observable and the isolation check meaningful.

No production file was modified to resolve any of the three — all three were test-construction issues, corrected in the test script only.

## Idempotency evidence

See `public/proof/smokecraft-phase-6-shared-gamification-final-gate/19-database-idempotency-evidence-table.md` for the full table (12 rows, all PASS).

## XP source reconciliation

See `public/proof/smokecraft-phase-6-shared-gamification-final-gate/21-xp-source-table.md`.

## Fake-gamification audit

See `public/proof/smokecraft-phase-6-shared-gamification-final-gate/20-fake-gamification-audit.md`. No production defects found or fixed.

## Regression battery

See `public/proof/smokecraft-phase-6-shared-gamification-final-gate/22-regression-battery-summary.md`. All suites at their exact expected totals; route smoke test at 97/98 with the same previously-disclosed non-reproducible load-noise item.

## Golden Box boundary

Confirmed and left untouched: no Golden Box progression events exist in the shared table, Passport's `goldenBox.connected` remains honestly `false`. No Phase 7/8 Golden Box completion work was performed in this pass.

## Production files changed

None. This is a verification-only pass. The only files added/modified are: this report, the dedicated Phase 6 test script (`verify-smokecraft-phase6-shared-gamification.mjs`), the master checklist, and the proof package.

## Anything intentionally deferred

- Golden Box gamification wiring (Phase 7/8) — not started, per explicit mandate scope.
- Live production deployment verification — still blocked in this sandbox (no network path to Vercel/Railway), consistent with every prior pass's disclosure.
- Skill Tree's unawarded `xp_reward` column was documented, not removed or wired to actually award XP — doing either would be new feature work outside this pass's explicit "no new XP rewards" constraint. It remains exactly as it already existed in migration 086.
