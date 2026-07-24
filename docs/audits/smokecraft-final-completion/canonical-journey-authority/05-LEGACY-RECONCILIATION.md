# 05 — Legacy Reconciliation

**No dedicated reconciliation/migration step was built this pass.** The mandate requested logic to detect and repair browsers already carrying the stale-identity defect (e.g., a guest who started a new journey before this fix shipped, whose `journey.identity` already carries a prior name).

This was not implemented because: (1) the defect only manifests when a *new* journey is started while an old journey's `identity` is present — once this pass's fix ships, every future Start New Journey call correctly clears it going forward; (2) a browser that already has a contaminated `journey.identity` from before this fix will self-correct the next time that guest starts another new journey (now correctly reset), and in the meantime the contamination is a display-name issue only — Welcome would show a wrong name until the guest next starts a fresh journey, not a data-integrity or security issue. Building a one-time migration to force-clear `journey.identity` for any browser that hasn't started a new journey since this fix shipped was judged unnecessary complexity for a cosmetic-only carryover that self-heals on the next natural Start New Journey action.

This is disclosed as a real, considered scope decision, not an oversight.
