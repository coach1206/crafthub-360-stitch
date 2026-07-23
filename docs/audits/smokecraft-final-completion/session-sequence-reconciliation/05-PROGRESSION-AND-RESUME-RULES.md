# 05 — Progression and Resume Rules

All derived from the single `computeJourneyStatus(completedSteps)` function (`smokecraftJourneyStatus.js`), fixed in the prior "Live Resume-State Reconciliation" pass and re-verified unchanged and correct in this pass.

- **Completion percentage:** `completedSessionCount / TOTAL_SESSIONS(27)`, where `completedSessionCount` is the length of the **contiguous prefix** of sessions completed in order (stops at the first gap) — never the maximum session number found anywhere in `completedSteps`.
  - 0 completed → 0%
  - 1 completed → round(1/27×100) = 4%
  - 13 completed → round(13/27×100) = 48%
  - 26 completed → round(26/27×100) = 96%
  - 27 completed → 100%, `isComplete: true`
- **Resume destination:** `ResumeJourney.jsx` and the landing CTA both derive from the same contiguous-prefix pointer — no active journey → Start; entry incomplete → earliest incomplete entry step (enroll/venue-select, per the entry-prerequisite guard); entry complete, no session complete → Session 1; N completed contiguously → Session N+1; all 27 complete → completed journey view.
- **Corrupt/noncontiguous legacy state:** the exact previously-reported contradiction (`Current Session 1` / `Last Completed Session 27` / `63%` simultaneously) is structurally impossible under this rule — a legacy record with S27's id present but S1 absent produces `completedSessionCount = 0` (the scan stops at the first gap, S1), so `completionPercent = 0%`, `lastCompletedSessionNumber = null`, and the guard's `isSessionUnlocked` independently confirms only S1 is reachable. All three numbers are views of the same single prefix length — they cannot disagree by construction, not by a special-cased check.
- **Direct deep links to locked sessions:** blocked by `SmokeCraftSessionGuard`'s `isSessionUnlocked` check (unchanged, re-verified).
- **Completed-session review:** visiting an already-completed session's route does not call the completion/award functions again (guarded by each page's own `if (!alreadyComplete)` logic) — reviewing does not duplicate XP, Passport stamps, or completion state.
- **Refresh:** `completedSteps` persists via the existing `GuestSessionContext` save mechanism (unchanged); refresh does not alter the current-session pointer, which is always derived fresh from persisted `completedSteps`, not a separate volatile counter.
- **Start New Journey:** resets `completedSteps` to `PRESERVED_COMPLETED_STEP_IDS = ['enroll']` (per the prior "Start New Journey" pass), so curriculum progression restarts at Session 1 with 0% — re-verified unaffected by this pass.
