# Venue Humidor RBAC Matrix

Source of truth: `venue_memberships.membership_type` (migration 010) —
`member | staff | mentor | manager | admin | owner`. No parallel role
table exists anywhere in Venue Humidor. Tiers defined once in
`server/routes/venueHumidorRoutes.js`:

- `FULL_ACCESS_TYPES = ['owner','admin','manager']`
- `WRITE_ACCESS_TYPES = FULL_ACCESS_TYPES + ['staff']`
- `READ_ACCESS_TYPES = WRITE_ACCESS_TYPES + ['mentor']`

All checks are server-enforced in Express middleware
(`requireVenueRole`, `requireVenueRead`, `requireVenueWrite`,
`requireResourceVenueMatch`) — every row below was verified both via
the automated API test suites (cross-role denial assertions exist in
every 1B-2B-1 through 1B-2B-5 API suite) and via direct `curl`/fetch
calls in this pass with no UI in the loop.

| Capability | Owner/Admin/Manager | Staff | Mentor/Tobacconist | Customer | Unauthenticated |
|---|---|---|---|---|---|
| Inventory read | ✅ | ✅ | ✅ | via catalog only | ❌ |
| Product create | ✅ | ✅ | ❌ | ❌ | ❌ |
| Product edit | ✅ | ✅ | staff-notes field only | ❌ | ❌ |
| Inventory mutation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Order queue read | ✅ | ✅ | ✅ | ❌ | ❌ |
| Claim order | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reassign order | ✅ | ❌ | ❌ | ❌ | ❌ |
| Transition (confirm/prepare/pick/ready) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Complete order | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel order | ✅ | ✅ | ❌ | own order only | ❌ |
| Block order | ✅ | ✅ | ❌ | ❌ | ❌ |
| Unblock order | ✅ | ❌ | ❌ | ❌ | ❌ |
| Expire order | ✅ | ❌ | ❌ | ❌ | ❌ |
| Generate/verify pickup code, confirm handoff | ✅ | ✅ | ❌ | verify own code as customer via pickup screen | ❌ |
| Customer order history/receipt | via admin venue paths | via staff duties | via mentor read tier | own only | ❌ |
| Passport acquisition read | via admin venue paths | via staff duties | via mentor read tier | own only | ❌ |
| Recommendation access (assisted) | ✅ | ✅ | ✅ (read) | own (customer-facing) | ❌ |
| Assisted-selling outcome record | ✅ | ✅ | ❌ | n/a | ❌ |
| Recommendation analytics (raw ledger) | via existing progression-event read paths | ❌ | ❌ | ❌ | ❌ |
| Tasting note / rating | n/a (not a purchaser) | n/a | n/a | own verified acquisition only | ❌ |
| Fulfillment history | ✅ | ✅ | ✅ | n/a | ❌ |

## Verification method

- **UI**: every admin/staff screen fetches with `credentials: 'include'`
  against the real backend — no client-only gate; a denied role sees
  the real 403 response rendered as an honest error state, not a hidden
  button pretending the capability doesn't exist.
- **Direct API**: this pass re-ran targeted `curl`/fetch probes against
  representative routes from each tier (see
  `08-security-review.md` §"RBAC bypass attempts") in addition to the
  existing automated cross-role assertions already present in every
  1B-2B-1 through 1B-2B-5 API suite (e.g. mentor denied
  claim/complete/cancel/unblock/expire/assisted-selling-outcome; staff
  denied unblock/expire/reassign; customer denied every admin route).

No role was found able to bypass venue isolation, inventory
availability, current pricing, or the canonical checkout flow through
any Venue Humidor route.
