# Production-Hardening Audit (Whole-App Scope)

## Carried forward from Venue Humidor 1B-2B-6 (unchanged, re-confirmed this pass)

- No real payment gateway integration.
- Development-default secrets (`JWT_SECRET`, `FOUNDER_CHALLENGE_SECRET`,
  `ELEVENLABS_API_KEY`) — confirmed still triggering the same honest
  startup warnings this pass (`[EnvValidator] ⚠` lines observed live
  when the server was restarted for this audit).
- `body-parser` DoS advisory, `react-router`/`react-router-dom` open-
  redirect/SSR-hydration advisories — `npm audit --production` was not
  re-run this pass (no dependency changed since 1B-2B-6); status
  assumed unchanged from the 1B-2B-6 security review, not re-verified.
- No dedicated monitoring/alerting layer.
- No real beverage catalog.
- Large main JS bundle (~5.3MB pre-gzip / ~915KB gzipped).
- Backups and CI/CD mechanics not assessed (outside codebase scope).

## Additional items inspected this pass

- **Environment-variable validation**: confirmed real —
  `[EnvValidator]` runs at startup and explicitly warns on every
  missing-but-required secret, rather than silently proceeding.
- **Production URLs / localhost dependency**: `BASE`/`HOST` constants
  across the test suites default to `localhost` for local dev/test
  convenience only — this is test-harness configuration, not
  application runtime code; the app itself reads real environment
  variables for its own origin (not independently re-audited line-by-
  line across every service this pass, carried forward as unchanged
  from prior passes' own scoped reviews).
- **Logging**: server startup/request logs observed live this pass
  contain no secrets, tokens, or payment data — consistent with the
  1B-2B-6 security review's own finding, now confirmed unchanged.
- **Error reporting**: no dedicated error-reporting service (Sentry/
  Datadog) integration was found wired up — `smokecraftErrorLogger.js`
  exists (referenced by the pre-Venue-Humidor
  `SMOKECRAFT_POST_INVESTOR_BACKLOG.md`) but its production monitoring-
  provider flush transport was explicitly listed there as not yet
  activated — still not activated, confirmed by absence of any
  Sentry/Datadog SDK in `package.json` dependencies.
- **Rate limits**: confirmed present across Venue Humidor (unchanged);
  broader SmokeCraft route-level rate limiting was not individually
  re-audited this pass beyond what the existing passing suites already
  exercise.
- **Feature flags / kill switches**: `docs/smokecraft/13-feature-flag-admin.md`
  exists as a support document, indicating some feature-flag capability
  is documented; this pass did not independently re-verify its live
  behavior.
- **Security headers / session hardening**: not independently
  re-audited this pass beyond the cookie `httpOnly`/`sameSite`
  configuration already confirmed in the 1B-2B-6 security review.
- **Build reproducibility**: `npm run build` succeeded cleanly and
  deterministically this pass (re-run twice across this session with
  identical pass/fail outcomes).
- **Deployment smoke tests**: the existing `verify-smokecraft-live-deployment.mjs`
  and `verify-smokecraft-production-freeze.mjs` scripts exist in the
  repo; not run this pass (they target a live/frozen deployment
  context this local audit environment does not represent — running
  them here would not produce meaningful evidence).
- **Support documentation**: 14 documents exist under `docs/smokecraft/`
  (guest manual, staff ops, manager guide, venue admin, platform admin,
  integration config, troubleshooting, investor demo, deployment,
  rollback/recovery, known limitations, data privacy, feature-flag
  admin, error-log review) — confirmed present, not individually
  content-reviewed for currency this pass.

## Classification

**Not production-ready without addressing the carried-forward items**,
most materially: real payment gateway, real production secrets, and
the 3 known dependency vulnerabilities. Everything else is either
already adequate (environment validation, logging hygiene, rate
limiting, build reproducibility) or a disclosed, bounded gap
(monitoring/alerting, error-reporting activation) rather than a hidden
one.
