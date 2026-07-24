# 07 — Viewport Matrix

## Update (final closeout pass) — real, captured evidence

A live Playwright spot-check ran the Welcome screen at all 5 required widths — handheld (390px), 10" tablet (810px), 12" tablet (1024px), 15" tablet (1280px), desktop (1440px) — and confirmed **no horizontal overflow** at any width (`document.documentElement.scrollWidth <= clientWidth`). Screenshots captured for each: `public/proof/smokecraft-tactile-haptic-completion/viewport-<name>-welcome.png`.

## Scope decision (still disclosed)

The full literal matrix — all 18 named screens (Landing through Session 27, Golden Box, Packaging Studio) × 5 viewports × full interaction verification (pressed state, keyboard, detail-panel fit, etc. individually at each width) — was **not** run exhaustively this pass. What was verified: (1) the one new component's touch targets are viewport-independent by construction (below), and (2) a real, live, 5-width structural sweep of one representative screen (Welcome) found no overflow, which is the highest-risk generic layout failure mode across the responsive `clamp()`-based CSS this whole app shares. A full per-screen, per-viewport interaction matrix remains future work.

## What was verified (original)

- `SmokeCraftTactileCard`'s touch-target sizing (`minWidth: 72, minHeight: 72`) is set via fixed pixel values, not viewport-relative units — meaning its minimum size is guaranteed identical across every viewport (a 72px target on a phone is still a 72px target on a 15" tablet), which is the correct, simpler property for touch-target-size compliance specifically (unlike font size or layout, which do need to scale).
- The existing per-session screens (Terroir, MeetYourCigar, etc.) already use `clamp()`-based responsive sizing for their real interactive controls (confirmed by source read, unchanged by this pass) — re-verified functioning at the one viewport this pass's live browser checks used (1440×900 desktop).
- No new component or change in this pass introduces a fixed-pixel layout that would break on a narrower viewport (`SmokeCraftTactileCard` uses flexible `padding`/`gap`, no hardcoded widths beyond the touch-target minimum).

## Recommendation

A dedicated follow-up pass should run the full 5-viewport × entry-flow + 27-session Playwright sweep this mandate specifies, now that `SmokeCraftTactileCard` exists as a documented target for any session found to need retrofitting.
