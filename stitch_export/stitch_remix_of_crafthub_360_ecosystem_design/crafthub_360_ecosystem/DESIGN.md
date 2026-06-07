---
name: CraftHub 360 Ecosystem
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#39393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1b1b1c'
  surface-container: '#1f1f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#303031'
  outline: '#9a8f80'
  outline-variant: '#4e4639'
  surface-tint: '#e9c176'
  primary: '#e9c176'
  on-primary: '#412d00'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#775a19'
  secondary: '#ffb95a'
  on-secondary: '#462a00'
  secondary-container: '#c68315'
  on-secondary-container: '#3d2400'
  tertiary: '#dac1bb'
  on-tertiary: '#3c2d28'
  tertiary-container: '#b7a09a'
  on-tertiary-container: '#473733'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#ffddb6'
  secondary-fixed-dim: '#ffb95a'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#643f00'
  tertiary-fixed: '#f7ddd6'
  tertiary-fixed-dim: '#dac1bb'
  on-tertiary-fixed: '#261814'
  on-tertiary-fixed-variant: '#54433e'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 32px
  margin: 64px
  card-padding: 24px
  container-max-width: 1440px
---

## Brand & Style

The design system is engineered to mirror the physical atmosphere of an exclusive, members-only lounge. It targets high-net-worth individuals and connoisseurs who value tactile quality, heritage, and the sensory experience of luxury materials. The UI should evoke the same emotional response as sinking into a leather armchair with a glass of aged whiskey: warmth, privacy, and unhurried sophistication.

The aesthetic follows a **Tactile-Glassmorphic** hybrid approach. We move away from the sterility of modern flat design, embracing the richness of physical world materials like polished wood, grain leather, and smoked glass. Every interaction should feel weighty and deliberate, utilizing cinematic transitions that mimic the slow pour of a drink or the steady ember of a cigar.

## Colors

This design system utilizes a palette rooted in deep, organic tones and metallic highlights. The background is a "Deep Charcoal" that provides a silent, sophisticated stage for the content. "Rich Espresso" is used for secondary surfaces to add warmth and depth without breaking the dark-mode immersion.

"Burnished Gold" serves as the primary accent, used exclusively for high-value actions, borders, and brand marks to denote prestige. "Amber" provides the functional glow, used for active states and subtle illumination, mimicking the effect of warm backlighting behind bottles or humidor shelves. "Soft Smoke Gray" handles auxiliary text and subtle dividers, ensuring the UI remains legible without introducing harsh contrast.

## Typography

The typography in this design system creates a dialogue between tradition and clarity. **Playfair Display** is our voice of heritage; its high-contrast serifs and elegant curves are used for all headlines and display elements, mirroring the look of premium editorial publishing and wine labels.

**Montserrat** acts as the functional engine. Its geometric clarity ensures that even in dimly lit kiosk environments, technical details—such as vintage years, ABV percentages, or pricing—remain instantly readable. For interactive labels and navigation elements, Montserrat should be used in uppercase with generous letter-spacing to maintain a sophisticated, curated feel. 

Avoid light weights below 400 to maintain accessibility on high-resolution touch screens. Use 'Display-lg' sparingly, reserved for landing screens and section intros.

## Layout & Spacing

Designed for large-scale kiosks, the layout philosophy prioritizes "Spatial Luxury"—excessive margins and generous gutters that prevent the UI from feeling crowded. We use a **12-column fixed grid** centered within the screen, ensuring that even on ultra-wide displays, the touch targets remain within the user's ergonomic reach.

The spacing rhythm is built on an 8px base unit. Interaction targets (buttons and cards) must never be smaller than 56px to accommodate comfortable touch input. On mobile companion apps, the margins collapse to 24px, but the internal card padding remains spacious to preserve the premium feel. Layout transitions should be fluid, utilizing cross-fades and subtle "push" animations that suggest a physical movement through a high-end space.

## Elevation & Depth

Elevation in this design system is conveyed through **Physical Tiering**. We do not use standard gray shadows; instead, we use "Amber-Tinted Glows" for active elements and "Deep Espresso Blurs" for resting elements.

1.  **Base Layer:** Dark wood texture or deep espresso matte surface.
2.  **Container Layer:** Smoked glass (backdrop-blur: 20px) with a 1px "Gold Foil" inner stroke to define the edges.
3.  **Active/Floating Layer:** Elements that are being touched or selected gain a soft, external amber glow, simulating a spotlight effect.

Depth is further enhanced by using realistic photography behind smoked glass panels, creating a parallax effect where the background image moves slightly slower than the foreground UI, suggesting a three-dimensional humidor or cellar.

## Shapes

The shape language is inspired by bespoke furniture and luxury packaging. We avoid sharp, aggressive corners in favor of a **Rounded (0.5rem)** base. This "soft-touch" architecture reflects the comfort of the lounge environment.

- **Standard Elements:** 0.5rem (8px) for buttons and inputs.
- **Large Cards:** 1rem (16px) to give product showcases a sturdy, framed appearance.
- **Passport Booklets:** Specialized components use a 0.25rem (4px) radius on the outer edge to mimic the look of thick, bound paper.

Borders should rarely be solid colors; instead, use linear gradients (Burnished Gold to Deep Bronze) to simulate the way light hits a metallic edge.

## Components

### Touch-Friendly Cards
Cards are the primary vehicle for content. They should feature high-resolution photography of cigars, cocktails, or wine bottles. The text is overlaid on a "Smoked Glass" footer section of the card. On tap, the card should subtly "sink" and then expand into a cinematic full-screen view.

### Passport Booklets
A custom component for member history and "tasting notes." This should visually mimic a leather-bound journal. Use texture-mapping to give the "pages" a slight grain, and use a vertical-flip transition when navigating between sections.

### Buttons & Selection
Primary buttons use a "Gold Foil" gradient with high-contrast serif text. They should feel like physical brass plaques. Secondary buttons are "Ghost" style with a gold border and Montserrat text.

### Inputs & Selectors
Input fields are underlined with a 1px gold stroke rather than being fully enclosed boxes, maintaining an elegant, minimalist profile. Dropdowns should appear as smoked glass overlays that blur the content behind them.

### Iconography
Avoid abstract, flat icons. Use "Photo-Icons"—highly detailed, miniature 3D renders or macro-photography of objects (e.g., a real brass key for "Account", a crystal glass for "Drinks"). This reinforces the tactile, high-end nature of the ecosystem.