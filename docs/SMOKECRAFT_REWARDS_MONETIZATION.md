# SmokeCraft Rewards and Monetization

**Module Build 5 of 9 — SmokeCraft Passport, Loyalty, Rewards, Visit Progression, and Experience Monetization**

---

## Honest Status

| Property | Status |
|---|---|
| XP reward evaluation | Active |
| Loyalty points evaluation | Active |
| Passport stamp eligibility | Active — enforces all lock rules |
| Visit progression rewards | Active |
| Scorecard rewards | Active — blocked if scorecard missing |
| Order rewards | Active — POS-verified spend is preview_only |
| Pairing rewards | Active — provider bonus requires providerConnected |
| Experience monetization | Preview only — no charges created |
| Reward redemption | Not active — no redemption handler |
| POS-verified spend | `posVerified: false` — requires POS360 |
| E.A.T. management sync | `preview_only` — events queued, not dispatched |
| Database persistence | `memory_fallback` without DATABASE_URL |
| Billing | `preview_only` — no billing provider connected |
| Marketplace | `not_live_marketplace` |
| License enforcement | `license_not_enforced` |

---

## Loyalty Model

**File:** `server/services/smokecraft/smokecraftLoyaltyService.js`

Two reward currencies:

| Currency | Source |
|---|---|
| XP | Journey completion events, scorecards, flavor memory, pairing, visits |
| Loyalty Points | Order engagement, pairing participation, staff-assisted sessions, visit completion |

### XP Tiers

| Tier | XP Range |
|---|---|
| Ember | 0–499 |
| Spark | 500–1,499 |
| Flame | 1,500–2,999 |
| Torch | 3,000–5,999 |
| Inferno | 6,000+ |

### XP Events

| Event | XP | POS Required |
|---|---|---|
| Session completed | 50 | No |
| Scorecard submitted | 75 | No |
| Flavor Memory captured | 40 | No |
| Pairing recommendation | 20 | No |
| Pairing accepted in order | 30 | No |
| Customer self-order | 15 | No |
| Staff-assisted order | 20 | No |
| Order completed (verified) | 50 | **Yes** |
| Mentor-guided pairing | 25 | No |
| Passport Stamp earned | 200 | No |
| Experience completed | 500 | No |
| Visit badge earned | 100 | No |

---

## Passport Reward Rules

**File:** `server/services/smokecraft/smokecraftPassportRewardService.js`

Hard rules (cannot be bypassed):

- Passport Stamp requires: scorecard + Flavor Memory + at least 1 session completed in visit
- Visit 8 is protected
- Single-session shortcut is blocked (`one_session_shortcut_blocked`)
- Connections cannot unlock before Passport Stamp is awarded
- Early Passport Stamp is always blocked with explicit `blockedReason`

Blocked reasons:

| Reason | Meaning |
|---|---|
| `scorecard_missing` | Scorecard not submitted |
| `flavor_memory_missing` | Flavor Memory step not completed |
| `visit_not_complete` | Visit sessions not complete |
| `session_not_complete` | Current session not complete |
| `one_session_shortcut_blocked` | Cannot complete in one session |
| `visit_8_locked` | Visit 8 is protected |
| `connections_locked` | Connections require Passport Stamp first |
| `early_passport_stamp` | Attempted to unlock early |
| `early_connections_unlock` | Attempted to unlock Connections early |

---

## Reward Policy

**File:** `server/services/smokecraft/smokecraftRewardPolicyService.js`

All reward evaluations run through policy checks before award:

| Policy | Rule |
|---|---|
| `no_duplicate_reward_for_same_event` | No repeat reward for same source event |
| `no_passport_award_before_eligibility` | Passport Stamp requires all steps |
| `no_connections_unlock_before_rules` | Connections need Passport Stamp |
| `no_pos_verified_reward_without_pos_confirmation` | POS rewards need POS360 |
| `no_redeemed_status_without_redemption_handler` | No fake redemption |
| `no_full_visit_completion_from_single_session` | No one-session completion |
| `no_reward_for_missing_scorecard_when_required` | Scorecard required |
| `no_reward_for_missing_flavor_memory_when_required` | Flavor Memory required |
| `no_live_provider_bonus_without_provider_connection` | Provider bonus needs providerConnected |

---

## Scorecard Reward Rules

Missing scorecard blocks all scorecard-required rewards:

```
rewardStatus: "blocked"
blockedReason: "scorecard_missing"
```

---

## Order Reward Rules

| Order State | Reward | POS Required |
|---|---|---|
| customer_self_order requested | Engagement XP | No |
| staff_assisted_order | Engagement XP + loyalty points | No |
| Pairing recommendation attached | Loyalty points | No |
| Order completed (POS verified) | XP + spend loyalty points | **Yes** |
| Order completed (POS not connected) | preview_only | — |

---

## Pairing Reward Rules

| Event | Reward | Notes |
|---|---|---|
| Recommendation generated | XP | Local or provider |
| Flavor Memory captured | XP | Required step |
| Menu item selected from pairing | Loyalty points + XP | — |
| Mentor-guided pairing | XP | — |
| Allergy-blocked recommendation | None | Blocked |
| Live provider bonus | (reserved) | Requires `providerConnected: true` |

---

## Experience Monetization

**File:** `server/services/smokecraft/smokecraftExperienceMonetizationService.js`

All models are `preview_only`. No billing is active. No charges are created.

| Model | Preview Price |
|---|---|
| Venue Subscription | $149/month |
| Per-Experience Fee | $5/session |
| Premium Pairing Upgrade | $29/month |
| Passport Membership | $19/month |
| Staff-Assisted Service Fee | $15/session |
| Loyalty Sponsor Reward | Sponsor-funded |
| White-Label Venue License | $499/month |
| Data Insights Dashboard | $79/month |

`billingStatus: "preview_only"` · `licenseStatus: "license_not_enforced"` · `marketplaceStatus: "not_live_marketplace"`

---

## Audit Trail

**File:** `server/services/smokecraft/smokecraftRewardAuditService.js`

Every reward evaluation creates an audit entry with:
`auditId`, `rewardId`, `userId`, `venueId`, `eventType`, `sourceEventType`, `previousStatus`, `nextStatus`, `policyChecks`, `blockedReason`, `xpAwarded`, `loyaltyPointsAwarded`, `passportStampAwarded`, `posVerified`

Audit entries do not store secrets or expose private user data.

---

## Degraded Mode

| Condition | Status |
|---|---|
| No DATABASE_URL | `persistenceMode: "memory_fallback"`, `productionReady: false` |
| POS360 not connected | `posVerified: false`, `posSyncStatus: "not_connected"` |
| E.A.T. not connected | `eatSyncStatus: "not_connected"`, `managementSyncStatus: "preview_only"` |
| No billing provider | `billingStatus: "preview_only"` |
| Marketplace not live | `marketplaceStatus: "not_live_marketplace"` |
| License not enforced | `licenseStatus: "license_not_enforced"` |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/modules/smokecraft/rewards/status` | System status |
| GET | `/api/modules/smokecraft/rewards/user/:userId` | User rewards + summary |
| POST | `/api/modules/smokecraft/rewards/evaluate` | Evaluate reward event |
| POST | `/api/modules/smokecraft/rewards/award` | Award XP |
| POST | `/api/modules/smokecraft/rewards/passport/evaluate` | Passport stamp eligibility |
| POST | `/api/modules/smokecraft/rewards/passport/award` | Award passport stamp |
| POST | `/api/modules/smokecraft/rewards/order/evaluate` | Evaluate order rewards |
| POST | `/api/modules/smokecraft/rewards/pairing/evaluate` | Evaluate pairing rewards |
| GET | `/api/modules/smokecraft/rewards/monetization/:venueId` | Venue monetization |
| POST | `/api/modules/smokecraft/rewards/monetization/evaluate` | Evaluate monetization |
| GET | `/api/modules/smokecraft/rewards/audit/:rewardId` | Reward audit trail |

---

## What Is Real Now

- SmokeCraft can evaluate rewards from journey progress, scorecards, orders, pairings, and Flavor Memory
- SmokeCraft can block early Passport Stamp and Connections unlocks with explicit blocked reasons
- SmokeCraft can prevent one-session shortcut rewards
- SmokeCraft can create XP and loyalty reward records with honest status
- SmokeCraft can audit every reward event
- SmokeCraft can preview experience monetization models (no billing active)
- Reward policy service runs before every award
- Allergy-blocked pairing recommendations do not generate positive rewards

---

## What Is Still Fallback / Preview Only

- POS-verified spend rewards are not active — `posVerified: false`, POS360 not connected
- Reward redemption is not active — no redemption handler implemented
- Billing is `preview_only` — no billing provider connected
- Marketplace packaging is not live — `not_live_marketplace`
- License enforcement is not active — `license_not_enforced`
- E.A.T. management sync is `preview_only` — events queued, not dispatched
- Database persistence is `memory_fallback` without `DATABASE_URL`
- Live provider pairing bonus requires `providerConnected: true`

---

## Module Build 6 Preview

**MODULE BUILD 6 OF 9 — SmokeCraft Venue Admin, Staff Operations, Analytics Dashboard, and Management Controls**

Module Build 6 should connect SmokeCraft orders, rewards, pairings, staff queue, venue activity, management sync, and analytics into a venue-facing admin/control layer without weakening customer progression or faking POS/E.A.T. sync.
