# 07 — Draft, Reload, and Resume

Reuses the existing `smokecraft_tasting_drafts` table/routes — no new draft system.

- **Scoped by player, session, interaction**: `(guest_reference, activity_key)`, `activity_key` = the sessionId.
- **Genuine reload restores progress**: verified live for Session 15 (a hard reload preserves the in-progress, already-answered quiz state).
- **Leaving and returning restores progress**: verified live for Session 4 (navigate away to an unrelated completed route, then back — partial checkpoint progress is restored from the server draft, not localStorage).
- **Draft save never awards XP or unlocks progression**: verified live (API — draft saves alone never change `xpTotal` or create a completion record).
- **Stale draft cannot overwrite completion**: verified live for Session 3 (`409 already_completed` on a post-completion draft write attempt).
- **Cross-session drafts remain isolated**: verified live (Session 4-shaped checkpoint ids rejected against Session 3's draft, `unknown_checkpoint_id`).
