# Staff Age-Verification UI

**Route:** `/smokecraft/staff/compliance/age-verification?orderId=&venueId=`
**File:** `src/pages/smokecraft/compliance/staff/StaffAgeVerification.jsx`

## Real backend wiring

`POST /api/compliance/age-verification` with `{subjectType, subjectId,
jurisdictionCode, method: 'staff_verified', staffApproved}`. The server
(unmodified Package 6 controller logic) requires an authenticated
staff-role actor (`ROLE_LEVELS.staff` or above, excluding the dev
prototype-guest fallback) — an anonymous or non-staff caller gets
`401 staff_actor_required`, verified in regression section 8:

```
── 8. Staff-assisted verification (real staff actor) ──
  PASS  Staff-recorded denial is stored honestly
  PASS  Staff-recorded approval succeeds and records a staff actor id
  PASS  An anonymous guest cannot self-issue a staff_verified record
```

## Fields present

Order association, venue association, customer subject id, jurisdiction
code, approve/deny with a reason field on deny, and the resulting
record's real `expires_at` and `staff_actor_id` (server-populated from
`req.user.id`, never client-submitted).

## Legal-responsibility framing

Persistent banner: "Verification is a legal responsibility, not
optional." — matches mandate section 8.

## Scope discipline

No government-ID image capture/storage field exists in this screen or
its API payload — explicitly out of scope per the mandate, matching
Package 6's own established boundary.
