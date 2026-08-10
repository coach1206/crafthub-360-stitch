# SmokeCraft Owner Visual Acceptance Gate

Status: **NOT READY FOR OWNER ACCEPTANCE**

Branch: `recovery/smokecraft-codex-final`

Current migration commit reviewed: `9c662c67205c65b75751695c77d345a3cc3f4a38`

## Why this gate exists

The two-generation migration has build/static verification, but the migration ledger and commit notes still explicitly state that browser click-through verification is pending. Owner acceptance requires visual proof of what actually renders, not only code diffs, grep results, or build success.

## Mandatory proof before owner acceptance

The migration may not be reported as "READY FOR OWNER VISUAL INSPECTION", "COMPLETE", "ACCEPTED", or equivalent until all items below exist from the same verified HEAD.

1. Real browser run through the canonical SmokeCraft journey.
2. Fresh browser screenshots of every converted migration screen.
3. At minimum one screenshot per converted screen at the approved primary tablet viewport.
4. Responsive proof for supported 10-inch, 12-inch, and 15-inch tablet targets on the converted screen set, either per-screen screenshots or a documented representative matrix with exceptions separately captured.
5. Interaction proof for required gated screens, especially Final Third flavor selection and Scorecard six-category ratings.
6. Back/Continue navigation verified in-browser.
7. No horizontal overflow, hidden primary controls, overlapping fixed panels, missing assets, or baked fake controls.
8. Fresh contact sheets named `SMOKECRAFT_ONE_SYSTEM_FINAL_01.png` onward plus `SMOKECRAFT_ONE_SYSTEM_FINAL_INDEX.png`.
9. Contact sheets must show the actual browser-rendered application, not reference artwork, mockups, or generated design concepts.
10. Each screenshot/contact-sheet entry must record route, screen name, viewport, and captured commit SHA.
11. Migration ledger must be updated from `FUNCTIONAL / browser pending` to `VERIFIED` only after the corresponding browser proof passes.
12. Any visual defect discovered during capture must be fixed, rebuilt, recaptured, and only then included in the final proof set.

## Converted screens requiring proof

- Identity
- Seed & Soil
- Format
- Cut / Toast / Light
- First Third
- Second Third
- Final Third
- Scorecard
- Request / Purchase
- Pairing Recommendations
- Passport Stamp
- Connections
- Rewards
- Second Humidor Match

## Owner acceptance rule

**No screenshot = no acceptance.**

A clean build proves structural validity. It does not prove visual quality, responsive behavior, or correct browser interaction. The owner must receive fresh visual evidence before approving this migration.
