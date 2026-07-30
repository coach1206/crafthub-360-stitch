# Duplicate/Concurrency Proof — Stage 5 Closure Gate

All verified live against the real running server/database, either in
this pass's own integration journey or in the still-passing regression
suites from the systems' originating passes (re-run clean this pass,
not re-authored).

| Concern | Suite / section | Result |
|---|---|---|
| XP (named source, two-tab race) | `verify-smokecraft-hf5a2-reward-authority.mjs` §3, §6 | Granted exactly once |
| Badge (direct-award dedupe) | `verify-smokecraft-hf5a2-reward-authority.mjs` §4 | Granted exactly once |
| Golden Box submission (idempotency key, two-tab race) | `verify-smokecraft-hf5c1b-golden-box-api.mjs` §3, §7 | Exactly one real row |
| Scorecard draft (rapid double-click, first-save two-tab race) | `verify-smokecraft-hf5c2a-scorecard-api.mjs` §7, §8 | Exactly one real row |
| Golden Box results finalization (duplicate call, two-tab race) | `verify-smokecraft-hf5c2b1-results-api.mjs` §8, §9 | Exactly one real finalization row |
| Golden Box award issuance (duplicate call, two-tab race) | `verify-smokecraft-hf5c2b2-awards-api.mjs` §5, §6 | Exactly one real issuance + award set |
| Repeated finalize/issue after a full journey | `verify-smokecraft-stage5-closure-integration.mjs` §4 (new) | Both return the identical original record, never recompute |
| Repeated Golden Box submit (double-click) | `verify-smokecraft-stage5-closure-integration.mjs` §1 (new) | Second attempt rejected/idempotent, never a duplicate row |

Collections and Skill Tree progress duplicate-protection was verified
structurally via their own passing validators
(`validateSmokecraftCollectionsAuthority.mjs`,
`validateSmokecraftSkillTreeAuthority.mjs`) and via the account-
conversion regression, which asserts collections/skill-tree evidence
rows transfer exactly once with no duplication
(`skillTreeEvidenceRowsTransferred`/`collectionsMergedDuplicate`
fields, verified in the closure integration journey's conversion
step). Pairing-save duplicate protection was verified structurally via
`validateSmokecraftPairingEngineAuthority.mjs`.

No duplicate result was produced in any case above.
