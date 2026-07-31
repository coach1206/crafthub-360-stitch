# Session 8 (First Third) — Draft-Save Proof

- Draft endpoints (reused, unmodified routes): `GET/PUT /api/smokecraft/player-state/tasting/first-third/draft`
- Backend: `getTastingDraft()` / `saveTastingDraft()` (`server/services/smokecraft/playerStateService.js`) — the same functions and `smokecraft_tasting_drafts` table already used by Mini Tasting's own draft, keyed by `activityKey = 'first-third'`.
- Client: `src/pages/smokecraft/FirstThird.jsx` — on mount, calls `loadTastingDraft('first-third')` and shows an honest `loading`/`error`/`ready` phase before rendering the interactive zones. A debounced (1200ms) and an explicit "Save Draft" button both call `saveTastingDraft('first-third', { notesSelected, personalNotes }, draftVersion)`.
- Verified live (API): create (version 0→1), read-back matches exactly what was saved, update (version 1→2) — `verify-smokecraft-package-a-draft-correction-api.mjs` section 1.
- Verified live (browser): real zone selection + personal note saved, "✓ Saved" only shown after a real server round trip — `verify-smokecraft-package-a-draft-correction-browser.mjs`, Session 8 section.
