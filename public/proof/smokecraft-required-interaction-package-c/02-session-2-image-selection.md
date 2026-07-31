# 02 — Session 2: Image-Based Selection

The 3 existing, image-positioned environment-zone buttons (Virtual Humidor / Dry Box / Travel Case) already rendered in `HumidorMatch.jsx` ARE the required image-based selection control — no new UI was needed, only real server evaluation.

- **Server-owned correct answer**: `HUMIDOR_CORRECT = 'virtual_humidor'` (`selectionClassificationService.js`) — the only genuinely climate-controlled option among three real, named choices.
- **Stable IDs, not filenames**: options are validated by `id` (`virtual_humidor`/`dry_box`/`travel_case`), never by image path.
- **Incorrect selection**: recorded as a real attempt (audited), never completes the session — verified live (API + browser).
- **Persistence**: draft (`smokecraft_tasting_drafts`, `activityKey='humidor-match'`) and final evidence (`smokecraft_activity_attempts`, `activity_type='selection_image'`).
- **Reload preserves completed state**: verified live in the browser suite (genuine reload after completion, server confirms `completedSessions` includes `humidor-match`).
- **Duplicate submission**: idempotent, no duplicate XP (API test section 2).
- **Image loading failure**: the interaction is a real DOM button, not an `<img>` load-dependent control — a failed background image never falsely completes the interaction (no completion path depends on image load state).
- **Alt text / keyboard**: existing `aria-label`/`aria-pressed` real `<button>` elements — already keyboard-focusable and screen-reader-labeled, unchanged.
- **Rest of the screen unchanged**: the rich temp/humidity/seal/airflow simulation and cigar picker remain exactly as before, still persisted locally.
