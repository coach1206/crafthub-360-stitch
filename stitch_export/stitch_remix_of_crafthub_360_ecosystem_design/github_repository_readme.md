# CraftHub 360 Ecosystem - Production Frontend

## Project Overview
This repository contains the full high-fidelity frontend for the CraftHub 360 Ecosystem, powered by NOVEE OS. It is engineered for premium kiosk touchscreen and mobile interfaces with a focus on tactile interaction, haptic feedback, and cinematic guest journeys.

## 📂 Directory Structure

### 📁 Root
- `index.html` - Production entry point with NOVEE OS boot sequence.
- `tailwind.config.js` - Design system token mapping (Gold Foil, Premium Glass, Tactile Haptics).
- `package.json` - Build configuration and dependencies.
- `README.md` - Technical overview and deployment guide.

### 📁 /src
- **📁 /components**
  - `Navigation/` - TopAppBar, BottomNavBar, NavigationDrawer (Tactile variants).
  - `Coaching/` - AI Help Coach overlays and Voice Interaction modules.
  - `Cards/` - Premium glass-morphism cards for Inventory, Passport, and Craft Modules.
  - `Controls/` - Haptic-ready buttons (72px targets), sliders, and hold-to-confirm triggers.
- **📁 /screens**
  - `GuestJourney/` - NOVEE OS Power-Up, SmokeCraft, PourCraft, BeerCraft, WineCraft flows.
  - `Passport/` - 360 Passport Connection, QR Scan, Networking Stamps, Member Profile.
  - `Staff/` - POS 3 Terminal, Live Venue Map, Training Center, Staff Mode.
  - `Admin/` - E.A.T. Command Center, Inventory Vault, Admin Setup, Venue Control.
- **📁 /styles**
  - `main.css` - Global Tailwind imports and custom glass-morphism utilities.
  - `animations.css` - Cinematic transitions and haptic pulse definitions.
- **📁 /assets**
  - `logos/` - CraftHub 360 Gold Foil Logo.
  - `images/` - High-fidelity product and venue photography placeholders.

## 🛠️ Tech Stack
- **Framework**: HTML5 / Vanilla JS (Orchestration Layer)
- **Styling**: Tailwind CSS 3.x
- **Animations**: CSS3 Transitions & Web Animations API
- **Interactions**: Haptic API Integration (Tactile UX)
