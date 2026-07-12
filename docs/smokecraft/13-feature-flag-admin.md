# SmokeCraft Feature Flag Administration Guide

**Version:** MVP2 · **Audience:** Founders and platform administrators

---

## Overview

The Feature Flag Administration panel (`/smokecraft/feature-flag-admin`) provides controlled toggling of SmokeCraft's 12 feature flags with full audit trail. All changes require a written reason before applying.

## Access Requirements

| Role | Access Level |
|------|-------------|
| `guest`, `staff`, `manager` | No access |
| `admin` | Venue-scoped flags only |
| `founder_level_0` | All flags |

## The 12 Feature Flags

See the Platform Admin Guide (doc 05) for the full flag table.

## Making a Change

1. Navigate to `/smokecraft/feature-flag-admin` (admin login required).
2. Find the flag to change in the flag list.
3. Click **Enable** or **Disable**.
4. If a mutually exclusive conflict exists, you will see a conflict error — resolve it first.
5. A confirmation dialog appears showing: current value → new value.
6. Enter a reason for the change (required — the Confirm button is disabled until a reason is written).
7. Click **Confirm**.

The change takes effect immediately for new sessions. Active sessions on the current screen are not affected until they advance.

## Mutually Exclusive Pairs

The following flag pairs cannot both be true simultaneously:
- `smokecraft.billing.enabled` and `smokecraft.marketplaceListing.enabled`

Attempting to enable one while the other is active will produce a conflict error. Disable the active flag first, then enable the desired one.

## Rollback

Each change in the Audit Log has a **Rollback** button. Clicking it:
1. Proposes restoring the flag to the value it had before that change.
2. Opens the confirmation dialog.
3. Requires a reason (e.g., "Rolling back due to conflict with marketplace listing").

Rollback creates a new audit log entry — it does not delete the previous one.

## Audit Log

The audit log is visible in the bottom section of the feature flag admin panel. It records:
- Flag key changed
- Old value → new value
- Actor (role)
- Timestamp
- Reason provided

The audit log is in-memory per session. For persistent audit records, see the platform audit log at `/api/audit`.

## Venue-Scoped vs Platform-Scoped

Venue-scoped flags (marked with a "venue-scoped" badge) can be toggled by venue admins. Platform-scoped flags require founder access.

Venue admins see all flags in the list but can only interact with the three venue-scoped flags. Other flags show "founder access required" and their toggle buttons are hidden.

## Emergency Rollback to Defaults

If the feature flag admin UI is inaccessible:
1. Restart the server — flags reset to defaults on restart (in-memory storage).
2. Or use the API directly (see Rollback & Recovery Guide, doc 10).
