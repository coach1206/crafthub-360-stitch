# SmokeCraft Manager Guide

**Version:** MVP2 · **Audience:** Venue managers (role: `manager`)

---

## Manager Capabilities

Managers have all staff capabilities plus:
- View Management Sync dashboard
- Configure venue-level settings
- View error logs
- View and resolve conflict reports
- Activate and deactivate Demo Mode

## Management Sync

The Management Sync dashboard (`/smokecraft/management-sync`) shows:
- Active guest sessions across all tables
- Floor assist request queue
- Recent scorecard submissions
- Session completion rate for the day

Data shown is **demo data** until a live backend sync is configured. The sync status badge reads **Pending sync** or **Not configured** until real API evidence is available. Do not interpret **Pending** as a failure — it is the honest state when no sync has been established.

## Demo Mode

To activate Demo Mode for a single visitor or investor:
1. Log in at manager level.
2. Navigate to **Venue Admin** → **Demo Controls**.
3. Tap **Start Demo Session**.
4. Hand the device to the visitor.

Demo mode expires when the browser tab is closed or the visitor taps **End Demo**.

Demo mode does NOT:
- Reset guest progress for real guests on this device.
- Submit orders to POS360.
- Award passport stamps.

## Error Logs

Navigate to `/smokecraft/error-log` to view recent structured error log entries. You can filter by:
- Level: debug, info, warn, error, critical
- Category: frontend_exception, api_error, contract_rejected, unauthorized_access, etc.

Only the last 500 entries are retained per server session. For persistent logs, contact your platform administrator.

## Conflict Reports

Conflict reports appear when two simultaneous inputs on the same guest session produce inconsistent data. Common causes:
- Guest continues on a second device before the first is closed
- Staff assistant and guest both submit an action at the same time

Resolve conflicts by selecting which submission to keep. The discarded submission is recorded in the audit log.

## Venue Configuration

Navigate to **Venue Admin** → **Configure Venue** to set:
- SmokeCraft display name (shown in header)
- Humidor pairing source (manual or integrated)
- Assist request notification method (sound, badge, or both)

Changes take effect immediately for new sessions. Active sessions are not affected until they advance to the next screen.
