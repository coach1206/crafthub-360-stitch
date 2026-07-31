# 05 — Server Authority: Session 16 (Final Third)

- Route: `/smokecraft/final-third` → `src/pages/smokecraft/FinalThird.jsx`
- Evidence endpoint: `POST /api/smokecraft/player-state/tasting-observation/final-third`
- Server vocabulary: combined focus-card and flavor-note ids —
  `aroma-strength`, `flavor-intensity`, `burn-quality`, `aftertaste`, `earth`, `leather`, `wood`,
  `spice`, `coffee`, `cocoa` — mirrors `FOCUS_ZONES` + `FLAVOR_ZONES` in `FinalThird.jsx` (the
  client combines `ft.selectedFlavors` and `ft.focusSelected` into one `notesSelected` array
  before submission).
- Completion endpoint: `POST /api/smokecraft/player-state/sessions/final-third/complete` — gated
  the same way, scoped only to `final-third`.
- XP: unchanged, server-owned via `sessionRewardTable.js`.

Verified live in `verify-smokecraft-required-interaction-package-a-api.mjs` section 9 and
`verify-smokecraft-required-interaction-package-a-browser.mjs` (Session 16 full flow).
