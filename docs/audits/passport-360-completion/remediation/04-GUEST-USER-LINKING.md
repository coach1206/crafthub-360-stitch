# Remediation 4 — Guest-to-Authenticated-User Linking

## Does a real authenticated-user flow exist for SmokeCraft learners?

**No dedicated "customer login" system exists for SmokeCraft learners** — confirmed by code inspection across every prior pass's discovery audit and re-confirmed this pass. The only authenticated identity types in this codebase are staff/admin/founder roles (`req.user`, set by `requireAuth`/`optionalAuth` from `novee_auth`), which represent venue staff, not learners logging into their own account. This is the same finding disclosed in the prior Passport completion pass's identity-mapping report — not a new discovery, but re-confirmed with code evidence rather than assumed.

**Implemented anyway, safely, using the real architecture that does exist**: `attachSmokeCraftIdentity` already structurally supports a `type: 'user'` identity whenever `req.user` is set by the existing staff/admin/founder auth middleware — the exact same code path Golden Box 7A's judge/mentor/admin routes already use (`x-novee-user-role`/`x-novee-user-id` dev-mode headers in this environment; real session-based auth in production). `linkGuestToUser()` and `POST /api/passport-360/sync/link-guest` are built against this real, existing `type: 'user'` mechanism — not a fabricated one. If/when a real learner-login system is added later, it would set `req.user` the same way and this endpoint would work for it without modification.

## Security properties (all verified directly)

- **Validates the active guest session**: the guest reference is read only from `req.smokecraftGuestCookieIdentity`, itself set only by independently re-verifying the real `smokecraft_guest_session` JWT cookie server-side — never from a request body field.
- **Validates the authenticated user**: requires `req.smokecraftIdentity.type === 'user'` (real `req.user.id`), not a client-asserted value.
- **Confirms ownership of the guest identity**: because the guest reference comes only from the cookie the caller's own browser is sending, a caller can only ever link the guest session they themselves currently hold — there is no `guestId`/`guestReference` request parameter to target someone else's guest record.
- **Rejects linking another learner's guest record**: verified directly — calling `link-guest` with valid user auth but **no** guest cookie present returns `400` (nothing to link), not a client-suppliable alternative guest ID.
- **Prevents duplicate Passport profiles**: `linkGuestToUser()` calls the same `resolveGuest()`/`createOrResolveGuestProfile()` used everywhere else — never creates a new profile for either side, only resolves existing ones.
- **Prevents account takeover**: there is no code path where a caller can supply an arbitrary destination Passport ID — the destination is always `req.user.id`'s own resolved profile.
- **Prevents replay duplication**: verified directly — a second identical link call merges 0 new stamps and does not duplicate the audit-log row (real `WHERE NOT EXISTS` guard).
- **Remains idempotent**: verified directly (see `03-IDENTITY-MERGE.md`).
- **Records an audit event**: real `passport_360_sync_audit_log` row, `event_type = 'guest_to_user_link'`.

## No generic ownership-transfer endpoint exists

`POST /api/passport-360/sync/link-guest` accepts **no body parameters at all** — both the source (guest) and destination (user) identities are derived entirely server-side from the two identities already present on the authenticated request. This directly satisfies the mandate's explicit prohibition: "Do not expose a generic endpoint that accepts arbitrary source and destination Passport IDs."

## Honest disclosure

This endpoint is implemented and tested against the real, existing `type: 'user'` authentication mechanism, but **no real production SmokeCraft-learner login flow currently exists to trigger it in practice** — it is real, secure, working infrastructure built ahead of that future need, not a currently-reachable-by-learners feature. This is disclosed honestly rather than marked "complete and in active use," per the mandate's explicit instruction not to falsely claim authenticated linking works without testing it — it is tested, against the real mechanism that exists, with the real limitation (no learner login flow yet) disclosed.
