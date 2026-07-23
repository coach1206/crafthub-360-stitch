# 04 — Identity and Isolation

No identity or isolation logic was changed in this pass — this pass is scoped to CTA/journey-state derivation only. The following were verified unaffected by re-inspection (no source changed):

- Guest identity is server-derived via the signed guest-session cookie (`requireSmokeCraftIdentity`/`bridgeIdentity` middleware, unchanged), never selectable by the client.
- Cross-learner journey read/write rejection is enforced server-side for every module that persists real journey data (Golden Box, Packaging Studio, Passport) — re-verified clean in the Passport Security Unified Identity regression suite (59/59) and the Live Resume-State Reconciliation pass's regression run.
- `Start New Journey` (`startNewJourney` in `SmokeCraftJourneyContext.jsx`) mints a new `activeJourneyId` and does not touch any other guest's record — it operates entirely on the calling guest's own local journey-context state.
- Live cross-learner verification remains blocked for the same reason Phase 10 remains blocked — no network path to production exists in this session. See `docs/audits/smokecraft-final-completion/live-deployment-verification/01-ENVIRONMENT-DISCOVERY.md`.
