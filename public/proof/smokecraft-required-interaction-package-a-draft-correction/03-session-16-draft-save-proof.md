# Session 16 (Final Third) — Draft-Save Proof

- Draft endpoints: `GET/PUT /api/smokecraft/player-state/tasting/final-third/draft` (`activityKey = 'final-third'`).
- Client: `src/pages/smokecraft/FinalThird.jsx` — combines the two client-side selection groups (`selectedFlavors` from the 10 flavor cards, `focusSelected` from the 4 focus cards) into one `notesSelected` array for the draft payload, and splits it back into the two groups (`splitNotes()`, using `FLAVOR_ZONES` membership) when loading the draft back — matching the same combined vocabulary the server already enforces for evidence submission. A new personal-notes panel and Save Draft button were added to this screen (it previously had no notes UI at all).
- Verified live (API): draft create/read with the combined focus+flavor vocabulary — `verify-smokecraft-package-a-draft-correction-api.mjs` section 9.
- Verified live (browser): real flavor selection, server-confirmed save, survives a genuine hard reload — `verify-smokecraft-package-a-draft-correction-browser.mjs`, Session 16 section.
