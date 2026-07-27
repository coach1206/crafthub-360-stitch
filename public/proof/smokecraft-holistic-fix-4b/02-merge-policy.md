# SmokeCraft Guest → Account Merge Policy — Holistic Fix 4B

Generated: Holistic Fix 4B, starting commit `ce4fbdff`.

## When this applies

A guest who has been accumulating progress under a server-verified guest
identity (`smokecraft_guest_session` cookie, per `SMOKECRAFT_STATE_OWNERSHIP_MAP.md`)
creates or signs into a `passport_member` account. The conversion
endpoint (`POST /api/smokecraft/player-state/convert-guest`) reassigns
the guest's records to the account's identity
(`guest_reference = 'user:<userId>'`, matching the existing
`ownerGuestReference()` convention already used throughout this
codebase). This document defines exactly what happens to every category
of state when the account **already has its own prior state** (e.g. the
guest converts on a device where they'd previously signed in and made
independent progress before ever touching this guest session).

## Merge rule per state category

| Category | Rule | Rationale |
|---|---|---|
| **Session completions** (`smokecraft_session_completions`) | **Set union, keep-earliest on conflict.** Every session the guest completed that the account had NOT yet completed is transferred as-is (same `completed_at`, same `xp_awarded`). If BOTH the guest and the account already completed the same `session_id` (only possible if the account made independent progress before this conversion), the earlier `completed_at` timestamp is kept as the account's row of record; the later, now-redundant one is recorded in the conversion's `sessions_merged_duplicate` count and its underlying audit row is preserved (never deleted) for traceability, but does not create a second completion. | A session is either done or not — there is no partial-completion state to merge, so the two real, honest options are "keep both" (impossible, the `UNIQUE(guest_reference, session_id)` constraint forbids two rows for one identity+session) or "keep one." Keeping the earliest preserves the true first-completion timestamp rather than fabricating a merged one. |
| **XP total** (`smokecraft_player_state.xp_total`) | **Recomputed, never summed.** After transfer, the account's `xp_total` is recalculated as the sum of `xp_awarded` across the account's own (now-merged) `smokecraft_session_completions` rows plus any `xp`-type rows in `smokecraft_awards`. It is never `guest.xp + account.xp` added blindly. | Blind addition would double-count XP for any session both identities had independently completed (impossible per the completions rule above, but XP could also come from `xp`-type awards outside the completions table) — a recomputed sum from the merged, deduplicated source-of-truth rows is always correct by construction, never inflated. |
| **Badges / Passport stamps** (`smokecraft_awards`) | **Set union by `(award_type, award_key)`.** Every badge/stamp the guest earned that the account doesn't already have is transferred. A badge/stamp already present on the account (same type+key) is left as-is; the guest's duplicate is counted in `awards_merged_duplicate`, never creating a second row (the existing `UNIQUE(guest_reference, award_type, award_key)` constraint already guarantees this mechanically). | Badges/stamps are boolean "earned or not" facts — set union is the only meaning-preserving merge; there is nothing to compare timestamps or values on. |
| **Award/session audit trail** (`smokecraft_award_audit`) | **Append-only, never merged or deleted.** The guest's full audit history remains exactly as recorded, with new `conversion` audit rows added for the transfer itself. Nothing from before the conversion is rewritten. | The audit trail's entire purpose is an immutable historical record; merging or editing it would defeat that purpose. |
| **Journey content snapshot** (`smokecraft_player_state.journey_snapshot` — tasting notes, quiz answers, mentor pick, pairing selections, Golden Box draft state, etc.) | **Server-authoritative value wins, by `journey_version`.** If the account has no prior `journey_snapshot` (version 0, the common case — most accounts are created specifically to save THIS guest's progress), the guest's snapshot is adopted wholesale (`journey_merge_outcome = 'guest_snapshot_used'`). If the account already has a prior snapshot with `journey_version > 0` (the account was used independently before this conversion), the **account's own snapshot wins** and the guest's snapshot is discarded, recorded honestly as `journey_merge_outcome = 'account_snapshot_used'` in the conversion audit row — never silently dropped without a record of the decision. | Per-field content merging (should "which mentor was picked" merge field-by-field between two genuinely different sessions?) has no meaningful deterministic answer for free-text/single-choice fields — the mandate requires a **deterministic** rule, not a best-effort content blend. Treating the authenticated account's own already-server-recorded state as authoritative (rather than an anonymous guest cookie's) is the safer, more conservative default: it never lets an anonymous browser session silently overwrite a signed-in account's own recorded choices. This is disclosed as a real trade-off, not hidden — see Known Trade-offs below. |
| **Resume location** (`resumeRoute`/`resumeScreenId`, inside the journey snapshot) | Follows the journey-snapshot rule above (it's part of the same blob). | Same reasoning — it's derived/cache data, not an independent field. |
| **Selected venue / selected mentor / preferences** (inside the journey snapshot today) | Follows the journey-snapshot rule above. | Same reasoning. |

## Known trade-offs (disclosed, not hidden)

- **The journey-snapshot rule is coarse-grained (whole-blob), not
  per-field.** A guest who made real, valuable tasting notes on a guest
  session, then converted into an account that happens to already have
  an (older, less complete) snapshot from a prior independent session,
  will have their guest-session notes discarded in favor of the
  account's. This is the one scenario in this policy where "never
  silently discard valid progress" is in tension with "deterministic,
  no silent overwrite of newer state" — the chosen resolution favors
  protecting the authenticated account's own already-recorded state over
  an anonymous guest cookie's, and records the discarded outcome
  explicitly in the conversion audit row (`journey_merge_outcome`) so it
  is at minimum visible and traceable, not silently lost without a
  trace. A future pass could offer the guest an explicit choice
  ("keep this browser's notes or your account's saved notes?") before
  finalizing conversion — not built this pass; see the Holistic Fix 5
  handoff.
- **Awards/completions are the common, most-likely-to-collide case in
  practice** (a returning guest converting for the first time — the
  account has NO prior state) and are merged with full fidelity (true
  set union, no data loss). The journey-snapshot coarse-grained
  trade-off above only matters in the rarer case of an account with
  genuinely independent prior state.

## Idempotency guarantee

Every category above is applied inside one atomic database transaction,
guarded by `smokecraft_guest_conversions`'s `UNIQUE(guest_reference)`
constraint — a given guest identity can be converted at most once, ever,
across any number of retried/duplicated/concurrent requests. A repeat
request (same or different idempotency key) for an already-converted
guest returns the original conversion's result, never re-applies the
merge, never double-transfers, never double-awards.
