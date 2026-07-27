# Holistic Fix 2E-11 — Proof Index

Starting commit: `3c372a37`

## What this proof directory covers

**Complete control taxonomy and Stage 2 closure.** All 276 curriculum
controls discovered live from the rendered DOM in Holistic Fix 2E-9 are
mapped to exactly one of 7 source-derived implementation groups, and a
new build-blocking coverage validator locks that mapping's completeness.

- `01-control-inventory-and-groups.json` — the full 276-control inventory
  (session, route, tag/type, label, group) plus the `groupInfo` contract
  definitions (persistence/navigation/duplicate-risk/disabled-state
  requirements and test references) and `byGroupCounts` used to generate
  `docs/smokecraft/SMOKECRAFT_CONTROL_IMPLEMENTATION_MAP.md`.
- `02-deep-behavioral-test-results.json` — the deep browser-verification
  results for 6 of the 7 implementation groups (selection-toggle,
  rating-toggle, tab-disclosure, completion, honest-disabled, and the
  new tasting-input group added this pass), from
  `verify-smokecraft-hf2e10-control-state-persistence.mjs`, 10/10
  passing. The 7th group, navigation, is covered by the pre-existing
  `verify-smokecraft-hf2e5-curriculum-forward-backward.mjs` and
  `verify-smokecraft-full-journey-sequence-and-assets.mjs` suites — its
  behavior contract IS the forward/backward walk those already run.
- `03-coverage-validator-output.txt` — full output of the new
  `scripts/validateSmokecraftControlCoverage.mjs`, PASS with 0 failed
  checks: confirms all 276 controls mapped, group counts match the raw
  discovery data, every group has an existing test-script reference,
  every persistence/navigation/duplicate-risk/disabled requirement has a
  matching test reference, and all 22 primary curriculum sessions with
  discovered controls have coverage.

## Coverage summary

- **Total controls discovered**: 276 (Holistic Fix 2E-9, unchanged).
- **Total controls mapped**: 276. **Unmapped: 0.**
- **Implementation groups**: 7 (navigation 55, selection-toggle 94,
  rating-toggle 67, tab-disclosure 23, tasting-input 12, completion 23,
  honest-disabled 2).
- **Groups browser-tested**: 7 of 7 (6 directly via the deep-behavioral
  script, 1 via the forward/backward + full-journey suites).
- **Sessions with confirmed control coverage**: all 22 primary curriculum
  session slots present in the 2E-9 discovery data.
- **Product defects found and fixed this pass**: 0. Two suspected
  failures during test extension (Terroir `role="tab"` selector, and a
  non-simultaneous double-click test methodology issue) were both
  root-caused to test-harness mistakes, not product bugs — documented in
  `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Holistic Fix 2E-11 section.
- **Engine-level idempotency**: the verified duplicate-fire guard is
  client-side only (`if (done) return`); server-side idempotency for
  XP/badges/Passport stamps is explicitly out of scope for Stage 2 and
  handed off to Holistic Fix 4 / the gameplay-engine package.

## What this proof directory does NOT cover

- 276 individually hand-authored end-to-end tests (explicitly excluded
  by the mandate — redundant given shared implementations).
- Per-control keyboard/pointer/touch/loading-error verification beyond
  what Holistic Fix 2E-9's broad sweep already performed (occlusion
  hit-test + one keyboard-focus check per session across all 276) and
  what the 2E-10/2E-11 deep-behavioral script performs for its 6 directly
  tested groups.
- New route migrations or educational-content changes (out of scope for
  this pass — Stage 2 acceptance per the mandate is control architecture,
  mapping, interaction behavior, and regression coverage, not migration
  count or gameplay-engine idempotency).
