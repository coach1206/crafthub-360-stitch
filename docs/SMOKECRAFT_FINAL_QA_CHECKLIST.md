# SmokeCraft Final QA Checklist

Module Build 9 of 9 — Internal RC Review

## Foundation

- [x] NOVEE OS module foundation exists
- [x] SmokeCraft module manifest exists
- [x] SmokeCraft module status is `registered_preview` / `package_candidate`
- [x] Route contract defined
- [x] All data contracts exist

## Journey Protection

- [x] 8-visit / 24-session journey sequence intact
- [x] Flavor Memory positioned between Second Third and Final Third
- [x] Passport Stamp lock rules enforced (blocked by `VISIT_8_LOCKED`)
- [x] Connections lock rules enforced
- [x] Visit 8 protected
- [x] One-session shortcut blocked (`ONE_SESSION_SHORTCUT_BLOCKED`)
- [x] Scorecard missing blocks required rewards (`SCORECARD_MISSING`)
- [x] Flavor Memory missing blocks required rewards where required (`FLAVOR_MEMORY_MISSING`)
- [x] No early unlock pathways created in any build

## Protected Files

- [x] `SmokeCraftAssetScreen.jsx` — not modified by Builds 1–9
- [x] `SmokeCraftHotspotLayer.jsx` — not modified by Builds 1–9
- [x] `SmokeCraftAssetRoute.jsx` — not modified by Builds 1–9
- [x] `VISIT_STRUCTURE` in `session.js` — not modified
- [x] `passportProgress.js` — not modified
- [x] `passportEntry.js` — not modified
- [x] `smokecraftJourney.js` — not modified (only extended safely)

## Ordering (Build 3)

- [x] Customer self-order flow exists
- [x] Staff-assisted order flow exists
- [x] Staff queue exists
- [x] POS360 bridge reports `not_connected` honestly
- [x] E.A.T. bridge reports `not_connected` / `preview_only` honestly
- [x] Venue menu falls back to `local_fallback` honestly

## Pairing Intelligence (Build 4)

- [x] Local intelligence pairing exists
- [x] Flavor Memory feeds preference intelligence
- [x] No live AI provider is claimed connected
- [x] `aiBacked: false` when no provider configured
- [x] `recommendationStatus: "local_intelligence"` is honest

## Rewards / Passport / Monetization (Build 5)

- [x] XP tier system exists (Ember → Inferno)
- [x] Passport stamp logic exists with proper lock enforcement
- [x] Reward policy service exists; no reward bypasses progression
- [x] Loyalty provider reports `not_connected`
- [x] Billing reports `preview_only`; no charges created
- [x] Monetization panel does not claim billing active

## Venue Admin (Build 6)

- [x] Venue admin dashboard exists
- [x] Staff operations panel exists
- [x] Analytics panel exists (memory fallback honest)
- [x] Management controls panel exists
- [x] Customer role always blocked from admin access
- [x] 9 protected management actions remain blocked

## Integrations (Build 7)

- [x] 16 environment variables defined and validated
- [x] 10 connector categories exist
- [x] Secret safety service exists; `[REDACTED]` used in all env responses
- [x] `connected: true` never set without real connector verification
- [x] Sync event store guards against false `synced` claims
- [x] Database readiness returns `memory_fallback` without `DATABASE_URL`
- [x] `productionReady: false` across all integration services

## Enterprise Packaging (Build 8)

- [x] Enterprise package metadata exists
- [x] White-label governance exists; `canBypassProtectedProgression: false`
- [x] Tenant boundary contracts exist; `crossTenantAccessAllowed: false`
- [x] License governance exists; `license_not_enforced`
- [x] Marketplace draft hardening exists; publishing always blocked (6 reasons)
- [x] Feature flag governance exists; 12 flags; marketplace/license/billing default `false`
- [x] Governance audit exists; `containsSecrets: false`

## Security

- [x] No API keys in frontend code
- [x] No secret values sent to frontend (only presence booleans)
- [x] Connector audit entries: `containsSecrets: false`, `exposesPrivateData: false`
- [x] Governance audit entries: `containsSecrets: false`, `exposesPrivateData: false`

## Honest Status

- [x] No service claims POS360 connected without verification
- [x] No service claims E.A.T. connected without verification
- [x] No service claims live AI provider connected
- [x] No service claims database production-ready without `DATABASE_URL` verification
- [x] No service claims billing active
- [x] No service claims marketplace live
- [x] No service claims license enforced
- [x] No service claims tenant isolation production-ready

## Documentation

- [x] `src/modules/smokecraft/README.md`
- [x] `docs/SMOKECRAFT_PRODUCTION_SYNC_READINESS.md`
- [x] `docs/SMOKECRAFT_ENTERPRISE_PACKAGING_GOVERNANCE.md`
- [x] `docs/SMOKECRAFT_RELEASE_CANDIDATE_REPORT.md`
- [x] `docs/SMOKECRAFT_FINAL_QA_CHECKLIST.md`
- [x] `docs/SMOKECRAFT_HANDOFF_PACKAGE.md`
- [x] `docs/SMOKECRAFT_PRODUCTION_BLOCKERS.md`
- [x] `docs/SMOKECRAFT_NEXT_PHASE_ROADMAP.md`

## Build

- [x] `npm run build` passes clean
- [x] No TypeScript / JSX errors
- [x] No broken imports
