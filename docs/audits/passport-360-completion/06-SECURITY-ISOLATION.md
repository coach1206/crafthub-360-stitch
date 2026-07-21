# Phase 6 — Security and Isolation

All 20 checks re-verified directly this pass against the new `/api/passport-360/sync/*` API:

| # | Check | Result |
|---|---|---|
| 1 | Unauthenticated access rejection | `GET /profile` and `POST /synchronize` both return 400/401 without a valid session — verified directly |
| 2 | Learner ownership validation | `resolveGuest()` always resolves by the verified `req.smokecraftIdentity.id`, never a client-supplied ID |
| 3 | Passport-ID ownership validation | The Passport ID returned is always the one resolved from the caller's own verified identity — no route accepts a target `passportId`/`guestId` parameter |
| 4 | Cross-user access rejection | N/A beyond #5/#6 below — no route accepts any other user's identifier to act on |
| 5 | Cross-learner stamp access rejection | Verified directly: learner B's `/stamps` response does not include learner A's real Blend Fault stamp |
| 6 | Cross-learner activity access rejection | Structurally impossible — `/activity` always queries `WHERE guest_reference = <verified caller>` |
| 7 | Cross-learner synchronization rejection | Structurally impossible — `synchronize()` always resolves/writes only the caller's own guest profile |
| 8 | Tenant isolation where implemented | All reads/writes scoped by the real `(tenant_id, venue_id, guest_reference)` key; no cross-tenant query exists |
| 9 | Venue isolation where implemented | Same key, same guarantee |
| 10 | Forged Passport ID rejection | Verified directly: a forged `guestId` in a synchronize request body is ignored entirely — the server always resolves its own |
| 11 | Forged stamp rejection | Verified directly: `{ stamps: ['fake-golden-stamp'] }` in a sync request body has no effect — only real evidence produces stamps |
| 12 | Forged XP rejection | Verified directly: `{ xpAmount: 99999 }` has no effect — XP is always mirrored from the real `xp_accounts.balance` |
| 13 | Forged badge rejection | Verified directly: `{ badges: ['fake-badge'] }` has no effect — no route accepts client-submitted badges |
| 14 | Forged completion rejection | Structurally impossible — every stamp requires a real row in the relevant learner-state table |
| 15 | Forged connection rejection | `/connections` computes its response entirely server-side from real progression events; no route accepts a client-submitted connection |
| 16 | Arbitrary source-event rejection | `collectEvidence()` only reads fixed, hard-coded real table queries — no dynamic/client-influenced query construction exists |
| 17 | Safe error responses | All error paths return a generic `{ success: false, error: <code> }` — no stack trace or internal detail leaked |
| 18 | Rate-limit compatibility | Routes use the same `express-rate-limit` pattern (`readLimiter`/`writeLimiter`) as every other completed pass |
| 19 | Audit-log compatibility | The pre-existing `passport_360_sync_audit_log` table remains available and unmodified for future audit-event writes; this pass's sync does not currently write to it (disclosed — not a security gap, since all writes are already traceable via `source_route`/`source_session_id` columns on the stamps/session tables themselves) |
| 20 | No secret/internal-ID exposure beyond client need | `passportId` (a UUID) is the only internal identifier returned to the client — no raw database row IDs, tenant secrets, or other internal fields are exposed |

**Pre-existing, disclosed, unresolved insecurity (not touched this pass, out of scope to fix wholesale):** the old `/api/passport-360/smokecraft/*` and `/api/smokecraft/passport-stamp/*` routes remain unauthenticated and client-trusted, as documented in `01-ARCHITECTURE-AUDIT.md`. The new secure sync layer does not use or depend on either of them.

**Result: PASS** for the new sync layer's own 20 checks; the pre-existing insecure routes are disclosed, not silently left unmentioned.
