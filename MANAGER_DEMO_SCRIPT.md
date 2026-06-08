# NOVEE OS — Manager Demo Script
## Phase 12: Real-World Venue Testing

> PROTOTYPE SYSTEM. No live payments. No live POS credentials.
> Managers observe analytics and guide service. NOVEE OS provides data, not decisions.

---

## Overview

This script is for demonstrating NOVEE OS to a venue manager during a pilot test.
It covers: manager login, E.A.T. Command, and what to look for during a live shift.

---

## 1. Manager Login

- Navigate to `/admin-login` or tap the manager login option
- Enter your email and 4-digit PIN
- Prototype credentials: `manager@novee.dev` / `5678`
- You will be taken to the manager dashboard

---

## 2. E.A.T. Command

E.A.T. Command is the manager's real-time intelligence panel for the venue floor.

E.A.T. stands for **Environment · Asset · Transaction**.

Navigate to E.A.T. Command from the main dashboard or at `/eat`.

---

## 3. Environment Feed

**What it shows:**
- Current ambient conditions in the venue (simulated in prototype mode)
- Table occupancy and guest flow
- Session activity across SmokeCraft and POS 3
- Time-based patterns (peak hours, slow periods)

**What to look for during a live shift:**
- Are guests spending time in SmokeCraft, or skipping it?
- Are table sessions running long (potential service issue)?
- Is there a pattern in which tables generate the most SmokeCraft activity?

---

## 4. Asset Feed

**What it shows:**
- Which products or blends are being selected by guests during SmokeCraft
- Flavor profile distribution across the current session cohort
- Top mentor selections
- Leaderboard activity

**What to look for:**
- Which products are generating the most interest? (Purchasing or stocking decisions)
- Are guests gravitating toward a particular flavor profile? (Menu or service opportunity)
- Is the leaderboard driving re-engagement?

---

## 5. Transaction Feed

**What it shows:**
- POS 3 order activity (prototype: simulated)
- Pairing recommendations that were shown to staff
- Session completion rate vs. order activity

**What to look for:**
- Is there a correlation between SmokeCraft session completion and POS 3 orders?
- Are staff using the recommendation previews?
- Are there tables with completed sessions but no orders? (Service opportunity)

**Why it matters:**
The Transaction feed connects the guest experience (SmokeCraft) to the commercial outcome (orders). This is the core NOVEE OS value proposition for managers.

---

## 6. Deployment / Device Status

Accessible at `/device-status` (manager+).

Shows:
- Current device configuration
- System health (backend, database, voice, POS 3 connection)
- Deployment readiness checklist

Use this if:
- A device is not behaving as expected
- The team needs to verify the system is connected before a session
- A venue staff member reports an issue

---

## 7. Venue Test Control

Accessible at `/venue-test` (manager+).

During the pilot test, this is where you:
- Start and end the venue test session
- Add observer notes
- Log issues with severity levels
- View the field test checklist
- Export data after the session

The readiness score at the end of the test session gives a 0–100 score for pilot readiness.

---

## 8. Export

From `/venue-test`:
- **Export JSON** — full test data including sessions, notes, issues, and summary
- **Summary CSV** — one-page readiness overview
- **Issues CSV** — full issue log by severity

This data is used to produce the post-pilot report.

---

## 9. What Managers Should Not Do During a Guest Test

- Do not interact with the guest-facing device during a SmokeCraft session
- Do not change kiosk mode settings mid-session
- Do not reset demo data while a participant session is in progress
- Do not share manager credentials with staff during the test

---

## Questions During the Demo

Common questions from venue managers and how to respond:

**"Does this integrate with our actual POS system?"**
> In prototype mode, all POS data is simulated. Integration with real POS providers is available in the commercial version.

**"What happens to the guest data?"**
> In prototype mode, all session data is local and temporary. The commercial version includes venue-controlled data retention policies.

**"Can staff see what the guest selected?"**
> Staff see only the recommendation summary in POS 3 — not the full session details. Full analytics are manager-only.

**"Can we customise the mentors or blends?"**
> Customisation of mentors, products, and content is available in the commercial venue configuration.
