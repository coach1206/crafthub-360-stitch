# 06 — Server Authority

The server owns, for all 3 sessions:

- **Required checkpoint IDs**: `MEET_YOUR_CIGAR_CHECKPOINTS`, `TERROIR_CHECKPOINTS`, `KNOWLEDGE_DROP_CHECKPOINTS` — defined only server-side.
- **Allowed response values**: booleans for Sessions 3/4 checkpoints, `0-2` integer indices for Session 15.
- **Required checkpoint count**: enforced by `missing_required_checkpoint`.
- **Synthesis requirement**: enforced by `synthesis_required`.
- **Validation and evaluation**: `validateSubmission()`/`evaluate()` per session, computed purely from the submitted payload.
- **Completion, attempt history, XP, progression, reward triggers, audit events**: unchanged canonical paths, gated by `hasSelectionEvidence()`.

The client may submit only checkpoint responses, selections, and the final synthesis value. Verified live: a direct API bypass attempt carrying fabricated `allVisited`/`completed`/`passed`/`xpEarned` fields on the raw completion endpoint is denied identically to a request with no extra fields at all — those fields are never read.
