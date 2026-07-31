# Session 12 (Second Third) — Draft-Save Proof

- Draft endpoints: `GET/PUT /api/smokecraft/player-state/tasting/second-third/draft` (same generic route, `activityKey = 'second-third'`).
- Client: `src/pages/smokecraft/SecondThird.jsx` — identical pattern to Session 8: server-draft load on mount with honest loading/error phases, debounced + explicit draft save.
- Server vocabulary enforced on the draft too (not just final evidence submission): `Flavor Development`, `Body Evolution`, `Aroma Depth`, `Burn Stability`, `Smoke Texture`, `Complexity Shift`. Session 8's vocabulary is rejected if submitted against Session 12's draft.
- Verified live (API): create/read round trip, cross-vocabulary rejection — `verify-smokecraft-package-a-draft-correction-api.mjs` sections 5 and 9.
- Verified live (browser): real selection, server-confirmed save, survives a genuine hard reload — `verify-smokecraft-package-a-draft-correction-browser.mjs`, Session 12 section.
