# 06 — Responsive / Tablet Notes

Real observations from the tablet (834x1194) and mobile (390x844)
captures on the 4 screens swept at all three viewports (Welcome,
Scorecard, Rewards, Golden Box Build), plus the Golden Box "Rules"
sub-screen encountered during that same walk.

## Pattern: letterboxed, fixed-width "device card" inside the real viewport

Across every tablet/mobile capture, the app renders a fixed, roughly
desktop-proportioned content card centered in the real viewport, with
substantial black margin above/below/beside it, rather than a full-bleed
responsive reflow. Text inside the card stays legible and every primary
control (Back, Continue, Save Draft, etc.) remains present and clickable
in all captures — this is a real, consistent presentation choice across
the app's shared screen shell, not a broken/crashed layout, and it did
not fail any of this pass's automated render/clickability assertions.

**Disclosed as a design observation, not fixed in this pass:** correcting
this would mean changing `SmokeCraftScreenShell`'s responsive breakpoints
app-wide — a genuine UI redesign, not a small, targeted CSS/markup fix,
and therefore out of this pass's pragmatic scope (mandate section 4: fix
only small, targeted, provable defects; do not reopen completed
architecture for a design preference).

## Real, provable defect candidate found but NOT fixed in this pass (documented for follow-up)

On the Golden Box **Rules** screen at mobile width (390px), captured
during the tablet/mobile sweep of the Golden Box entry point: the "I have
read, understood, and agree to follow the Golden Box Rules" checkbox
label text visibly overlaps the "YOUR JOURNEY / 0 XP" badge and the
"Quick Rule Reminders" icon row above it — text collision, not just tight
spacing. The same screen at tablet width (834px) shows two content
sections rendering as empty black boxes with no visible content (likely
below-the-fold panels whose content didn't render at that width, or an
image/media block that failed to size). Both are visible in
`screenshots/tablet/11-golden-box-build.png` and
`screenshots/mobile/11-golden-box-build.png` (the Rules sub-screen
reached from the Golden Box entry point).

This was found late in this pass, on a screen one level deeper than the
originally-scoped "Golden Box Build" representative screen (the entry
point itself rendered cleanly at all three viewports with 0 console
errors — see `04-screen-proof-index.md`). Given this pass's time budget
was consumed principally by the higher-priority, more clearly
investor-blocking defects (SC-D068/SC-D068b) and by proving the core
demo path end-to-end, this Rules-screen mobile/tablet layout issue is
disclosed here honestly rather than either silently fixed with an
unreviewed rushed CSS change or silently omitted. Recommended as the
top candidate for the next visual-acceptance follow-up pass.

## Bottom-nav / obstruction check

No captured screen showed primary controls obstructed by a fixed
bottom-nav bar; the bottom action bar (Back / Continue) remained visible
and clickable in every capture, including the letterboxed tablet/mobile
presentations described above.
