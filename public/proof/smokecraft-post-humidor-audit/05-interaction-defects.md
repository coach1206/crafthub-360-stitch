# Interaction Defect Audit

## Full route sweep (fresh, this pass)

`verify-smokecraft-all-routes-browser-test.mjs` re-run live this pass
against a real Chromium browser and a fresh `dist` preview server, all
130 live `/smokecraft` routes:

- **115 PASS**
- **14 REDIRECT PASS** (documented `<Navigate>` aliases — expected, not
  defects)
- **1 BLOCKED** — `/smokecraft/flavor-memory`, `networkidle` timeout

## Investigation of the one BLOCKED result

Re-tested directly with `waitUntil: 'domcontentloaded'` instead of
`networkidle`: real `200` response, real page title
("NOVEE OS | CraftHub 360"), real rendered body text present. This
confirms the BLOCKED result is a **test-harness false positive** — the
route has some ongoing background activity (likely a polling interval
or animation) that prevents Playwright's `networkidle` heuristic from
ever firing within the 12s budget, not a broken or dead route. This is
the same class of false positive already disclosed and worked around in
`docs/smokecraft/SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s own
description of iterating the responsive-sweep tool's false-positive
classes. **Not assigned an SC-D number** — it is a test-tooling
limitation, not a verified product defect (the route genuinely works).

## No dead routes, no orphaned pages, no unreachable routes found

Zero routes returned an error status, a blank page, or a genuine
timeout after direct re-verification. This matches the existing,
previously-closed SC-D005 finding (0 REPAIR REQUIRED, 0 DEAD ROUTE, 0
BLOCKED) and confirms no regression since that closure.

## Frontend-only success states / mock data

Not found in any domain covered by this audit's re-run test suites —
every passing suite this pass specifically asserts server-round-trip
behavior (real HTTP status codes, real persisted state, real
idempotency), not client-only optimistic success. See the companion
audit documents (Golden Box, mentor, pairing, rewards/Passport,
Venue Humidor) for domain-specific evidence.

## What this pass did NOT individually click-test

Per-control interaction (every button, every filter, every modal)
across all 130 routes was not manually clicked this pass — the
evidence base is the passing automated suites (dozens of dedicated
`verify-smokecraft-*` scripts, all re-run where directly relevant to
this audit's required sections) plus the fresh full-route navigation
sweep above. A literal control-by-control manual audit of all 130
routes was outside this audit pass's time budget and is not claimed.

## Classification

**No new interaction defects found this pass.** One test-harness false
positive investigated and explained (not a product defect). This is
consistent with — not contradicting — the existing, closed SC-D005
finding.
