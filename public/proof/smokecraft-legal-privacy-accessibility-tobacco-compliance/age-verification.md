# Age/Identity Verification Tiers

| Tier | Method value | Who can submit | Data collected |
|---|---|---|---|
| Educational browsing | `self_attestation` (no birthdate) | Anonymous/guest | boolean + timestamp only |
| Purchase-track self-attestation | `self_attestation` + `declaredBirthdate` | Anonymous/guest | declared birthdate, computed age |
| Staff-assisted | `staff_verified` | Authenticated staff (role >= staff) | staff_actor_id, result, timestamp |
| In-person fulfillment | `in_person_fulfillment` | Authenticated staff at handoff | staff_actor_id, result, timestamp |
| Third-party provider (adapter shape only) | `provider_adapter` | Any caller, `providerResult` field | `provider_ref` opaque reference |

No live third-party age-verification provider exists in this sandbox — `provider_adapter` is an **adapter shape only** (accepts a `providerResult` + `providerRef`, stores them, does not call out to any real vendor). Wiring a real provider is future work, tracked in `counsel-review-items.md` and `known-limitations.md`.

Every record captures: method, result, timestamp (`verified_at`), jurisdiction, provider reference where applicable, staff actor where applicable, expiration/reverification date (`expires_at`), and produces a `compliance_audit_events` row.

**Explicitly out of scope for this pass** (per mandate): storing full government-ID images. No such storage exists anywhere in `age_verification_records` or elsewhere in this migration.
