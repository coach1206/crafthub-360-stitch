# Game-Engine Wiring — Proof Index

`public/proof/smokecraft-game-engine-wiring/`

| File | Route | State | Result |
|---|---|---|---|
| 01-flavor-memory-idle.png | /smokecraft/flavor-memory | Idle, before any change | PASS |
| 02-flavor-memory-saving.png | /smokecraft/flavor-memory | "Saving…" indicator visible immediately after moving the Intensity slider | PASS |
| 03-flavor-memory-saved.png | /smokecraft/flavor-memory | "Saved" indicator after the debounced backend request completed | PASS |

Backed by a real network-request assertion in `verify-golden-box-game-engine-flavor-memory.mjs`
(4/4 passed) — the screenshots are supporting evidence, not the proof itself.
