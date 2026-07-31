# 05 — Session 10: Hotspot / Visual Identification

The 8 existing flavor-wheel zone buttons in `FlavorMemory.jsx` (data-driven overlays, positioned by `x/y/w/h` fields in `FLAVOR_ZONES`, not baked image labels) already are real hotspots — no new UI was needed, only real server evaluation wired into `handleContinue`.

- **Real instructional image**: unchanged (`SC_ASSETS.flavorMemory`), with the live radar chart and perception sliders unchanged.
- **Data-driven overlays**: hotspots are positioned via percentage-based `x/y/w/h` inside `SmokeCraftImageBoundsOverlay`, which already scales proportionally with the image — normalized, not raw-pixel, coordinates. No hotspot-alignment code was changed by this pass.
- **Server-owned hotspot vocabulary**: `FLAVOR_HOTSPOT_IDS` (the 8 real flavor ids) — an id outside this set is rejected (`invalid_hotspot_id`).
- **Client submits stable hotspot IDs**: `{ selectedHotspotIds: [...] }`, never raw coordinates.
- **"Correctness" for inherently subjective content**: flavor perception of a real cigar has no objective ground truth — resolved using the exact same principle already established for Package A's tasting-note sessions: "correct" means a real, in-vocabulary selection (at least 2, satisfying "the required hotspot set"), not a graded judgment. Documented explicitly, not guessed.
- **Keyboard accessibility**: the 8 hotspots are real `<button>` elements with descriptive `aria-label`s (e.g. "Earth flavor") — natively keyboard-focusable and screen-reader-announced; no custom widget needed.
- **Incorrect (out-of-vocabulary) selection does not complete**: verified live (API).
- **Required hotspot set satisfied before completion**: client-side honestly rejects fewer than 2 selections before ever hitting the server (verified live in the browser suite).
- **Reload/duplicate-completion safety**: same shared `smokecraft_activity_attempts`/`completeSession()` idempotency guarantees as every other Package C session.
