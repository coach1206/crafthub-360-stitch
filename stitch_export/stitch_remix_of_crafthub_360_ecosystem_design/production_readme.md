# CraftHub 360 Ecosystem - Production Frontend

## 🌐 Project Overview
CraftHub 360 is a high-fidelity, tactile hospitality operating system powered by **NOVEE OS**. It orchestrates premium guest experiences (SmokeCraft, PourCraft, BeerCraft, WineCraft), member networking via the 360 Passport, and advanced venue intelligence through the E.A.T. (Environment, Asset, Transaction) engine.

This repository contains the complete frontend architecture, specifically optimized for **72px tactile touch targets**, cinematic glass-morphism, and haptic-ready interactions.

## 📂 Repository Structure

### 📁 /src
- **📁 /components**
  - `Navigation/`: TopAppBar, BottomNavBar, NavigationDrawer (Tactile variants).
  - `Coaching/`: AI Help Coach overlays and Voice Interaction modules (ElevenLabs integrated).
  - `Cards/`: Premium glass-morphism containers for inventory and guest data.
  - `Controls/`: Haptic-ready buttons, "Hold-to-Activate" triggers, and sliders.
- **📁 /screens**
  - `GuestJourney/`: NOVEE OS Power-Up, SmokeCraft, PourCraft, BeerCraft, WineCraft flows.
  - `Passport/`: 360 Passport Connection, QR Scan, Networking Stamps, Member Profile.
  - `Staff/`: POS 3 Terminal, Live Venue Map, Training Center, Staff Mode.
  - `Admin/`: E.A.T. Command Center, Inventory Vault, Admin Setup, Venue Control Hub.
- **📁 /styles**
  - `main.css`: Global Tailwind imports and custom glass-morphism utilities.
  - `animations.css`: Cinematic transitions and haptic pulse definitions.
- **📁 /assets**
  - `logos/`: CraftHub 360 Gold Foil branding.
  - `images/`: High-fidelity atmospheric lounge backgrounds (Refined Airy style).

## 🛠️ Technical Stack
- **Engine**: HTML5 / Vanilla JavaScript (Orchestration Layer)
- **Styling**: Tailwind CSS 3.x (Custom Configuration)
- **Voice**: ElevenLabs API (Host Narrator Personas)
- **Haptics**: Tactile Feedback API Integration
- **Design System**: Obsidian Glass (Dark Mode / Gold Foil / #c5a059)

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development
To run the Tailwind JIT compiler and watch for changes:
```bash
npm run start
```

### 3. Production Build
To generate the minified, production-ready CSS bundle:
```bash
npm run build
```

## 📋 Data Contracts & State
- **Passport ID**: Bound to NFC/QR events for guest session persistence.
- **E.A.T. Logic**: Real-time sensor threshold monitoring and revenue velocity triggers.
- **POS 3**: Transaction hooks for inventory sync and automated reward/stamp logic.

## 🛡️ Governance
**STATUS**: PRODUCTION READY
**AUTHORITY**: FOUNDER LEVEL 0 ACTIVE
**ENCRYPTION**: AES-256 SYNCED
