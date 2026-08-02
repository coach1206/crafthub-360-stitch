# Monitoring Architecture — Production Package 5

## Selected stack (budget-conscious, extends Package 4's baseline)

| Concern | Tool | Tier | Est. monthly cost | Status this pass |
|---|---|---|---|---|
| App logs | Platform stdout/stderr (Railway/Render/Fly log stream) + our structured JSON logger (`server/lib/structuredLogger.mjs`) | Included with host | $0 | Built & unit-tested locally |
| Health checks | Package 4's `/api/health/live`, `/ready`, `/migrations` + platform-native health checks | Included with host | $0 | Verified working (this pass, see regression-results.md) |
| App error tracking | Sentry-shaped adapter (`server/lib/structuredLogger.mjs` `logError`/`logCritical` emit the exact fields a Sentry `beforeSend` hook needs: severity, event_type, correlation_id, release) — actual Sentry SDK wiring documented, no live DSN available | Sentry free tier (5k events/mo) | $0–$26 | Adapter/config built; **no live Sentry account in this sandbox — not exercised externally** |
| Uptime monitoring | UptimeRobot/BetterStack-shaped config (ping `/api/health/live` every 1–5 min) | Free tier (50 monitors) | $0 | Documented setup instructions only; **no live account — not exercised** |
| DB metrics | Managed Postgres provider dashboard (Railway/Render/Neon) — awareness only, no separate metrics pipeline needed at this scale | Included with host | $0 | Not exercised (no managed provider in sandbox; local Postgres only) |
| Object storage metrics | R2/S3 provider dashboard (Package 4's storage adapter) | Included with provider | $0 | Not exercised (no live bucket) |
| Stripe dashboard/webhooks | Stripe's own dashboard + webhook event log (Package 2's real gateway code) | Free | $0 | Not exercised — no live Stripe account credentials in this sandbox |
| Deployment visibility | GitHub Actions run history (Package 4's CI/CD) | Free (GitHub) | $0 | Existing from Package 4, unchanged |
| In-app metrics | `server/lib/metrics.mjs` — in-memory counters/gauges/histograms, admin-gated `/api/health/metrics` | Self-hosted | $0 | Built & unit-tested |

**Total estimated monthly cost at current scale: $0–$26/month** (the only line item with a plausible paid tier is Sentry once event volume exceeds the free tier; everything else fits comfortably in free tiers at pilot/launch scale).

## Escalation & upgrade path
- MVP: free tiers above, on-call engineer checks dashboards manually + reacts to alert-rule evaluations logged by `server/lib/alertRules.mjs`.
- Next tier (Package 6/7 candidate): wire a real Sentry DSN + UptimeRobot/BetterStack account + Slack/PagerDuty webhook once a paid account exists; the adapter surface built this pass (`logError`/`logCritical`, `evaluate()`) is already shaped for that wiring — it's a credential/config change, not a rebuild.
- Enterprise tier (future): managed APM (Datadog/New Relic), PagerDuty with on-call rotations, dedicated logging pipeline (e.g. Better Stack Logs / Grafana Loki).

## Data retention limits (free tiers, documented for planning — not yet in force since no live accounts exist)
- Sentry free: 30-day event retention.
- UptimeRobot free: 2-month log history.
- GitHub Actions: 90-day artifact/log retention (default).
- Local structured logs (stdout): retained only as long as the host platform's log stream retains them (typically 7 days on Railway free tier) — this is why `backup_run_log` and `support_case_actions` persist the load-bearing events in Postgres rather than relying on log retention alone.

## Vendor risk notes
- Sentry/UptimeRobot/PagerDuty are all third-party SaaS — outage of the vendor does not take down the app, only monitoring visibility. Documented as a known gap, not a blocking dependency.
- No vendor holds write access to production data; all are read-only observers of logs/health/errors.

## Honesty statement
No external monitoring account was created or exercised in this sandboxed environment. Everywhere this pass claims something is "verified," it means verified against a REAL local process (this repo's server, this repo's local Postgres) — never a live third-party dashboard.
