# SmokeCraft Venue Administrator Guide

**Version:** MVP2 · **Audience:** Venue administrators (role: `admin`)

---

## Admin Capabilities

Venue administrators have all manager capabilities plus:
- Reset the investor demo (restore all demo defaults)
- Configure third-party integrations (POS360, E.A.T., Humidor)
- Access the feature flag admin panel (venue-scoped flags only)
- View audit logs

## Feature Flag Administration (Venue-Scoped)

Navigate to `/smokecraft/feature-flag-admin` to toggle venue-scoped flags:

| Flag | Default | Description |
|------|---------|-------------|
| `smokecraft.rewards.enabled` | true | Enable rewards / XP for this venue |
| `smokecraft.passport.enabled` | true | Enable passport stamps at this venue |
| `smokecraft.whiteLabel.enabled` | false | Enable white-label mode (removes NOVEE branding) |

**Important:** All changes require a written reason. Changes are recorded in the audit log with your actor ID and timestamp. Venue admins cannot toggle platform-level flags.

## Resetting the Investor Demo

After an investor or press demonstration:
1. Navigate to **Admin** → **Demo Controls**.
2. Tap **Reset Demo Defaults**.
3. All demo-mode guest sessions are cleared.
4. The action is recorded in the audit log.

This does NOT affect real guest progress. Only demo-mode sessions are reset.

## Integration Configuration

Navigate to **Admin** → **Integrations** to configure:

### POS360
- Enter the POS360 venue API key
- Set the table mapping (table ID → POS360 station)
- Test the connection before enabling live orders

Status will show **Not configured** until credentials are entered and verified.

### E.A.T.
- Enter the E.A.T. sync endpoint and auth token
- Set sync interval (default: every 15 minutes)
- Enable live sync toggle

Status will show **Pending sync** until the first successful sync completes.

### Humidor
- Connect a Bluetooth-enabled humidor monitor (device ID required)
- Set alerting thresholds for temperature and humidity

Status will show **Not configured** until a device ID is registered.

**All integration statuses use verified evidence.** You will never see **Connected** or **Synced** unless the system has a confirmed provider response or persisted record.

## Audit Log

The audit log records all changes made by admin and founder roles:
- Feature flag changes (key, old value, new value, reason, actor, timestamp)
- Demo resets
- Integration configuration changes
- Role-level access events

Audit log is available at `/api/audit` (authenticated).
