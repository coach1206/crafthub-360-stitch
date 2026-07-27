-- Holistic Fix 4 correction (found via live duplicate-request testing):
-- migration 092 made idempotency_key globally UNIQUE across
-- smokecraft_session_completions and smokecraft_awards. A client that
-- generates a weak/fallback idempotency key (confirmed live: guestId
-- was null for a guest who hadn't been through the Passport entry flow,
-- so the client fell back to a literal "unknown-guest::..." key) could
-- collide with a DIFFERENT real guest's completion using the same
-- fallback key — the second guest's legitimate request would then be
-- misidentified as a duplicate of the first guest's row and silently
-- report alreadyCompleted:true without ever recording that guest's own
-- completion. Idempotency keys are only ever meaningful scoped to their
-- issuing guest, not globally, so the constraint is corrected to match.
--
-- Safe: no data loss. Existing rows are already unique per
-- (guest_reference, session_id) / (guest_reference, award_type,
-- award_key), which remains enforced unchanged.

ALTER TABLE smokecraft_session_completions
  DROP CONSTRAINT IF EXISTS smokecraft_session_completions_idempotency_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ssc_guest_idempotency_key
  ON smokecraft_session_completions(guest_reference, idempotency_key);

ALTER TABLE smokecraft_awards
  DROP CONSTRAINT IF EXISTS smokecraft_awards_idempotency_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_sa_guest_idempotency_key
  ON smokecraft_awards(guest_reference, idempotency_key);
