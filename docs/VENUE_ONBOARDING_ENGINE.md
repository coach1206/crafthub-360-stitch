# Venue Onboarding Engine

## Overview

Venue onboarding is the control layer that decides which commerce features a venue can safely use.

Before a venue can accept orders, process payments, display partner specials, or push items to a POS provider, the onboarding engine must confirm that the required configuration is in place. Every feature gate flows through this layer.

## Architecture

### Services

| Service | Responsibility |
|---|---|
| `venueOnboardingEngine.js` | Venue profiles, onboarding status, readiness scoring, audit logs |
| `venueSettingsService.js` | Operating settings, POS preferences, partner specials settings, staff policy |
| `venuePartnerSpecialsLifecycleService.js` | 30-day trial, activation, cancellation, expiry |
| `venueStaffPolicyEngine.js` | Role-based permissions for creating, publishing, approving specials |
| `venueReadinessAggregator.js` | Aggregates all readiness checks into a single venue readiness report |

### Endpoints

All routes are mounted at `/api/onboarding/venues/:venueId`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/venues` | Create venue profile |
| GET | `/venues/:venueId` | Get venue profile |
| PATCH | `/venues/:venueId` | Update venue profile |
| GET | `/venues/:venueId/status` | Get onboarding status |
| GET | `/venues/:venueId/readiness` | Get readiness score (0–100) |
| GET | `/venues/:venueId/readiness/full` | Full readiness report |
| GET | `/venues/:venueId/readiness/warnings` | Readiness warnings |
| GET | `/venues/:venueId/steps` | Required onboarding steps |
| POST | `/venues/:venueId/steps/complete` | Mark a step complete |
| GET | `/venues/:venueId/operating-mode` | Current operating mode |
| GET | `/venues/:venueId/commerce-readiness` | Commerce feature availability |
| GET | `/venues/:venueId/feature-matrix` | Full feature flag matrix |
| GET | `/venues/:venueId/settings/operating` | Operating settings |
| PATCH | `/venues/:venueId/settings/operating` | Update operating settings |
| GET | `/venues/:venueId/settings/pos` | POS preferences |
| PATCH | `/venues/:venueId/settings/pos` | Update POS preferences |
| GET | `/venues/:venueId/partner-specials/settings` | Partner specials settings |
| POST | `/venues/:venueId/partner-specials/trial` | Start 30-day trial |
| POST | `/venues/:venueId/partner-specials/cancel-request` | Request cancellation |
| POST | `/venues/:venueId/partner-specials/cancel` | Cancel immediately |
| GET | `/venues/:venueId/partner-specials/can-display` | Can venue show partner specials? |
| GET | `/venues/:venueId/partner-specials/can-accept-orders` | Can venue accept partner orders? |
| GET | `/venues/:venueId/staff-policy` | Staff approval policy |
| PATCH | `/venues/:venueId/staff-policy` | Update staff policy |
| POST | `/venues/:venueId/staff-policy/validate` | Validate a staff action |
| POST | `/venues/:venueId/audit-log` | Write onboarding audit entry |

## Readiness Scoring

| Check | Points |
|---|---|
| Venue profile created | 15 |
| Manual POS360 available (always) | 20 |
| Staff policy configured | 15 |
| Partner specials opted in | 10 |
| Payment onboarding complete | 20 |
| Tax profile configured | 10 |
| POS provider selected | 10 |
| **Max score** | **100** |

A new venue starts at 20/100 because manual_pos360 is always available as the default operating mode.

## Partner Specials Lifecycle

```
partner_specials_disabled
  → [enablePartnerSpecialsTrial] → partner_specials_trial_active (30 days)
      → [expirePartnerSpecialsTrial] → expired
      → [requestCancellation] → cancellation_pending
          → [cancelPartnerSpecials] → cancelled
      → [activatePartnerSpecialsRenewing] → partner_specials_active
          → [requestCancellation] → cancellation_pending
              → [cancelPartnerSpecials] → cancelled
```

## Staff Permissions

Default policy (safe by default):

| Role | Can Create | Can Publish | Can Approve | Requires Approval |
|---|---|---|---|---|
| owner | yes | yes | yes | no |
| admin | yes | yes | yes | no |
| manager | yes | yes | yes | no |
| bartender | yes (suggest) | no | no | yes |
| cook | yes (suggest) | no | no | yes |
| server | yes (suggest) | no | no | yes |

## Storage Mode

Every response includes `storageMode`:
- `postgres` — data written to PostgreSQL (persisted)
- `memory_fallback` — data stored in-process memory only (not persisted across restarts)

When `storageMode` is `memory_fallback`, responses also include:
- `persistenceStatus: 'preview_fallback'`
- `message: '<context>. Not persisted — database unavailable.'`

## Database

Migration: `server/db/migrations/020_venue_onboarding_engine.sql`

Tables: `venue_profiles`, `venue_onboarding_status`, `venue_operating_settings`, `venue_pos_preferences`, `venue_partner_specials_settings`, `venue_staff_policy_settings`, `venue_onboarding_audit_logs`

## Honest Status Vocabulary

This engine never uses fabricated status values. All statuses are one of the defined values in the migration CHECK constraints. No feature is reported as "active" or "ready" until it is genuinely configured.

`overall_status` can be: `onboarding_required | onboarding_in_progress | onboarding_complete | paused | blocked | demo_only`

`partner_specials_status` can be: `partner_specials_disabled | partner_specials_trial_active | cancellation_pending | partner_specials_active | cancelled | expired | blocked`
