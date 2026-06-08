# Pilot Partner Onboarding Guide — NOVEE OS

> Phase 13 · Founder / Investor / Pilot Package  
> Route: `/pilot-onboarding` — Admin+ access  
> **No payment is collected at onboarding. Pricing is placeholder.**

---

## Overview

This guide covers the complete process of onboarding a venue as a NOVEE OS pilot partner — from the initial registration through the setup session and first live guest-facing deployment.

---

## Step 1: Venue Registration

**Who does this:** Admin or Founder  
**Route:** `/pilot-onboarding`

Collect the following information from the venue:

| Field | Notes |
|-------|-------|
| Venue name | Legal or operating name |
| City / State | For geographic tracking |
| Contact name | Primary point of contact |
| Contact email | For follow-up and agreement |
| Contact phone | Backup contact |
| Current POS provider | Toast, Square, Lightspeed, other |
| Approx. staff count | For training planning |
| Wi-Fi available | Confirm stable network exists |
| Manager name | For E.A.T. Command walkthrough |
| Pilot tier | See tier definitions below |
| Modules requested | SmokeCraft required; others optional |

**Notes field:** Record any specific requirements, timeline expectations, or concerns the venue has raised.

**Compliance:** The venue contact must acknowledge the compliance reminder before submission — that NOVEE OS provides education content only, no product is sold through the system, and the venue is responsible for all applicable local tobacco and alcohol regulations.

---

## Pilot Tiers

| Tier | Hardware | Timeline | What's Included |
|------|----------|---------|----------------|
| Founder Demo | 1 tablet | 1–2 hours | Founder-led walkthrough, no data commitment |
| Single Tablet Pilot | 1 tablet | 2–4 weeks | Full guest journey, SmokeCraft + Passport |
| Kiosk Experience Pilot | 1 kiosk | 4–6 weeks | Dedicated kiosk station, kiosk mode active |
| Staff + POS 3 Pilot | 2+ devices | 4–8 weeks | Staff + manager devices, POS 3 + E.A.T. |
| Full Venue Intelligence Pilot | 3+ devices | 8–12 weeks | All modules, full data capture, analytics |

> Pricing for all tiers is placeholder. Contact the NOVEE OS team for commercial terms.

---

## Step 2: Pilot Requirements Review

After registration, confirm the following requirements with the venue:

| Requirement | Notes |
|-------------|-------|
| Tablet / display hardware | Any iPad 10th gen+ or Android tablet 10"+ |
| Stable Wi-Fi | Minimum 5 Mbps per device on premises |
| Staff availability for training | 30-minute session, schedule in advance |
| Manager availability for E.A.T. walkthrough | 30-minute session with manager |
| Compliance review | Tobacco / alcohol regulations confirmed |
| Pilot agreement | Formal agreement signed (placeholder — terms TBD) |
| Venue test session | NOVEE OS test session run before live deployment |

---

## Step 3: Pre-Setup Checklist

Before the setup day, confirm:

- [ ] Device charged and in landscape orientation stand
- [ ] Wi-Fi network credentials available on setup day
- [ ] Staff available for 30-minute training window
- [ ] Manager available for E.A.T. walkthrough
- [ ] Venue test session scheduled

---

## Step 4: Device Setup

**Time required:** 30 minutes

1. Connect device to venue Wi-Fi
2. Open browser, navigate to NOVEE OS URL
3. Install PWA to Home Screen (Add to Home Screen)
4. Verify landscape orientation lock is active
5. Navigate to `/kiosk-setup` (manager login required)
6. Configure kiosk mode for the venue's desired route lock
7. Test boot sequence — verify boot hardening triggers within 8 seconds if needed
8. Test offline fallback — briefly disable Wi-Fi and confirm offline mode activates

---

## Step 5: Staff Training (30 minutes)

Follow `STAFF_TRAINING_SCRIPT.md` for the complete walkthrough.

Key points to cover:

- Staff PIN login (default: 1234 for demo — change for live deployment)
- POS 3 active orders feed orientation
- Table status panel
- Recommendation preview — what it means and when to use it
- Staff unlock from kiosk mode
- What staff should NOT access or change

---

## Step 6: Manager E.A.T. Walkthrough (30 minutes)

Follow `MANAGER_DEMO_SCRIPT.md` for the complete walkthrough.

Key points to cover:

- Manager login (email + PIN)
- E.A.T. Command overview — Environment, Asset, Transaction
- Session activity panel
- How to identify high-engagement periods
- How to use the data to brief staff before a shift

---

## Step 7: Venue Test Session

Follow `PILOT_OBSERVER_SCRIPT.md` and `GUEST_TEST_SCRIPT.md`.

**Target:** Readiness score ≥75 before going guest-facing.

- Run `/venue-test` as the observer
- Log notes and issues in real time
- Review the readiness score and recommendation at the end
- Resolve any blocker or high-severity issues before proceeding

---

## Step 8: Go Live

Confirm all of the following before the first guest-facing session:

- [ ] Readiness score ≥75
- [ ] No unresolved blocker issues
- [ ] Staff trained and comfortable with POS 3
- [ ] Manager briefed on E.A.T. Command
- [ ] Device fully charged and in kiosk mode
- [ ] Offline fallback tested
- [ ] Compliance acknowledgement on file

---

## Ongoing Support

During the pilot period:

- **Weekly check-in** — review E.A.T. data with the manager
- **Issue log review** — review any new issues logged by staff
- **Readiness re-score** — run a follow-up venue test session after the first two weeks

---

## Compliance Notes

NOVEE OS provides craft education and tasting guidance content only. It is the venue's responsibility to:

- Comply with all applicable local tobacco laws (age verification, advertising restrictions)
- Comply with all applicable local alcohol laws where applicable
- Ensure all staff are trained in responsible service
- Ensure no product is sold or recommended through NOVEE OS that violates local regulations

NOVEE OS does not process transactions, age-verify guests, or provide legal advice. The venue controls all service decisions.
