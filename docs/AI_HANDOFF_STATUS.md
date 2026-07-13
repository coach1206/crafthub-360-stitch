# SmokeCraft 360 — AI Handoff Status

## Recovery Branch
`recovery/smokecraft-codex-final`

## Starting Commit
`66531672` — recover(smokecraft): restore approved landing, GoldenBox, and App.jsx to c4f2a03d state

## Recovery Start Date
2026-07-13

---

## Current System State

### Working Tree
Clean — no uncommitted changes at recovery start.

### Route Count
25 active SmokeCraft routes wired in App.jsx.

### Build Identity
`window.__SMOKECRAFT_BUILD__.commit === "66531672"`

---

## Completed (This Session)

- [x] Created `recovery/smokecraft-codex-final` branch from `66531672`
- [x] Pushed branch to remote
- [x] Restored `SmokeCraft.jsx` landing to approved `smokecraft-landing.png` + SECONDARY_NAV + SmokeCraftNavBar (from c4f2a03d)
- [x] Restored `GoldenBox.jsx` to approved GOLDEN BOX RULES.png + checkbox (from c4f2a03d)
- [x] Removed unauthorized `hideHeader` from App.jsx index route
- [x] Created full route audit: `docs/smokecraft/SMOKECRAFT_FULL_RECOVERY_MATRIX.md`
- [x] All 25 routes respond HTTP 200
- [x] 91/91 structural tests PASS

---

## In Progress (This Commit)

- [ ] Landing: Remove floating 6-chip SECONDARY_NAV panel + SmokeCraftNavBar giant bars
- [ ] Landing: Replace with clean inline navigation aligned with approved smokecraft-landing.png
- [ ] Identity: Remove giant "Start New SmokeCraft Session" bar
- [ ] Identity: Add real form fields (Full Name, Email, Preferred Name, Birth Date, Country, Experience, Focus)
- [ ] Identity: Wire persistence + "Begin My Journey" CTA + Back
- [ ] GoldenBox: Expand to full guest/venue form (name, email, birth date, country, experience, venue, table, server, date/time, party size, occasion)
- [ ] GoldenBox: Preserve acknowledgement gate + persistence
- [ ] All routes: audit for duplicate controls, wrong assets, unauthorized bars
- [ ] Run full recovery test suite
- [ ] Capture screenshot proof (25 routes × 4 viewports)
- [ ] Production build + commit + push

---

## Permanent Safety Rules

- Do NOT redesign approved SmokeCraft screens
- Do NOT add overlays, masks, or darkening layers
- Do NOT use duplicate controls over printed image controls
- Do NOT add giant bottom session bars on image-display screens
- Do NOT create new visual concepts
- Do NOT silently substitute artwork
- Do NOT begin POS360 work
- Do NOT create a release tag
- Do NOT merge into main
- Do NOT freeze SmokeCraft
- Do NOT fake live integrations or show false success states

---

## Next Actions After This Session

1. Founder visual review of all 25 routes on Vercel preview
2. Approval or correction feedback per route
3. If approved: create release candidate commit
4. POS360 work may begin only after founder approves SmokeCraft

---

## Recovery Matrix
See: `docs/smokecraft/SMOKECRAFT_FULL_RECOVERY_MATRIX.md`
