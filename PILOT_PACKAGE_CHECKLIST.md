# Pilot Package Checklist — NOVEE OS

> Phase 13 · Founder / Investor / Pilot Package  
> Complete this checklist before any live guest-facing deployment.

---

## Pre-Pilot Setup

### System
- [ ] NOVEE OS backend deployed and running
- [ ] Database migrations 001–009 applied
- [ ] Environment variables configured (DATABASE_URL, JWT_SECRET, FOUNDER_CHALLENGE_SECRET)
- [ ] Prototype users seeded (staff, manager, admin, founder)
- [ ] `/api/health` returns `success: true`

### Device
- [ ] Device is iPad (10th gen+) or Android tablet 10"+
- [ ] NOVEE OS installed as PWA (Add to Home Screen)
- [ ] Landscape orientation lock confirmed
- [ ] Device charged and connected to power source for extended sessions
- [ ] Auto-lock / sleep disabled (or extended to 10+ minutes)

### Network
- [ ] Wi-Fi stable and available at the demo station
- [ ] Offline fallback tested — briefly disconnected, offline mode appeared
- [ ] Reconnection sync confirmed

### Kiosk Mode
- [ ] Kiosk mode configured via `/kiosk-setup`
- [ ] Route lock verified — guest cannot navigate outside allowed routes
- [ ] Staff unlock tested with correct PIN
- [ ] Boot hardening tested — boot screen completes within 8 seconds (or Continue button appeared)

---

## Staff Readiness

- [ ] Staff trained on PIN login (STAFF_TRAINING_SCRIPT.md)
- [ ] Staff understand POS 3 active orders feed
- [ ] Staff understand table status panel
- [ ] Staff understand recommendation previews
- [ ] Staff know how to unlock from kiosk mode
- [ ] Staff know what NOT to access or change
- [ ] Staff briefed on compliance (do not make health or legal claims)

---

## Manager Readiness

- [ ] Manager trained on E.A.T. Command (MANAGER_DEMO_SCRIPT.md)
- [ ] Manager can log in with email + PIN
- [ ] Manager understands Environment, Asset, Transaction feeds
- [ ] Manager knows how to run a venue test via `/venue-test`
- [ ] Manager knows how to export a test summary

---

## Guest Experience Quality

- [ ] SmokeCraft runs to completion without error
- [ ] Mentor voice plays (or read mode works in loud environments)
- [ ] Passport stamp awarded at session end
- [ ] Leaderboard loads and updates
- [ ] Session timing is appropriate (8–12 minutes for full journey)
- [ ] Guest can navigate back from any screen

---

## Venue Test

- [ ] At least one full venue test session completed via `/venue-test`
- [ ] Readiness score ≥75 achieved
- [ ] No unresolved BLOCKER issues
- [ ] No more than 2 unresolved HIGH issues
- [ ] Observer notes reviewed
- [ ] Export generated (JSON or CSV)

---

## Compliance

- [ ] Venue contact has acknowledged compliance reminder
- [ ] Staff confirmed: all age verification and responsible service protocols are venue's responsibility
- [ ] No product is sold or recommended through NOVEE OS
- [ ] No health or legal claims made through NOVEE OS content

---

## Demo Readiness

- [ ] Founder Demo Panel accessible at `/founder-demo`
- [ ] Demo session started with correct audience type
- [ ] Talking points reviewed
- [ ] Module jump buttons tested
- [ ] Demo reset function tested (does not delete users or auth)
- [ ] Prototype disclosure visible where required

---

## Pilot Registration

- [ ] Venue registered via `/pilot-onboarding`
- [ ] Partner ID recorded
- [ ] Pilot tier confirmed
- [ ] Contact information verified
- [ ] Pilot agreement placeholder acknowledged (formal terms TBD)

---

## Documents on File

- [ ] `FOUNDER_DEMO_SCRIPT.md` — presenter has reviewed
- [ ] `INVESTOR_PITCH_NARRATIVE.md` — founder has reviewed
- [ ] `VENUE_OWNER_DEMO_SCRIPT.md` — presenter has reviewed
- [ ] `PILOT_PARTNER_ONBOARDING.md` — admin has reviewed
- [ ] `NOVEE_OS_ONE_PAGE_OVERVIEW.md` — available for distribution
- [ ] `PILOT_OBSERVER_SCRIPT.md` — observer has reviewed
- [ ] `GUEST_TEST_SCRIPT.md` — observer has reviewed
- [ ] `STAFF_TRAINING_SCRIPT.md` — trainer has reviewed
- [ ] `MANAGER_DEMO_SCRIPT.md` — trainer has reviewed

---

## Launch Criteria

All of the following must be true before going guest-facing:

- npm run build passes
- Backend starts and `/api/health` returns success
- Venue test readiness score ≥75
- No unresolved blocker issues
- Staff trained
- Manager briefed
- Device in kiosk mode
- Offline fallback confirmed
- Compliance acknowledgement on file
- Pilot partner registered

---

*NOVEE OS · Phase 13 · Pilot Package Checklist*
