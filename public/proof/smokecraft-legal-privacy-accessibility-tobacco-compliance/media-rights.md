# Media Rights (Package 1 re-verification + expiration/takedown addition)

Re-verified Package 1's venue humidor media management: public media endpoints do not expose private rights documents (confirmed unchanged — rights metadata lives server-side, public routes return only display assets).

This package adds `media_rights_review` (migration 117): `rights_status` (`active`/`expiring_soon`/`expired`/`takedown_requested`/`retired`), `rights_expiration`, `review_due_date`, and a real, working takedown request flow: `POST /api/compliance/media-rights/takedown` (manager+ RBAC) — tested live, sets `rights_status='takedown_requested'`, records requester/reason/timestamp, and fires a `media_rights_action` audit event (see regression-results.md). This was a genuine gap (no takedown mechanism previously existed) and is now real, working code, not documentation-only.

Attribution requirements are documented per the existing manufacturer/distributor media agreements from Package 1; this package does not alter attribution display logic.
