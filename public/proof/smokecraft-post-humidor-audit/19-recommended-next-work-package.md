# Recommended Next Work Package

## Selected package

**SmokeCraft Production Hardening — Phase 1: Secrets, Dependency
Patching, and Security Headers**

## Primary objective

Close the highest-priority (P0/P1), smallest-scoped, non-duplicative
gaps identified by this audit: require real production secrets (fail
loudly rather than fall back to dev defaults when
`NODE_ENV=production`), patch the 3 known dependency vulnerabilities
(`body-parser`, `react-router`, `react-router-dom`) and re-run the full
regression suite to confirm no breakage, and add baseline production
security headers (e.g. `helmet`-equivalent) if not already present.

## Why this package is next

- It is the only P0/P1 finding from this audit that is genuinely small
  enough for one controlled session — unlike real payment-gateway
  integration (P1, but Large, explicitly a separate future package) or
  the curriculum content-depth gap (P2, Medium, a content-review effort
  rather than a coding session).
- It has been flagged and carried forward, unresolved, across two prior
  audit/closure passes (Venue Humidor 1B-2B-6's security review and
  now this audit) without ever being scheduled as its own package —
  this audit's job was explicitly to determine the next priority from
  evidence, and the evidence shows this is the most overdue item that
  fits a single session.
- It protects every other system (Venue Humidor, Golden Box, mentor,
  pairing, rewards) rather than touching any of their business logic —
  minimal regression risk, maximal safety improvement.
- It does not require combining unrelated subsystems — it is a single,
  coherent "harden the deployment surface" objective.

## What this package must NOT do

- Must not attempt full payment-gateway integration (too large for one
  session; a separate future package).
- Must not touch Venue Humidor, Golden Box, mentor, pairing, or rewards
  business logic.
- Must not build new gameplay features.

## Suggested test requirements for that future package

- `npm audit --production` shows 0 vulnerabilities after the dependency
  bump.
- A new or extended validator confirms the server refuses to start (or
  logs a hard error, per architecture decision) with dev-default
  secrets when `NODE_ENV=production`.
- Full regression suite (Venue Humidor 411 + Golden Box 133 + mentor 81
  + pairing 36 + rewards/leaderboard/skill-tree/collections 85, plus
  the full route sweep and responsive validator) re-run and confirmed
  green after the `react-router`/`react-router-dom` version bump, since
  that dependency touches every routed page in the app.

## Suggested stop conditions for that future package

- Stop if the `react-router` major-version bump requires any breaking
  API change beyond what a patch/minor bump would need (escalate for a
  scoped migration decision rather than force it through).
- Stop if any existing regression suite fails after the bump and cannot
  be safely repaired without touching unrelated business logic.

## Remaining work order after that package

1. SmokeCraft Production Hardening — Phase 1 (this recommendation)
2. Curriculum quiz/interaction coverage closure (education content
   review)
3. Real payment-gateway integration (large, dedicated package)
4. Production monitoring/alerting layer
5. Any future, explicitly-scoped real beverage-catalog integration
   (only if a product decision is made to pursue it)
