# 03 — Session 5: Sorting / Sequencing

Added a new sequencing panel to `Format.jsx` (the existing shape-exploration hotspots/insight panel are unchanged, still usable for browsing details) — 6 real shapes to order shortest-to-longest burn time.

- **Server-owned correct order**: `FORMAT_CORRECT_ORDER = ['corona','robusto','toro','torpedo','churchill','gordo']`, derived directly from each shape's own already-documented `burnTime` range midpoint (not invented).
- **Client submits ordered stable IDs**: `{ orderedIds: [...] }`.
- **Server validates**: missing (`incomplete_sequence`), duplicate (`duplicate_sequence_id`), and unknown (`unknown_sequence_id`) IDs — all verified live (API test section, Session 5 malformed-payload group).
- **Incorrect sequence does not complete**: verified live (API + browser — a deliberately scrambled starting order that is submitted uncorrected is accepted as an attempt but rejected).
- **Draft**: partial arrangement saves via the shared draft table (`activityKey='format'`), debounced — reload restores the in-progress order.
- **Draft never awards XP**: verified (API test section 15 equivalent — no XP change from any draft save).
- **Keyboard-accessible move controls**: real `<button aria-label="Move X earlier/later">` up/down controls — no drag-and-drop dependency; large (22×22px within a touch-friendly row) tap targets suitable for tablet use.
- **Reload/resume**: verified live in the browser suite.
