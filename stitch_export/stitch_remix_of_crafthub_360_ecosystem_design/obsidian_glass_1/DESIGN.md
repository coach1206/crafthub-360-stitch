---
name: Obsidian Glass
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c7c6c6'
  on-secondary: '#303031'
  secondary-container: '#464747'
  on-secondary-container: '#b6b5b5'
  tertiary: '#d0cecd'
  on-tertiary: '#313030'
  tertiary-container: '#b5b2b2'
  on-tertiary-container: '#454545'
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
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  telemetry-data:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-padding: 20px
---

## Brand & Style
This design system centers on high-utility luxury for the E.A.T. Intelligence platform. The brand personality is authoritative, precise, and elite, catering to a target audience that requires mission-critical data visualization within a premium environment. 

The aesthetic is a hybrid of **Glassmorphism** and **Minimalism**, set against a "True Obsidian" backdrop. The goal is to evoke a sense of deep space and focus, where data is the only thing that shines. By utilizing brushed titanium accents and warm gold highlights, the UI moves away from standard "tech-blue" tropes into a sophisticated, executive-grade telemetry suite. The emotional response is one of absolute control and unwavering clarity.

## Colors
The palette is rooted in an ultra-deep black base to eliminate visual noise and maximize the perceived depth of glass layers.

- **True Obsidian (#010101):** The primary canvas color. It should be used for the absolute base layer of all dashboards.
- **Warm Gold (#D4AF37):** Used exclusively for high-priority data points, active states, and critical typography. It represents "intelligence" and value.
- **Brushed Titanium (#7A7A7A):** Applied to structural elements, inactive icons, and borders. It provides a metallic, tactile contrast to the glass elements.
- **Obsidian Surface (#0F0F0F):** A slightly lighter black used for container backgrounds to create subtle separation from the base.
- **Telemetry Accents:** Use a desaturated amber for secondary data visualizations to maintain the warm spectrum without competing with the primary Gold.

## Typography
The typography system balances contemporary executive style with technical precision.

- **Hanken Grotesk** is used for primary headings and display values, offering a clean, sharp, and modern professional feel.
- **Geist** provides a highly legible, neutral body face that allows for dense information architecture without fatigue.
- **JetBrains Mono** is reserved for all telemetry indicators, data labels, and timestamps. Its monospaced nature ensures that fluctuating real-time numbers do not cause layout shifts and maintains a "system-level" aesthetic.

All Warm Gold typography should be used sparingly for "Hero" metrics to ensure they stand out against the titanium-colored secondary text.

## Layout & Spacing
The design system utilizes a **Fixed Grid** philosophy for desktop dashboards to ensure that complex telemetry layouts remain predictable and glanceable.

- **Desktop:** 12-column grid with 24px gutters. Modules should snap to grid lines to maintain a "scientific instrument" feel.
- **Mobile:** 4-column fluid grid. Data cards stack vertically, with telemetry indicators moving to a horizontal scrolling ticker if necessary.
- **Rhythm:** A 4px baseline grid governs all internal padding. Use larger 40px margins on the outer edges of the viewport to create a "floating" glass effect for the central dashboard.

## Elevation & Depth
Depth is the core of the "Obsidian Glass" aesthetic. We move away from traditional shadows in favor of light-based depth.

- **Glassmorphism Layering:** Use semi-transparent backgrounds (RGBA 15, 15, 15, 0.6) with a 20px backdrop-blur for all primary cards.
- **Inner Glow:** Instead of drop shadows, use a 1px inner border with a linear gradient (Top-Left: Titanium at 30% opacity, Bottom-Right: Transparent). This creates a "glass edge" that catches the light.
- **True Obsidian Base:** The lowest level is always #010101. No elements should appear "behind" this layer.
- **Telemetry Glow:** Active data points and critical alerts use a soft, 8px outer glow in Warm Gold (#D4AF37) at 20% opacity to simulate light emitting from within the glass.

## Shapes
The shape language is "Soft" yet disciplined. While the glass panels have slight rounding to feel premium and engineered, they maintain enough sharpness to feel like precision tools.

- **Primary Containers:** Use `rounded-lg` (0.5rem) to soften the large glass panels.
- **Interactive Elements:** Buttons and input fields use the base `rounded` (0.25rem).
- **Data Points:** Real-time telemetry indicators (status dots) are circular (full radius) to contrast against the rectangular grid.

## Components
Consistent execution of the glass-and-metal theme across all UI elements:

- **Buttons:** Primary buttons feature a subtle brushed titanium gradient background with Gold text. Secondary buttons are "Ghost" style with the 1px titanium inner border.
- **Telemetry Cards:** These are the heart of the system. Each card must have a `backdrop-filter: blur(20px)` and an 8% white tint to distinguish it from the background.
- **Charts:** Use thin, 1.5pt lines for line charts. Data fills should be gradients from Warm Gold (30% opacity) to Transparent. Avoid solid fills.
- **Inputs:** Dark, recessed fields with a 1px bottom border in Titanium. On focus, the border transitions to Warm Gold.
- **Status Indicators:** Use a "Pulse" animation for real-time data streams. A small Gold dot with a concentric expanding ring indicates active telemetry ingestion.
- **Lists:** Items separated by 1px titanium lines at 10% opacity. No alternating row colors; use hover states with a 5% white overlay to indicate selection.