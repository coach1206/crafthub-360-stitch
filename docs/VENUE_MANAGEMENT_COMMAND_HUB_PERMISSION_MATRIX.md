# Venue Management Command Hub — Permission Matrix

| Role (venue_memberships.membership_type) | Base access via requireVenueMembership | Approve/Publish (requireVenuePermission) |
|---|---|---|
| owner/manager/admin | Allowed | Only if `venue_permissions` grants `venue_management.content.approve`/`.content.publish` for that role at that venue |
| staff/member/mentor | Denied (not in MANAGER_TYPES) | N/A |
| platform admin (`req.user.role IN ('admin','founder_level_0')`) | Allowed (bypass) | Allowed (bypass) |
| guest / unauthenticated | Denied (401/403) | N/A |

Cross-venue: every request's `venue_memberships` lookup is scoped to the
specific `venueId` in the path — a manager active at Venue A has zero
access to Venue B (live-verified, test #9, #19, #20).

**Note**: the extended role vocabulary proposed in Package 6A
(`content_manager`, `promotions_manager`, etc., in
`venueManagementRoles.js`) is not yet storable in
`venue_memberships.membership_type` — that column's CHECK constraint
only allows `member/staff/mentor/manager/admin/owner`. Package 6B built
fine-grained control via `venue_permissions` permission keys layered on
top of the existing `manager/admin/owner` types instead of widening that
CHECK constraint. Expanding it to first-class extended roles remains a
disclosed Package 6C+ decision, not made this pass.
