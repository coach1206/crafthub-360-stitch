# Known Limitations

1. **No fresh live click-through of all 21 sessions was performed**
   this pass — findings are based on direct source inspection (import
   statements, API calls, service usage) cross-referenced with the
   existing captured-content audit, not a new browser walkthrough.
   Source inspection is a legitimate, verifiable evidence method (grep
   results are reproducible) but is not identical to a manual UI
   walkthrough of every collapsible sub-panel.
2. **Session 25's data source (live vs. local) was not resolved** —
   flagged as `COMPLETE_BUT_UNTESTED`, deferred to a future check.
3. **3 owner product decisions remain outstanding** (Packages C, D, and
   the "correct answer" definition for Package B) — this audit
   deliberately does not guess these, per its own mandate.
4. **Accessibility/tablet behavior was not freshly re-swept** — relies
   on the existing, unrelated, already-passing responsive validator
   (no route or component changed this pass, so no regression risk).
5. **The manifest's `testReferences`/`proofReferences` fields are
   populated only for the 3 already-complete, already-tested
   interactions (pairing ×2, mentor)** — the other 18 correctly show
   empty arrays rather than fabricated references, per this manifest's
   own honesty requirement.
