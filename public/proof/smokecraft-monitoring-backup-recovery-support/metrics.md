# Metrics — Production Package 5

Module: `server/lib/metrics.mjs`. Simplest compatible approach: in-memory counters/gauges/histograms, snapshot exposed at admin-gated `GET /api/health/metrics` (see `structured-logging.md`'s sibling doc `owner-status-view.md` for the RBAC rationale — same reasoning: don't expose internals publicly).

## Metrics defined (`METRIC` export)
`http.request.count`, `http.response.duration_ms`, `http.error.count`, `db.query.duration_ms`, `db.pool.in_use`, `storage.failure.count`, `media.image_processing.duration_ms`, `payment.success.count`, `payment.failure.count`, `webhook.failure.count`, `inventory.hold_expired.count`, `checkout.abandoned.count`, `order.fulfillment.duration_ms`, `passport.claim_failure.count`, `golden_box.submission_failure.count`, `job.success.count`, `job.failure.count`, `deployment.success.count`, `deployment.failure.count`.

This directly covers every metric named in the mandate (§5): request count, response time, error rate (derived from `http.error.count` / `http.request.count`), uptime (health-check history, not a counter), DB latency, connection-pool usage, object-storage failures, image-processing duration, payment success/failure, webhook failures, inventory-hold expiration, checkout abandonment, order-fulfillment time, Passport claim failures, Golden Box submission failures, scheduled-job success/failure, deployment success/failure.

## Real verification
`node scripts/test-smokecraft-monitoring-recovery-support.mjs` includes a metrics test: increments a counter twice (1 then +4 = 5), sets a gauge, records two durations, and asserts the snapshot reports the correct counter total, gauge value, and histogram sample count. Passed — see `unit-test-output.log`.

## What is NOT built
A managed metrics backend (Prometheus/Datadog/Grafana). At pilot scale, the in-memory snapshot endpoint is sufficient and matches the mandate's "simplest compatible approach" instruction. Restarting the process resets all counters — documented tradeoff, not hidden.
