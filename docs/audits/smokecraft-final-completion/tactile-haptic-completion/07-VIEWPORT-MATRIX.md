# 07 — Viewport Matrix

## Scope decision (disclosed)

A literal 5-viewport (handheld / 10" tablet / 12" tablet / 15" tablet / desktop) × 27-session × full-interaction Playwright matrix was not run this pass — the time budget for a from-scratch pass covering deployment infrastructure, a full interaction audit, and a new shared component did not extend to that scale of device-matrix testing.

## What was verified

- `SmokeCraftTactileCard`'s touch-target sizing (`minWidth: 72, minHeight: 72`) is set via fixed pixel values, not viewport-relative units — meaning its minimum size is guaranteed identical across every viewport (a 72px target on a phone is still a 72px target on a 15" tablet), which is the correct, simpler property for touch-target-size compliance specifically (unlike font size or layout, which do need to scale).
- The existing per-session screens (Terroir, MeetYourCigar, etc.) already use `clamp()`-based responsive sizing for their real interactive controls (confirmed by source read, unchanged by this pass) — re-verified functioning at the one viewport this pass's live browser checks used (1440×900 desktop).
- No new component or change in this pass introduces a fixed-pixel layout that would break on a narrower viewport (`SmokeCraftTactileCard` uses flexible `padding`/`gap`, no hardcoded widths beyond the touch-target minimum).

## Recommendation

A dedicated follow-up pass should run the full 5-viewport × entry-flow + 27-session Playwright sweep this mandate specifies, now that `SmokeCraftTactileCard` exists as a documented target for any session found to need retrofitting.
