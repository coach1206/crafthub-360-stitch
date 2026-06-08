# NOVEE OS — Venue Test Checklist

Run through these tests before going live at a venue. Mark each ✅ Pass or ❌ Fail.

---

## A. Boot Test

- [ ] Navigate to `/boot` — cinematic boot screen renders
- [ ] Hold the "HOLD TO ACTIVATE" button for 1.5s — app navigates to home
- [ ] Disable JavaScript briefly or throttle CPU — after 8 seconds a **Continue** button appears
- [ ] Tap **Continue** — session starts, guest proceeds to home

---

## B. Guest Journey Test

- [ ] From home (`/`), navigate to SmokeCraft (`/smokecraft`)
- [ ] Complete the onboarding / enroll step
- [ ] Navigate through at least 3 SmokeCraft modules
- [ ] Session XP increases correctly
- [ ] No blank pages or crashes

---

## C. Passport Stamp Test

- [ ] Complete a SmokeCraft session step that awards a stamp
- [ ] Stamp appears in `/smokecraft/passport-stamp`
- [ ] Stamp recorded in guest session (visible in `/passport/stamps`)
- [ ] No duplicate stamps awarded for the same step

---

## D. Staff / POS 3 Test

- [ ] Navigate to `/pos` without login — see "Staff Login" access-restricted screen
- [ ] Log in at `/staff-login` with a valid staff PIN
- [ ] After login, navigate to `/pos` — POS 3 dashboard loads
- [ ] Prototype orders appear in the active orders list
- [ ] Staff can log out

---

## E. Manager / E.A.T. Test

- [ ] Navigate to `/eat` without login — see "Manager Login" access-restricted screen
- [ ] Log in at `/admin-login` with a valid manager password
- [ ] After login, navigate to `/eat` — E.A.T. Command loads
- [ ] Dashboard data visible
- [ ] Manager can also access `/pos`

---

## F. Offline Test

- [ ] Navigate to `/offline` — offline mode page renders
- [ ] Status grid shows what's available vs paused
- [ ] **Retry Connection** button attempts to reach backend
- [ ] **Return to Experience** button navigates to home
- [ ] If backend is actually offline, auto-retry runs every 10 seconds

---

## G. Audio Mute / Read Instead Test

- [ ] Navigate to `/smokecraft/mentor`
- [ ] A mentor card is visible
- [ ] Tap the **volume icon** in the header — audio mutes
- [ ] With audio muted, "Read mode" indicator is visible
- [ ] Mentor greeting text is always visible (not hidden when muted)
- [ ] Web Speech API fallback works (browser-native TTS)

---

## H. PIN Login Test

- [ ] Go to `/staff-login` — PIN numpad renders, all buttons ≥ 48px
- [ ] Enter incorrect PIN — error message shown, PIN cleared
- [ ] Enter correct PIN — logged in successfully
- [ ] Session persists across page navigation
- [ ] Logout clears session cookie

---

## I. Route Lock Test

- [ ] Enable kiosk mode at `/kiosk-setup` (manager login required)
- [ ] Set device type to **Guest Kiosk**
- [ ] Try to navigate to `/pos` — see "Route Locked" screen
- [ ] "Return to Assigned Experience" button returns to home
- [ ] "Staff Unlock" button opens PIN entry modal
- [ ] Enter staff PIN — locked route becomes accessible
- [ ] Disable kiosk mode — all routes accessible again

---

## J. Device Status Test

- [ ] Navigate to `/device-status` (staff+ required)
- [ ] Device configuration values are shown
- [ ] System health badge shows current backend status
- [ ] Manager/admin sees deployment checklist section
- [ ] Manager/admin sees **Venue Test** button (links to `/venue-test`)

---

## K. PWA Install Test

- [ ] Open app in Safari/Chrome on tablet
- [ ] Add to Home Screen option is available
- [ ] Installed PWA launches in standalone mode (no browser bar)
- [ ] PWA icon shows NOVEE branding (gold N on dark background)
- [ ] App works offline for guest journey after installation

---

## L. Voice / Audio Test

- [ ] Navigate to Mentor page (`/smokecraft/mentor`)
- [ ] Mentor greeting plays via Web Speech API (no ElevenLabs key needed)
- [ ] Mute button silences audio
- [ ] Session continues normally whether audio plays or not
- [ ] No voice errors appear for guests

---

## M. Venue Test Control (Phase 12)

- [ ] Navigate to `/venue-test` as manager+ — page loads
- [ ] Start a test with a venue name and test type
- [ ] Start a participant session — timer runs
- [ ] Add an observer note with screen + severity
- [ ] Log an issue with type + severity
- [ ] End the participant session (Completed / Partial / Abandoned)
- [ ] Summary tab shows readiness score after data collected
- [ ] Export JSON works — no credentials or secrets in output
- [ ] Export CSV (summary) works
- [ ] Reset demo data works (admin+)
- [ ] Guest cannot reach `/api/venue-test/status` (no auth → 401)
- [ ] End test cleanly

---

## Final Sign-Off

| Area | Result | Notes |
|---|---|---|
| Boot | | |
| Guest Journey | | |
| Passport | | |
| POS 3 | | |
| E.A.T. Command | | |
| Offline Mode | | |
| Voice / Audio | | |
| PIN Login | | |
| Route Locking | | |
| PWA Install | | |
| Device Status | | |
| Venue Test Control | | |
| Admin / Founder Security | | |

**Venue:** ___________________
**Date:** ___________________
**Tested by:** ___________________

---

*NOVEE OS — Phase 12 Venue Testing Mode*

Related documents:
- `PILOT_OBSERVER_SCRIPT.md` — what to watch, when to intervene, how to score
- `GUEST_TEST_SCRIPT.md` — setup line, hints, debrief questions
- `STAFF_TRAINING_SCRIPT.md` — staff login, POS 3, what not to touch
- `MANAGER_DEMO_SCRIPT.md` — E.A.T. Command, transaction feed, export
