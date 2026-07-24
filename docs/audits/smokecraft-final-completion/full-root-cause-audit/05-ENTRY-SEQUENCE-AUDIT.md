# 05 — Entry-Sequence Audit

Re-verified this pass by direct source read (not re-copied from memory) of `SmokeCraft.jsx`, `ResumeJourney.jsx`, `useStartNewSmokeCraftJourney.js`, `computeJourneyStatus()`, and `getSmokeCraftEntryReadiness()`.

| User type | Trigger | Handler | Resolver | Guard | Destination | Persistence write | Source file | Correct? | Duplicate logic? |
|---|---|---|---|---|---|---|---|---|---|
| **Brand-new user** | Click Start | `getEntryRoute()` | `computeJourneyStatus([])` → `hasStarted: false` | none needed (nothing to guard) | `/smokecraft/enroll` | none yet | `SmokeCraft.jsx` | Yes | No — single resolver |
| **Returning active user** | Click Resume | `ResumeJourney.jsx` | `computeJourneyStatus(completedSteps)` → earliest incomplete | `SmokeCraftSessionGuard` on the destination route | earliest incomplete entry step or session | none (read-only) | `ResumeJourney.jsx` | Yes | No — same resolver as landing CTA |
| **History-only user** (has `previousCompletedJourneys` but no active journey) | Landing render | `hasRealJourneyProgress()` / `getJourneyCompletionState()` | `computeJourneyStatus` on the **active** journey's `completedSteps` only | — | Start (not auto-Resume) | none | `SmokeCraft.jsx` | Yes — confirmed `previousCompletedJourneys` is read-only history, never re-hydrated into live fields (verified by source, prior Clean-Start pass) | No |
| **Completed user** | Click "View Completed Journey" | same resolver, `isComplete: true` branch | — | — | completed review screen | none | `SmokeCraft.jsx` | Yes | No |
| **Archived user** (post Start-New) | — | `startNewSmokeCraftJourney()` archives into `previousCompletedJourneys` | — | — | archived history is inert | localStorage write on Start New | `SmokeCraftJourneyContext.jsx` | Yes — confirmed no code path reads `previousCompletedJourneys` back into active state | No |
| **Corrupt legacy user** (S27 id present, S1 absent) | any | `computeJourneyStatus` | contiguous-prefix scan, stops at first gap | — | S1 | none | `smokecraftJourneyStatus.js` | Yes — proven structurally impossible to render the S1/S27/63% contradiction (prior pass, re-verified this pass by direct function call, see `06-SESSION-SEQUENCE-AUDIT.md`) | No |

## Live-order sequence (re-confirmed against real repository architecture, not the mandate's generic suggested order)

```
Landing → Start/Resume/Start New
  → Enrollment (requires="entry" — see note below)
  → Venue Selection (requires="enroll")
  → Identity (requires="entry")
  → [Mentor Selection reachable post-entry, NOT pre-Welcome — real approved architecture]
  → Welcome (sessionNumber=1, entry-readiness-gated)
  → Session 1 spine (humidor-match, sessionNumber=2) → ... → Session 27
```

## One re-confirmed anomaly, not new, already disclosed in a prior pass

`Enroll.jsx`'s route guard is `requires="entry"` (`App.jsx` line 350), which — read literally — means Enrollment requires session **S1 ('entry'/Welcome)** to already be complete, which is architecturally backwards (Enrollment comes *before* Welcome in every documented sequence). This was not re-flagged as a new defect because `SmokeCraftSessionGuard`'s `requires` branch treats `requires === 'entry'` as **always unlocked** (`const requiresUnlocked = requires ? (isDemoMode || requires === 'entry' || session.completedSteps.includes(requires)) : true` — verified this pass, `SmokeCraftSessionGuard.jsx` line ~32) — i.e., `'entry'` is special-cased to never actually gate anything. This makes the prop misleading to read but functionally harmless; re-confirmed via the live route sweep (prior pass) that Enrollment is reachable for a fresh guest. **Disclosed as a naming/clarity issue, not a functional defect** — out of this audit-only pass's no-fixes rule regardless.

## Conclusion

No entry-sequence defect was found in this pass beyond what was already found, fixed, and re-verified in prior passes (Venue Selection visual + button label). The sequence logic itself is single-source, consistent, and has no duplicate resolver.
