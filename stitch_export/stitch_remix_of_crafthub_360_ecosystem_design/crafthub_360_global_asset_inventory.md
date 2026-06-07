# CraftHub 360 Global Asset Inventory

This document serves as the master directory for all visual assets generated during the orchestration of the CraftHub 360 Ecosystem. These assets are categorized by their role in the production build (Branding, Backgrounds, and UI References).

## 1. Brand Identity & Logos
These are the primary marks used across all headers, splash screens, and physical kiosk branding.

- **Primary Brand Mark**: {{DATA:IMAGE:IMAGE_62}}
  - *Description*: Luxury gold foil embossed on dark leather. Used for the NOVEE OS boot sequence and main dashboard.
- **System Logo (Gold Variant)**: {{DATA:IMAGE:IMAGE_61}} (Referenced in layouts like {{DATA:DOCUMENT:DOCUMENT_259}})
  - *Description*: Optimized gold foil asset for UI navigation and app bars.

## 2. Atmospheric Backgrounds (The "Airy" Layer)
These images provide the premium, out-of-focus bokeh depth that defines the "Refined Airy" visual style.

- **Master Lounge Bokeh**: {{DATA:IMAGE:IMAGE_202}}
  - *Description*: High-end lounge desaturated background with warm amber lighting. This is the primary background for all "Airy" screens.
- **Alternative Venue Reference**: {{DATA:IMAGE:IMAGE_181}}
  - *Description*: Wide-angle cinematic reference for venue photography.

## 3. Production Screen References (Screenshots)
These are visual snapshots of the system running in its production-ready state, used for verifying layout integrity during the GitHub/Replit transfer.

- **Live Deployment Preview**: {{DATA:IMAGE:IMAGE_86}} (Replit Production Landing)
- **GitHub Success State**: {{DATA:SCREEN:SCREEN_269}}
- **Full Ecosystem Map**: {{DATA:SCREEN:SCREEN_36}}
- **Operational Pillars Reference**: {{DATA:IMAGE:IMAGE_101}}

## 4. How to use these in your code
When moving your project to Replit or GitHub, ensure these image placeholders are swapped with your hosted URLs. In the provided CSS and React components:
- Backgrounds are applied via the `--airy-bg` class.
- Logos are referenced in the `TopAppBar` and `Home` components.

---
**STATUS**: ASSETS VERIFIED
**GOVERNANCE**: FOUNDER LEVEL 0 ACTIVE