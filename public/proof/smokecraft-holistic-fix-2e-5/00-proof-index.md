# Holistic Fix 2E-5 — Proof Index

Starting commit: `0a17dd9a`

## What this proof directory covers

1. **Real browser content capture for the manual educational audit** — see
   `03-session-content-capture.json`, produced by
   `scripts/captureSmokecraftCurriculumContent.mjs`. Every one of the 21
   primary curriculum session routes was navigated to in a real Chromium
   browser (seeded only with the `completedSteps` a real player would
   already hold), and the actual rendered text/buttons/images were
   captured. This is the evidence base for the grading in
   `docs/smokecraft/SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md` — real
   rendered content, not source-code keywords, not filenames.

2. **Dedicated curriculum forward/backward test** —
   `verify-smokecraft-hf2e5-curriculum-forward-backward.mjs`, results in
   `04-forward-backward-results.json`. 7/7 passed: forward walk of all 27
   session slots in order (no gap/repeat/reorder, correctly accounting for
   both `mergedInto` and `sharedComponent` sessions), real clicks on
   Begin Experience/Next (S1→S2) and Previous/Back (S2→documented Landing
   destination), and a guard test confirming a future unearned session
   cannot be jumped to directly.

3. **Dedicated five-viewport curriculum sweep** —
   `verify-smokecraft-hf2e5-curriculum-five-viewport.mjs`, results in
   `05-five-viewport-results.json`. 115/115 passed: all 21 primary session
   routes at handheld-portrait (390×844), 10" tablet (810×1080), 12"
   tablet (1024×1366), 15" display (1440×900), and desktop (1920×1080) —
   zero horizontal overflow at any combination — plus keyboard-focus
   (Tab-key) verification at each viewport.

4. **Real gaps found during this pass**: documented in
   `SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md` (Golden Box relevance
   not surfaced in most sessions' rendered content, 11 of 21 slots lacking
   an on-screen lesson title, "why it matters" prose confirmed present in
   only 3 sessions) and SC-D014 in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`
   (a mid-spine screen's Continue action depends on a backend session this
   lightweight test harness doesn't establish — root-caused, not fixed).

## Real defects investigated and resolved as non-issues this pass

- Initial dedicated-test runs showed apparent forward-walk and click-based
  navigation failures. Both were investigated to a concrete conclusion via
  source read and confirmed to be **test-expectation bugs in the new test
  script**, not product defects: (1) Session 26 sharing Session 25's
  `sharedComponent` correctly reports session marker 25, and (2) Session
  2's Back control correctly, intentionally returns to the SmokeCraft
  Landing rather than replaying Session 1. Both were fixed in the test
  script, not worked around.

## What this proof directory does NOT cover (explicit gaps, not silently omitted)

- **Not every criterion for every session was gradeable from top-level
  rendered content alone.** Sessions 3, 4, 6, 15 (and others) have
  collapsible sections/tabs whose content only renders after a click the
  capture script did not perform for every sub-panel — those cells are
  marked INCONCLUSIVE in the audit doc, not guessed at.
- **No educational content gaps were fixed this pass** — see the audit
  doc's "Gaps fixed this pass: None" section for the explicit reasoning
  (fixing them responsibly requires real content decisions beyond what
  this pass's remaining time allowed).
- **Full click-test of every quiz/slider/mentor/tasting/upload control
  within all 27 sessions** was not performed — the dedicated test covers
  route-level forward/backward/guard behavior, not every in-session
  control.
