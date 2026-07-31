# 04 — Session 6: Matching / Classification

Added a new matching panel to `CutToastLight.jsx` (existing cut-method picker and "Learn Why" disclosure unchanged) — 3 real cut methods matched to 3 real characteristics, condensed directly from the existing `METHOD_TIPS` content.

- **Server-owned correct relationship map**: `CUT_CORRECT_MAP = { 'straight-cut':'full-cap-removal', 'v-cut':'wedge-channel', 'punch-cut':'circular-plug' }`.
- **Client submits stable item/category IDs**: `{ matches: { itemId: categoryId, ... } }`.
- **Server rejects**: unknown items/categories (`unknown_match_item`/`unknown_match_category`), duplicate category assignment (`duplicate_match_category`) — all verified live.
- **All required items must be classified**: an incomplete matching (fewer than 3 assigned) is rejected (`incomplete_matching`) at final submission, while still allowed as a partial draft.
- **Incorrect/incomplete does not complete**: verified live (API + browser).
- **Truthful feedback**: an honest `role="alert"` message on incorrect submission, distinct wording from Session 2/5's own honest feedback.
- **Attempt history**: every attempt (correct or not) recorded to the existing `smokecraft_award_audit` table.
- **Draft save/resume**: shared draft table (`activityKey='cut-toast-light'`).
- **Accessible non-drag alternative**: implemented via native `<select>` elements — the primary (only) interaction mechanism, inherently keyboard-accessible with no drag requirement at all.
- **Answer map never exposed before submission**: the category *labels* are real, honestly-worded characteristic descriptions shown in the UI (as they must be, to be usable), but the correct *mapping* itself is never sent to or computable by the client — it lives only in `CUT_CORRECT_MAP` server-side.
