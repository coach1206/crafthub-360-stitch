---
name: Obsidian Glass
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c7c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#484949'
  on-secondary-container: '#b8b8b8'
  tertiary: '#d1cdcd'
  on-tertiary: '#313030'
  tertiary-container: '#b5b2b2'
  on-tertiary-container: '#464544'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c9c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#484646'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.15em
  button-text:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 24px
  panel-padding: 32px
---

## Brand & Style
This design system is engineered for **NOVEE OS**, an operating system environment that prioritizes cinematic depth, tactile precision, and a premium "executive" aesthetic. The brand personality is authoritative yet ethereal, utilizing a high-contrast interplay between deep voids and shimmering metallic accents.

The visual style is a hybrid of **Glassmorphism** and **Minimalism**. It relies on the physics of light—refraction, reflection, and caustic highlights—to define interface boundaries rather than traditional flat colors. The goal is to evoke the feeling of interacting with a physical piece of polished obsidian hardware, where the UI floats within the glass. Every interaction should feel intentional, weighted, and high-fidelity.

## Colors
The palette is rooted in the "True Obsidian" base, a near-absolute black that provides infinite depth.

- **True Obsidian (#010101):** The foundation for all backgrounds and system-level voids.
- **Warm Gold (#D4AF37):** Used exclusively for high-level typography (Headlines) and critical action states. It represents luxury and human intent.
- **Brushed Titanium (#A0A0A0):** A cool, metallic neutral used for secondary text, iconography, and hairline strokes. It provides the "hardware" feel.
- **Glass Specification:** Surface colors are not solid. They are semi-transparent tints of white (low opacity) or obsidian (high opacity) with background blur applied.

## Typography
The typographic hierarchy creates a "Modern Editorial" feel. 

**Playfair Display** is the voice of the system, used for titles and primary headers. It should always appear in **Warm Gold** or high-contrast white to maintain its elegance. **Inter** handles all functional, data-heavy, and body content, ensuring maximum legibility against dark, blurred backgrounds. 

For labels and technical metadata, use `label-caps` with increased letter spacing to mimic engraved hardware markings.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop (centering content within a 1440px max-width container) and a **Fluid Grid** for mobile modules. 

The rhythm is based on an 8px square grid. Large "Safe Areas" are critical; content must never feel crowded against the edges of the obsidian glass panels. Use generous vertical spacing (64px+) between major sections to emphasize the cinematic scale of the OS.

- **Desktop:** 12-column grid, 24px gutters, 64px margins.
- **Mobile:** 4-column grid, 16px gutters, 24px margins.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and **Tonal Layering** rather than drop shadows.

- **Level 0 (Background):** True Obsidian (#010101).
- **Level 1 (Panels):** `.glass-panel` uses a 5% white fill with a 40px backdrop blur. Borders are 1px semi-transparent "Brushed Titanium" (#A0A0A0 at 20% opacity).
- **Level 2 (Active Elements):** Elements "lift" by increasing the opacity of the glass fill (up to 12%) and adding a subtle inner glow (1px white stroke at 10% opacity) on the top and left edges to simulate light hitting an edge.
- **Focus:** No heavy shadows. Use a "caustic" glow—a soft, wide, low-opacity radial gradient of Warm Gold—behind primary modules to indicate focus or active states.

## Shapes
Shapes are disciplined and architectural. A **Soft (0.25rem - 0.75rem)** radius is used for all containers to ensure the UI feels modern but remains grounded and professional. 

Avoid "Pill" shapes for buttons; stick to subtle rounded rectangles to maintain the "cut glass" aesthetic. Circular elements are reserved strictly for avatars or status indicators.

## Components

### Haptic Buttons
Buttons must be a minimum of **72px** in height for high-touch accuracy. They feature a "Brushed Titanium" 1px border. The primary button uses a center-out gradient of Dark Grey to Obsidian, with Warm Gold text.

### Glass Panels
The `.glass-panel` is the core container. It must always feature `backdrop-filter: blur(40px)` and a top-to-bottom linear gradient stroke (Titanium to Transparent) to simulate a light source from above.

### Input Fields
Inputs are bottom-border only (1px Titanium). When focused, the border transitions to Warm Gold with a subtle 4px blur "under-glow."

### Cards & Modules
Modules should have no visible background when empty; content defines the shape. Use "hairline" separators (0.5px thickness) in Brushed Titanium to divide list items.

### Interactive Micro-states
Upon hover or touch-down, elements should slightly scale down (98%) and increase in brightness (exposure) to provide a tactile, haptic-ready feedback loop.