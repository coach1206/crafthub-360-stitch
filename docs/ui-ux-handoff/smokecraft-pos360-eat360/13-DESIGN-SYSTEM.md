# 13 — Design System Specification

## Source of truth

`tailwind.config.js` (repo root). All token values below are copied
directly from that file, not approximated.

## Important disclosure: two coexisting palettes

This platform currently ships **two different visual systems** that a
developer must not conflate:

1. **SmokeCraft/Golden Box dark palette** (Material Design 3-derived,
   defined in `tailwind.config.js`) — deep charcoal/near-black base with
   champagne-gold primary accent. This is the primary "premium cigar-
   lounge" system referenced throughout this handoff and the one the task
   brief's palette description matches.
2. **POS360/E.A.T. command-shell light palette** (defined inline as JS
   constants in `src/components/pos3/shell/CommandAppShell.jsx`) — warm
   ivory base with deep navy rail/header and a *different* champagne-gold
   accent value. Its own header comment states the palette source is
   `public/Venue command HUb 2.png` and the layout zones come from
   `public/TABLE MANAGEMENT SYSTEM .png`.

**This is a real, disclosed inconsistency**, not a design choice to
silently reproduce. See `17-KNOWN-LIMITATIONS...md`.

## System 1 — SmokeCraft dark palette (`tailwind.config.js`)

### Core surface/background
- `background` / `surface` / `surface-dim`: `#131314`
- `surface-bright`: `#39393a`
- `surface-container-lowest`: `#0e0e0f`
- `surface-container-low`: `#1b1b1c`
- `surface-container`: `#1f1f20`
- `surface-container-high`: `#2a2a2b`
- `surface-container-highest`: `#353436`

### Text on dark
- `on-background` / `on-surface`: `#e5e2e3`
- `on-surface-variant`: `#d1c5b4`

### Primary (champagne gold)
- `primary`: `#e9c176`
- `primary-container`: `#c5a059`
- `on-primary`: `#412d00`
- `surface-tint`: `#e9c176`

### Secondary (warm amber)
- `secondary`: `#ffb95a`
- `secondary-container`: `#c68315`

### Tertiary (dusty rose/tan)
- `tertiary`: `#dac1bb`

### Utility
- `outline`: `#9a8f80`, `outline-variant`: `#4e4639`
- `error`: `#ffb4ab`, `error-container`: `#93000a`
- `accent-success`: `#4ade80`
- `accent-blue`: `#3b6ea5`, `accent-blue-deep`: `#1c3a5e`, `accent-blue-glow`: `#5b8fc9`

### Passport tier (navy/ivory/gold leather — additive, namespaced `passport-*`)
- `passport-navy`: `#0f1b2e`, `passport-navy-deep`: `#0a1320`, `passport-navy-light`: `#1c3454`
- `passport-ivory`: `#f3ead8`, `passport-ivory-dim`: `#e4d9c2`
- `passport-gold`: `#c9a84c`, `passport-gold-bright`: `#e9c176`

### NOVEE OS tier (deep-tech command shell — additive, namespaced `novee-*`)
- `novee-bg`: `#070b14`, `novee-panel`: `#0d1420`, `novee-panel-light`: `#141d2e`
- `novee-cyan`: `#5b8fc9`, `novee-gold`: `#c9a84c`

### Typography
- Display/headline: `"Playfair Display", serif` — `display-lg` 64px/72px
  (-0.02em, 700), `headline-xl` 48px/56px (600), `headline-lg` 32px/40px
  (500), `headline-md` 24px/32px (500).
- Body/label: `Montserrat, sans-serif` — `body-lg` 18px/28px,
  `body-md` 16px/24px, `label-lg` 14px/20px (0.1em tracking, 600),
  `label-sm` 12px/16px (0.05em tracking, 500).

### Spacing/radius/shadow
- Spacing scale: `gutter` 32px, `unit` 8px, `card-padding` 24px,
  `margin` 64px, `container-max-width` 1440px.
- Radius: default `0.25rem`, `lg` 0.5rem, `xl` 0.75rem, `2xl` 1rem,
  `full` 9999px.
- Shadow: `tactile` `0 10px 40px rgba(0,0,0,0.6)`, `glow-gold`
  `0 0 25px rgba(233,193,118,0.25)`.
- Motion: `subtle-float` keyframe (translateY 0→-10px→0), `shine`
  keyframe (background-position sweep), `gold-pulse` keyframe
  (box-shadow ring pulse) — the same visual language as
  `RippleDissolveTransition`'s gold ripple.

## System 2 — POS360/E.A.T. command-shell palette (`CommandAppShell.jsx`)

- `IVORY`: `#f7f3ea`, `IVORY_PANEL`: `#fffdf8`
- `NAVY`: `#13294b`, `NAVY_SOFT`: `#1c3a64`
- `GOLD`: `#c9952c`, `GOLD_DEEP`: `#a87420`
- `SLATE`: `#5a6b80`
- `LINE`: `rgba(19,41,75,0.12)`
- Layout: `SHELL_GRID` — 3-column (`220px minmax(0,1fr) 380px`) x
  3-row (`auto minmax(0,1fr) auto`) grid: left rail, main canvas, right
  panel, top bar, bottom strip. `font-family: system-ui, sans-serif`
  (not Playfair/Montserrat).
- Button standard: `BIG_BTN` — min-height 56px, radius 12px, font-weight
  700, font-size 13.5px (touch/tablet-first sizing). `NAV_BTN_HEIGHT`:
  44px (matches the WCAG-recommended 44px minimum touch target).

## Reconciliation guidance for a developer

Do not silently pick one palette and repaint the other system to match
without a product decision — that is a real design-system unification
project, not a small fix. Until that decision is made:
- Keep SmokeCraft/Venue Humidor/Golden Box screens on System 1 (dark MD3).
- Keep POS360/E.A.T. command screens on System 2 (light ivory/navy).
- Any *new* shared component (e.g. a shared status badge or button)
  should accept a `theme` prop or be built twice, not hard-code one
  palette's hex values.
