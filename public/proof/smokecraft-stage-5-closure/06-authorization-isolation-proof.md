# Authorization/Isolation Proof — Stage 5 Closure Gate

All verified live against the real running server/database.

- **Cross-user denial**: a stranger judge cannot save/submit a
  scorecard for an entry they aren't assigned to (`judge_not_assigned`,
  403) — `verify-smokecraft-hf5c2a-scorecard-api.mjs` §9. A stranger
  cannot finalize results or issue awards (403) —
  `verify-smokecraft-hf5c2b1-results-api.mjs` §10,
  `verify-smokecraft-hf5c2b2-awards-api.mjs` §2.
- **Guest/account ownership**: `identityFrom()`'s `ownsAsUser`/
  `ownsAsGuest` checks in `visibilityService.js` require an exact
  identity match — verified live this pass (SC-D063 fix) that the
  legitimate owner (post-conversion) IS granted `'entrant'` visibility,
  and every existing cross-user-denial assertion across every Golden
  Box suite still passes after the fix (the fix restores legitimate
  access, it does not loosen denial for anyone else).
- **Guest-to-account continuity**: verified live this pass — a real
  guest builds a draft, converts to a real account mid-flow, and the
  transferred entry (new `entry_id`, real remapped child rows) is
  reachable and scoreable/finalizable/awardable under the account
  identity through to a real issued award (`verify-smokecraft-stage5-closure-integration.mjs`
  §1).
- **Venue isolation**: a venue-scoped competition's finalized ranking
  and issued awards contain only that venue's own entry, never another
  venue's — `verify-smokecraft-hf5c2b1-results-api.mjs` §12,
  `verify-smokecraft-hf5c2b2-awards-api.mjs` §8.
- **Competition isolation**: two separate global competitions never
  mix rankings or awards — `verify-smokecraft-hf5c2b1-results-api.mjs`
  §13, `verify-smokecraft-hf5c2b2-awards-api.mjs` §8.
- **Judge role enforcement**: only an authorized admin can assign a
  judge; self-assignment and venue-outside assignment are rejected —
  `verify-smokecraft-hf5c2a-judge-assignment-api.mjs` (11/11).
- **Admin-only finalization/issuance**: both `results/finalize` and
  `awards/issue` require `requireRole('admin')`, verified live with
  real 403 denials.
- **Staff-only corrections**: the existing reward-correction endpoint
  remains staff-only (`verify-smokecraft-hf5a2-reward-authority.mjs`
  §5 — a plain guest identity attempting a correction is rejected 403).
- **No client-controlled reward authority**: SC-D062 permanently
  closed (see `01-sc-d062-closure-proof.md`); the real award path
  ignores any client-submitted placement/score/rank
  (`verify-smokecraft-hf5c2b2-awards-api.mjs` — fabricated
  `{ranked:[...], placement:99}` in a finalize/issue request body is
  completely ignored).
