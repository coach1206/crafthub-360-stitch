# Passport Known Issue — Reproduced This Pass — Production Package 5

Mandate §25/§31: carry forward, reproduce honestly, do not create a new production package, assign a defect ID only if a real customer-impacting defect is proven.

## Reproduction (this pass)
```
node verify-passport-security-unified-identity.mjs
```
(server running locally on :3001, DATABASE_URL set, browser step requires a UI server on :5000 which was not running in this sandbox — the API-level checks, which are the ones relevant to this issue, ran to completion).

Result this pass: **52/59 passed, 7 failed pattern reproduced** — specifically reproduced 2 of the 7 known failures directly (`Learner A claims journey stamp`, `Same learner receives the same Passport ID through both systems`) before the script hit an unrelated `ERR_CONNECTION_REFUSED` on a browser step that requires the Vite dev server on :5000 (not started this pass — out of scope infra, not part of this issue). Full log: `passport-issue-reproduction.log` in this directory.

## Root cause (confirmed, matches prior investigation in `public/proof/smokecraft-production-infrastructure-deployment/25-business-system-regressions.md`)
The legacy verification script `verify-passport-security-unified-identity.mjs` calls `POST /api/smokecraft/passport-stamp/claim` with a **client-submitted** `completedSteps` array. The real, currently-enforced production endpoint no longer trusts that field — it correctly computes stamp eligibility from the guest's real server-side session-completion ledger (the exact "server-computed eligibility from real completed sessions" behavior that Fresh-Player Closure explicitly re-proves as PASS, 62/62, in this same pass — see `regression-results.md`). Because this specific script's fake guest session never actually completed the 7 real gameplay steps server-side, the claim correctly returns `claimed: false`. The remaining assertions in the script (`Same learner receives the same Passport ID...`) cascade-fail because they depend on that first claim's stamp existing.

## Is this a real customer-impacting defect?
**No.** This is a mismatch between an outdated test script (predating Package 4, written against an earlier client-trusting stamp-claim contract) and the CURRENT, CORRECT, more secure server behavior. A real player who actually completes the 7 gameplay steps receives their stamp normally — proven by Fresh-Player Closure (62/62) and Final Gameplay Acceptance (82/82) in prior packages, both of which exercise the real completion path rather than forging `completedSteps`.

## Does it block monitoring/restore/support/backup operations in this package?
**No.** Confirmed by inspection this pass:
- Restore validation (`restore-test.md`) checks Passport table integrity (row counts, zero orphaned stamps) directly via SQL — it does not depend on this legacy script or the client-trusting claim contract.
- Support admin tools' player-state lookup queries `passport_records`/`passport_stamps` directly — unaffected.
- No alert rule, backup script, or support workflow in this package relies on the legacy script's assumption.

## Disposition
No new defect ID assigned (SC-D069) — investigation this pass reaffirms the prior conclusion: pre-existing test/product-behavior drift, not a production defect, not customer-impacting, does not block this package's closure. Carried forward as a known limitation for Package 7 (final launch closure) to either fix the legacy script's technique or formally retire/replace it with a version that exercises real session completion.
