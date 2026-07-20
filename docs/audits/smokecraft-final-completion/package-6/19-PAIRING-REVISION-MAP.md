# Package 6 Closure — Pairing Draft Revision Map

## Schema

New table `smokecraft_pairing_draft_revisions` (migration 083):
append-only, `UNIQUE(draft_id, revision_number)`, stores a full JSON
snapshot per revision. `smokecraft_pairing_drafts` (migration 082) gained
a `current_revision INTEGER NOT NULL DEFAULT 1` column and always
reflects the *latest* revision's values — the "live" row.

**Every save writes a snapshot**, including the very first one — a real
gap found and fixed during this closure pass: the original
`savePairingDraft` only wrote the live row, so a draft revised exactly
once would have only 1 explicit history row (the revision) with the
original creation state unrecoverable. Fixed by having
`savePairingDraft` also insert a `revision_number = 1` snapshot
immediately on creation. Verified: after one `reviseDraft` call, exactly
2 rows exist in `smokecraft_pairing_draft_revisions` (revision 1 = the
original, revision 2 = the revision), both independently readable.

## API

- `POST /api/smokecraft/flavor-pairing/pairing-drafts/:id/revise` —
  ownership-checked (`WHERE id = $1 AND guest_reference = $2`, returns
  `draft_not_found` for both "doesn't exist" and "not yours" — no
  information leak about other guests' draft ids), increments
  `current_revision`, writes a new immutable snapshot, updates the live
  row.
- `GET /api/smokecraft/flavor-pairing/pairing-drafts/:id/revisions` —
  same ownership check, returns the full ordered history.

## Frontend

`PairingBuilder` in `Vitola.jsx`: each saved draft now shows its
`current_revision` number and last-saved time, plus **Revise** (loads the
draft into the form, save creates a new revision, form clearly labeled
"Revising a saved draft") and **View History** (expands an inline list of
every past revision's category/item and timestamp) buttons. Cancel
returns to a blank new-draft form without altering the draft.

## XP

Revising **never** re-awards `pairing_draft_saved` XP — the reward is
tied to the draft's *creation* (idempotency key
`pairing-draft-first-save:<guest>`), and `reviseDraft` never calls
`awardXp` at all. Verified by test: after one create + one revise, only 1
XP transaction exists.

## Ownership / security

Verified by test: a second guest identity attempting `POST .../:id/revise`
or `GET .../:id/revisions` on the first guest's draft id receives
`draft_not_found` (403-equivalent honest denial, not a 500 or data leak).
All queries are parameterized; no raw SQL string interpolation.
