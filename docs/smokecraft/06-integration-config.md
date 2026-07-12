# SmokeCraft Integration Configuration Guide

**Version:** MVP2 · **Audience:** Platform administrators and integration engineers

---

## Overview

SmokeCraft integrates with three external systems. All integrations are **disabled by default** and show honest fallback status until configured. The Truthful Status Guard prevents any integration from displaying "Connected", "Synced", "Ordered", or other protected success words without verified evidence.

## POS360 Integration

**Route:** `/smokecraft/request-purchase` triggers POS handoff

**Required credentials:**
- POS360 venue API key (`SMOKECRAFT_POS360_KEY`)
- Table-to-station mapping JSON

**Configuration:**
1. Set environment variable `SMOKECRAFT_POS360_KEY` on the server.
2. Configure table mapping in **Admin** → **Integrations** → **POS360**.
3. Run the connection test. A successful test returns a provider response ID.
4. Only after a successful test will the status show **Connected**.

**Status labels:**
| State | Label shown |
|-------|-------------|
| Not configured | Not configured |
| Test in progress | Pending |
| Test passed | Connected |
| Order submitted | Ordered |
| Order failed | Order pending |

**Feature flag:** `smokecraft.billing.enabled` must be true for live orders. With billing disabled, orders are queued as purchase requests only.

## E.A.T. Sync Integration

**Route:** `/smokecraft/management-sync` shows E.A.T. sync status

**Required credentials:**
- E.A.T. sync endpoint URL (`EAT_SYNC_ENDPOINT`)
- E.A.T. auth token (`EAT_AUTH_TOKEN`)

**Configuration:**
1. Set environment variables on the server.
2. Configure sync interval in **Admin** → **Integrations** → **E.A.T.**
3. The first sync populates the management dashboard with live data.

**Status labels:**
| State | Label shown |
|-------|-------------|
| Not configured | Not configured |
| Sync in progress | Pending sync |
| Sync successful | Synced |
| Sync failed | Retry required |

## Humidor Monitor Integration

**Route:** `/smokecraft/humidor-match` shows humidor connection status

**Required:** Bluetooth-enabled humidor device with a registered device ID.

**Configuration:**
1. Register the device ID in **Admin** → **Integrations** → **Humidor**.
2. Ensure the device is powered and in range.
3. The system polls for the device on page load.

**Status labels:**
| State | Label shown |
|-------|-------------|
| No device registered | Not configured |
| Device not responding | Offline |
| Device responding | Connected |

## Rate Limiting

All integration API routes inherit the server-side rate limits:
- General: 300 requests per 15 minutes
- Auth endpoints: 20 requests per 15 minutes

Rate limit hits are logged to the error log with category `rate_limit`.

## Environment Variables Reference

| Variable | Required For | Example |
|----------|-------------|---------|
| `SMOKECRAFT_POS360_KEY` | POS360 live orders | `sk_live_abc123` |
| `EAT_SYNC_ENDPOINT` | E.A.T. sync | `https://eat.api.example.com/sync` |
| `EAT_AUTH_TOKEN` | E.A.T. sync | `Bearer eyJ...` |
| `NODE_ENV` | Rate limiting (production only) | `production` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
