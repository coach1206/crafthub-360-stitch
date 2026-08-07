# Visual Design System (Locked Identity)

The navy/charcoal/champagne-gold identity is already established across the app — extend it, don't replace it.

## Core tokens (as used in HumidorMatch.jsx, VenueSelect.jsx, and other rebuilt live-DOM screens)

```
GOLD         #E9C176   — primary accent, active states, primary CTA text
GOLD_DIM     rgba(233,193,118,0.55)  — secondary/inactive accent, borders
CREAM        #e5e2e1   — primary text on dark surfaces
BORDER       rgba(233,193,118,0.22) — panel/card borders
GLASS        rgba(233,193,118,0.06) — translucent dark glass panel background
GLASS_ACTIVE rgba(233,193,118,0.12) — glass panel background when selected/active
NAVY         #0b0f18   — deep background
NAVY_DEEP    #060810   — deepest background/overlay
```

Typography: `Georgia, serif` for headings/labels (premium, editorial feel); a clean sans for body copy where already established. Touch targets: 44×44 CSS px minimum everywhere (already enforced in Stepper/Toggle/card components).

## What a designer may change

Composition, spacing rhythm, card shadow/elevation treatment, animation/transition polish, iconography style, photography crop/treatment (within approved assets), hierarchy emphasis, premium micro-interactions (hover/press states) — as long as the underlying token values and touch-target minimums are respected and every interactive element stays real DOM (see `LIVE_INTERACTION_REQUIREMENTS.md`).

## What a designer may not silently change

The token color values themselves (they're brand-locked), font family choices for headings, or the underlying DOM structure that live tests/detectors key off (e.g. `role="radiogroup"`, `aria-pressed`, `data-testid` attributes some screens use for automated verification).
