# SmokeCraft Platform Administrator Guide

**Version:** MVP2 · **Audience:** Platform administrators / founders (role: `founder_level_0`)

---

## Founder Capabilities

Founders have full access to all SmokeCraft capabilities:
- All venue admin capabilities
- Manage all feature flags (including platform-level)
- Create and assign release tags
- Access all error logs across venues
- Manage roles and permissions

## Feature Flag Administration (All Flags)

Navigate to `/smokecraft/feature-flag-admin` as a founder to manage all 12 flags:

| Flag | Default | Scope | Description |
|------|---------|-------|-------------|
| `smokecraft.enabled` | true | platform | Master SmokeCraft module toggle |
| `smokecraft.demoMode.enabled` | false | platform | Allow demo mode system-wide |
| `smokecraft.passport.enabled` | true | venue | Passport stamp integration |
| `smokecraft.rewards.enabled` | true | venue | XP and rewards |
| `smokecraft.leaderboard.enabled` | true | platform | Public leaderboard |
| `smokecraft.eventChallenge.enabled` | false | platform | Event challenge overlays |
| `smokecraft.pairingLab.enabled` | true | platform | Pairing lab session |
| `smokecraft.flavorMemory.enabled` | true | platform | Flavor memory session |
| `smokecraft.billing.enabled` | false | platform | Live billing integration |
| `smokecraft.marketplaceListing.enabled` | false | platform | Marketplace listing (mutually exclusive with billing) |
| `smokecraft.whiteLabel.enabled` | false | venue | White-label mode |
| `smokecraft.analytics.enabled` | true | platform | Analytics event tracking |

**Mutually exclusive pairs:**
- `smokecraft.billing.enabled` and `smokecraft.marketplaceListing.enabled` cannot both be true. The system enforces this at the UI and will refuse to enable one if the other is active.

## Managing Roles

Founders can grant, modify, or revoke roles via the Role Management console (`/admin` → **Role Management**). Role changes are logged in the audit trail.

Never grant `founder_level_0` to venue staff. Use `admin` for venue administrators and `manager` for shift managers.

## Release Tags

A release tag marks a version of SmokeCraft as production-ready. Tags are created by founders after completing a full verification pass.

**Format:** `smokecraft-vX.Y.Z-YYYYMMDD`

The R25 release tag for MVP2 (`smokecraft-v2.0.0-mvp2`) is not yet created. It will be created after founder sign-off.

Do NOT create or push the release tag until the founder approval checkpoint is complete.

## Emergency Actions

- **Emergency system lock:** Immediately disables all guest-facing SmokeCraft routes. Available at `/admin` → **Emergency Lock**.
- **Founder override:** Forces a specific flag or configuration value regardless of validation. Use only under explicit incident response.

All emergency actions are logged with full context.
