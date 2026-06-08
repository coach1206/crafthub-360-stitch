# NOVEE OS — Staff Training Script
## Phase 12: Real-World Venue Testing

> PROTOTYPE SYSTEM. No live payments. No live POS credentials.
> Staff controls actual service decisions. NOVEE OS provides guidance only.

---

## Overview

This script is for training venue staff before a pilot test.
It covers: staff login, POS 3, active orders, table status, and what staff should not touch.

---

## 1. Staff Login

- At any screen, navigate to the staff login (via the menu or directly at `/staff-login`)
- Enter your 4-digit staff PIN
- The default prototype PIN is `1234`
- You will be taken to the staff dashboard

**What staff can access after login:**
- POS 3 active orders
- Table status feed
- Recommendation previews
- E.A.T. environment feed (limited view)

**What staff cannot access:**
- Manager dashboard (requires manager login)
- E.A.T. Command full analytics
- Deployment / device settings
- Founder controls

---

## 2. POS 3 — Active Orders

POS 3 shows the live order feed from the venue's point of sale system.

In prototype mode, orders are simulated.

**What to look for:**
- Table number and order status (open, pending, ready)
- Guest count per table
- Elapsed time since order was placed

**What to do if an order is delayed:**
- Note the table number
- Follow normal venue service protocols
- NOVEE OS does not send alerts to guests — that is the staff's responsibility

---

## 3. Table Status

The table status feed shows:
- Which tables are occupied
- How long guests have been seated
- Whether a SmokeCraft session is in progress at a table

**Important:** NOVEE OS provides informational context only. All service decisions are made by the staff.

---

## 4. Recommendation Preview

When a guest completes a SmokeCraft session, a recommendation preview may appear in POS 3.

This shows:
- The guest's flavor profile (from their session)
- A suggested pairing or product recommendation
- This is a suggestion only — staff may use their judgment

---

## 5. What Staff Should NOT Touch

- Do not access `/admin-login` unless you are a manager
- Do not enter the Founder Controls area
- Do not change device configuration settings
- Do not attempt to reset data (admin-only)
- Do not share your staff PIN

---

## 6. During the Venue Test

During a pilot test, an observer may be watching.

- Use the system as you normally would
- If something does not work as expected, mention it to the observer
- Do not attempt to diagnose or fix technical issues yourself

---

## 7. Staff Unlock for Kiosk Mode

If the device is in kiosk (guest-facing) mode and a staff member needs access:

- Tap the staff unlock button in the corner of the screen
- Enter your staff PIN
- You will be returned to the staff dashboard
- The kiosk will resume when staff session ends

---

## Questions

Speak to the manager or observer during the pilot test. Do not attempt to reconfigure the device during a live test session.
