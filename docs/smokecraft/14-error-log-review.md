# SmokeCraft Error Log Review Guide

**Version:** MVP2 · **Audience:** Administrators and platform engineers

---

## Overview

The Error Log Viewer (`/smokecraft/error-log`) displays structured log entries from both the SmokeCraft frontend and backend. It is a live view of the in-memory ring buffer (last 500 entries).

## Access

Requires `admin` or `founder_level_0` role. The route is protected and blocked in demo mode.

## Log Categories

| Category | Meaning | Typical Action |
|----------|---------|----------------|
| `frontend_exception` | Unhandled JavaScript error or promise rejection | Check the stack trace; identify the screen via `route` |
| `error_boundary` | React error boundary caught a component crash | Component failed to render; check `componentStack` |
| `api_error` | HTTP error from an API call | Check `errorCode`; 5xx = server problem, 4xx = client or auth issue |
| `contract_rejected` | Data failed SmokeCraft contract validation | Check `contractName` and `field`; fix the source of the invalid data |
| `unauthorized_access` | A role attempted to access a protected route | Check `actualRole` vs `requiredRole`; may indicate a misconfigured ProtectedRoute |
| `rate_limit` | A request hit the rate limiter | Check if a client is making automated or retry-looping requests |
| `provider_failure` | An external integration (POS, E.A.T., humidor) returned an error | Check `provider` and `message`; escalate to integration support |
| `navigation` | Navigation event logged for debugging | Informational; low severity |
| `feature_flag` | A feature flag change | Informational; cross-reference with the feature flag audit log |

## Log Levels

| Level | Meaning |
|-------|---------|
| `debug` | Verbose diagnostic information; only in development |
| `info` | Normal operational events (feature flag changes, navigation) |
| `warn` | Unexpected but non-fatal issues (rate limits, unauthorized attempts, contract rejections) |
| `error` | Errors that affect functionality (API failures, frontend exceptions) |
| `critical` | Severe errors (React error boundary, provider failures causing session loss) |

## Filtering

Use the level and category dropdowns to narrow the view. Click **Refresh** to pull the latest entries.

## Reading an Entry

Click any log entry to expand its full JSON. Key fields:
- `id`: unique entry ID
- `timestamp`: ISO 8601 timestamp of the event
- `route`: frontend URL where the event occurred
- `role`: user role at the time of the event
- `contractName`: for `contract_rejected`, which contract failed
- `field`: for `contract_rejected`, which field was invalid
- `provider`: for `provider_failure`, which integration
- `stack`: up to 8 lines of JavaScript stack trace
- `context`: additional structured context (PII-scrubbed)

## Escalation

| Severity | Action |
|----------|--------|
| `critical` × 1 | Investigate immediately |
| `error` × 5+ in 1 hour | Investigate; may indicate systemic issue |
| `contract_rejected` × 10+ same contract | Fix the data source; may be a breaking change |
| `provider_failure` × 3+ same provider | Contact integration provider; check credentials |
| `unauthorized_access` × 5+ same route | Review role configuration; possible security incident |

## Limitations

- In-memory only: entries are lost on server restart.
- Maximum 500 entries retained.
- No search or pagination in MVP2.
- For persistent logging, implement a Sentry/Datadog transport in `smokecraftErrorLogger.js`.
