# 04 — Server Authority: Session 12 (Second Third)

- Route: `/smokecraft/second-third` → `src/pages/smokecraft/SecondThird.jsx`
- Evidence endpoint: `POST /api/smokecraft/player-state/tasting-observation/second-third`
- Server vocabulary: `Flavor Development`, `Body Evolution`, `Aroma Depth`, `Burn Stability`,
  `Smoke Texture`, `Complexity Shift` — mirrors `EXPLORE_ZONES` in `SecondThird.jsx`, and is
  enforced as **distinct** from Session 8's vocabulary (cross-session ids are rejected).
- Completion endpoint: `POST /api/smokecraft/player-state/sessions/second-third/complete` —
  gated the same way as Session 8, scoped only to `second-third`.
- XP: unchanged, server-owned via `sessionRewardTable.js`.

Verified live in `verify-smokecraft-required-interaction-package-a-api.mjs` section 8 and
`verify-smokecraft-required-interaction-package-a-browser.mjs` (Session 12 full flow).
