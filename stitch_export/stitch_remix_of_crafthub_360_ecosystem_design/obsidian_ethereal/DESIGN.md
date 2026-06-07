---
name: Obsidian Ethereal
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
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
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#cecece'
  on-tertiary: '#2f3131'
  tertiary-container: '#b2b3b3'
  on-tertiary-container: '#444546'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-tour:
    fontFamily: Playfair Display
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 84px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-intro:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 64px
  gutter: 32px
  tour-card-width: 520px
  touch-target-min: 56px
---

## Brand & Style
The design system is centered on the "Obsidian Ethereal" aesthetic—a sophisticated blend of high-end tactile materials and airy, digital transparency. Designed for high-precision kiosk environments and guided tours, the brand evokes feelings of exclusivity, clarity, and premium craftsmanship.

The visual style utilizes **Glassmorphism** as its primary functional layer, employing deep "Obsidian Glass" surfaces that provide depth without visual clutter. This is contrasted with **Gold-Foil** accents to denote high-value actions and luxury status. The interface must feel like a physical layer of polished stone floating in a well-lit architectural space, providing a calming and prestigious onboarding experience for first-time users.

## Colors
The palette is rooted in a deep, monochromatic base to support the Obsidian Glass effect. 

*   **Primary (Gold-Foil):** Used exclusively for successful completions, primary "Next" buttons in the guided tour, and critical highlights.
*   **Secondary (Obsidians):** A range of near-blacks used for the base glass layers.
*   **Tertiary (Metallic Silver):** Used for secondary information and subtle borders.
*   **Neutral:** A pure black background ensures that backdrop blurs and gold accents maintain maximum vibrancy.

Transparency is a functional requirement: all surfaces should utilize an 80% opacity hex-code equivalent to allow background environmental visuals to bleed through softly.

## Typography
Typography is the primary engine for storytelling in the guided tour. 

*   **Playfair Display** provides an editorial, luxury feel for large titles and welcome messages.
*   **Manrope** ensures that instructional body text is highly legible even with backdrop blurs.
*   **Space Grotesk** is used for technical labels and navigation markers, providing a "high-precision" feel that contrasts the soft elegance of the serif.

For kiosk screens, use `display-tour` only for initial landing states. All instructional steps should prioritize `headline-lg` for immediate readability at arm's length.

## Layout & Spacing
The layout follows a **Fixed Grid** model optimized for kiosk interaction. Content is centered or anchored to the right to remain within easy reach of the user's dominant hand during a guided tour.

*   **Margins:** Generous 64px margins create the "Airy" feel and prevent the UI from feeling cramped against the screen edges.
*   **The Tour Card:** Instructional content is housed in a fixed 520px width obsidian container.
*   **Touch Precision:** All interactive elements maintain a minimum 56px height to account for kiosk touch-surface variances.
*   **Reflow:** On smaller vertical kiosks, the layout stacks the tour card at the bottom of the screen, utilizing the top 60% for environmental imagery/AR content.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and selective illumination.

*   **Obsidian Surfaces:** Use a background blur of 40px with a 1px inner stroke of white at 15% opacity to simulate the edge of a glass pane.
*   **Tonal Layering:** The tour instructions sit at the highest z-index, using a soft, 60px diffused shadow tinted with the primary gold color (#D4AF37) at only 5% opacity to suggest a warm glow.
*   **The Spotlight Effect:** During the guided tour, "dim" the background elements using a black overlay at 40% opacity, while the active component remains clear and bright.

## Shapes
This design system uses a **Rounded** shape language to balance the technical precision of the obsidian glass with a welcoming, accessible feel.

*   **Containers:** All glass panes use a 1rem (16px) corner radius.
*   **Buttons:** Actionable buttons in the tour flow use 1rem roundedness to match containers, creating a unified architectural feel.
*   **Selection States:** Active items in lists use a 0.5rem (8px) radius for sharp, precise highlighting.

## Components
Consistent styling for the "Guided Tour" flow:

*   **The Obsidian Card:** The primary container for tour instructions. Features a 40px backdrop blur, 80% dark background, and a gold top-border (2px) to signify active focus.
*   **Tour Progress Bar:** A thin, segmented bar at the top of the card. Completed steps are Gold-Foil; current steps pulse slowly; upcoming steps are 30% white.
*   **Action Buttons:** Primary buttons use a solid Gold-Foil fill with black text. Secondary buttons use a transparent background with a 1px metallic silver border.
*   **Tactile Inputs:** Checkboxes and radios are enlarged for touch (32px diameter). When checked, they fill with Gold-Foil and trigger a haptic-style visual pulse.
*   **Tooltips:** Floating obsidian glass labels with a 12px arrow pointing to the UI element being explained. They share the same glass properties as the primary tour card.
*   **Navigation Lists:** Items feature generous 24px vertical padding and a "shimmer" effect on the Gold-Foil accent when the user hovers or touches.