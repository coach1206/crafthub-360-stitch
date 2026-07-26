# Holistic Fix 2E-4 — Proof Index

Starting commit: `533ef112`

## What this proof directory covers

1. **Commerce migration** — all 5 commerce components (`SmokeCraftMenu.jsx`,
   `SmokeCraftCart.jsx`, `SmokeCraftCheckout.jsx`,
   `SmokeCraftPaymentSuccess.jsx`, `SmokeCraftOrderStatus.jsx`) migrated onto
   `SmokeCraftScreenShell` (`mode="live"`), preserving their real workflow
   (menu → cart → checkout → payment-success/order-status), loading state
   mapped to the shell's status prop where the component already had one
   (Cart), and the empty-receipt fallback in PaymentSuccess left as its own
   real actionable UI rather than replaced with the shell's generic empty
   message. Still retained as documented direct-access (orphaned — see
   `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`), per the Holistic Fix 2E-3
   decision — migrating onto the shell does not change that classification.

2. **All 108 route classifications** — see `02-route-classifications.md`.
   Built by cross-referencing the manifest's existing classification field
   with the orphan/access findings already gathered across this entire
   operation (Fix 2, 2C, 2D, 2E, 2E-3). **This is not a fresh manual
   click-through of all 108 routes this pass** — it is a systematic
   consolidation of prior findings into one table, which is disclosed here
   rather than presented as new investigation.

3. **Regression suite results** — see `01-regression-results.txt`.

## What this proof directory does NOT cover (explicit gaps, not silently omitted)

- **Manual per-session educational grading for all 27 sessions** against the
  12-criterion checklist (title, image, what-it-is, why-it-matters, flavor/
  quality/construction impact, learner application, Golden Box relevance,
  required interaction, subscreens, sequence) was **not performed** this
  pass. The `SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md` from Holistic Fix
  2E-3 remains unchanged and still discloses this as its primary open gap.
  Manually reading and grading 19 non-merged session files' full copy
  against 12 criteria each is a substantial content-review task that was not
  possible to complete with genuine care in this pass; claiming it was done
  would violate this operation's no-fabrication rule.
- **No dedicated curriculum forward/backward browser test script** was
  built as its own artifact. The existing `full-journey-sequence-and-assets`
  suite (107/107) already walks forward session-1→27 with resume/guard
  checks; no standalone session-27→1 backward walk exists.
- **No dedicated five-viewport curriculum sweep** was built. The existing
  suite's four-viewport (not five) sweep of 31 canonical screens for
  horizontal-overflow remains the most recent responsive evidence.
- **Migration queue / screen classification / interaction matrix / locked
  baseline documents were not updated** this pass — only the manifest
  (auto-regenerated) and the defect register (Fix 2E-3) reflect current
  state.
- **Alias scattered-definition removal**: no scattered `<Navigate>` alias
  was removed from `App.jsx` this pass (they remain in place, cross-checked
  against the canonical table via the build-blocking drift guard added in
  Fix 2E-3 — "consolidation" here means single-source-of-truth
  cross-referencing, not literal relocation of the route definitions).
