# CraftHub 360 Production Codex: Technical Specification & State Management

## 1. System Overview
CraftHub 360 is a premium hospitality operating system powered by **NOVEE OS**. It orchestrates Guest Experiences, Staff Operations, and Venue Intelligence (E.A.T.) through a unified data layer.

## 2. Core Data Contracts
### 2.1 Guest Profile (360 Passport)
- `passport_id`: Unique NFC/QR identifier.
- `membership_tier`: [Platinum, Gold, Silver, Guest].
- `preferences`: Sensory profile data (Smoke, Pour, Beer, Wine).
- `stamps`: JSON array of [Networking, Participation, Purchase, VIP].
- `credits`: Live balance for reward redemption.

### 2.2 POS 3 Integration
- `transaction_status`: [Pending, Confirmed, Cancelled, Refunded].
- `inventory_sync`: Real-time stock decrement on "Confirmed" status.
- `stamp_trigger`: Only execute `award_stamp()` after `POS_CONFIRMATION` event.
- `cart_persistence`: Guest ID + Table ID binding to allow seamless transfers.

### 2.3 E.A.T. Intelligence Engine (Environment, Asset, Transaction)
- **Environment**: IoT sensor data for Humidity, Temperature, Noise, and Occupancy.
- **Asset**: Inventory health, overstock alerts, and depletion predictive modeling.
- **Transaction**: Revenue velocity, spend index, and staff performance metrics.

## 3. Interaction Logic (Tactile Rules)
- **Touch Targets**: Minimum 72px for primary actions.
- **Haptic Feedback**: Standard (Success/Confirm), Heavy (Error/Critical), Pulsed (Warning/Alert).
- **Navigation**: Multi-modal (Voice Assist, Physical Touch, Gesture).
- **Security**: Mandatory Manager/Admin pin for manual overrides or high-value reward redemptions.

## 4. Component State Management
### 4.1 TopAppBar
- `headline`: Context-aware (Module Name).
- `leading_action`: Standard Menu or Back.
- `trailing_action`: Profile/Passport or System Settings.

### 4.2 AI Help Coach (Overlay Layer)
- `visibility`: Triggered by system alerts or manual staff request.
- `mode`: [Text-Only (Default), Voice-Enabled (ElevenLabs)].
- `priority`: [Low (Refinement), Medium (Ready), High (Critical/Fraud)].

## 5. Deployment Milestones
1. **Frontend**: HTML5/CSS3 (Tailwind) / JS (Vanilla) with Haptic API integration.
2. **Backend**: Node.js/Python microservices for stamp verification and inventory sync.
3. **Voice**: ElevenLabs API integration for real-time host-mode narration.
4. **IoT**: Hardware bridges for humidor sensors and venue lighting/HVAC.
