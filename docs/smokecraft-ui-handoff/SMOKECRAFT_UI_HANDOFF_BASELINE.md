# SmokeCraft 360 — UI Handoff Baseline

**ENGINEERING BASELINE: VERIFIED AND READY FOR UI DESIGN**

**Baseline commit**: the commit titled "SmokeCraft live production acceptance: repair complete player experience across canonical game" on branch `recovery/smokecraft-codex-final` (the final pushed commit of this pass — see the session's final report for the exact SHA, since a commit cannot embed its own hash). This supersedes the prior baseline commit ("SmokeCraft UI handoff closure…", `9d7a749`) — that commit's own certification was found to be premature: a real production screenshot showed Golden Box Rules with multiple large blank panels, disproving the earlier claim that every canonical screen had been visually verified. See "Live production acceptance repair" below.

**Known canonical blockers: 0**

## Live production acceptance repair (supersedes the prior baseline)

The `9d7a749` baseline was certified using route-visit counts, backend completion responses, and screenshots that were captured but not asserted against for visible content — sufficient to prove a screen was *reachable*, not that it was *player-ready*. A live production screenshot of `/smokecraft/golden-box` disproved that certification: three large regions of the screen were completely blank (decorated, appropriately-sized voids with zero text/image/control content), a real static-shell defect. Root cause, fix, and new content-assertion regression: see SC-D079 in the defect register. The blank-panel pattern was confirmed, via a new static-source detector wired into `npm run prebuild`, to be unique to that one screen — no other canonical screen in the 85-file `src/pages/smokecraft/` tree matched it.

## What "verified" means, concretely

Every item below was proven against this exact commit via real, automated tests run against a live server (not asserted from memory, not inferred from code alone):

| Gate | Result |
|---|---|
| `npm run prebuild` (7 static-source gates: assets, manifest, shell adoption, player-state/account/gameplay integrity, gameplay authority, alert safety, tasting/cultivator/collections/skill-tree/leaderboard/pairing-engine/mentor-guidance authority, compliance readiness, no-external-image-urls, static-gameplay detector, canonical journey lock, full-game inventory lock, session-rewards completeness) | All passing |
| Full fresh-player journey (backend-authoritative, real HTTP endpoints, all 27 sessions) | 62/62 |
| Humidor Match regression | 19/19 |
| Static-gameplay detector (all 85 page files) | 85/85 |
| Canonical journey lock (recovered opening chain) | 14/14 |
| Full-game inventory lock (exactly 27 sessions, no gaps) | 60/60 |
| Session-rewards completeness (every completion key has a real reward entry) | 22/22 |
| Full real-browser journey coverage (every canonical route genuinely visited, Session 27 reached naturally) | 31/31 |
| Scorecard "Pairing Match" click regression (real, unforced click, all 4 viewports) | 60/60 |
| Golden Box gating regression (early-entry rejection, valid-entry success, no duplicate award) | 10/10 |
| Golden Box Rules content/interaction regression (required content present, real unforced checkbox click, Continue lock/unlock, correct next route, 4 viewports) | 68/68 |
| Blank-panel detector (all 85 page files) | 85/85 |
| Viewport touch proof (5 viewports) | 55/55 |
| Production build (`npm run build`, clean-bundle gate) | Clean |

## Defects closed to reach this baseline

- **SC-D076** — Humidor Match baked-mockup/fake-state defect.
- **SC-D077** — Recovered opening sequence (Golden Box Rules → Mentor Selection → Seed & Soil) was built but never actually entered by a real playthrough; two independent causes fixed (component-level navigate target + manifest-level `nextRouteOverride`, the latter being the one a real click actually obeys).
- **SC-D078** — `SESSION_REWARDS` was missing 5 real session ids (Lighting Tutorial, Mentor Commentary, Knowledge Drop, AI Summary, Pairing Recommendations); completing any of them through the real UI was a silent no-op that permanently blocked a real player at Session 7. Found only by a real full-browser click-through — invisible to the backend-only fresh-player suite.
- **Golden Box Rules tablet-portrait letterboxing** — fixed via a blurred, cover-fit backdrop behind the existing image in the shared `SmokeCraftImageBoundsOverlay`, zero hotspot coordinate risk.
- **Scorecard "Pairing Match" click-interception** — root cause: the Rating Categories panel had no height bound, so at real viewport/content combinations its 6th row rendered underneath the independently-positioned Personal Notes panel, intercepting pointer events. Fixed with a hard `maxHeight` + internal scroll and tightened row spacing.
- **Golden Box entry creation had no server-side eligibility enforcement** — `entryService.createEntry()` never called the existing `eligibilityService.evaluateEligibility()` at all; a direct API call could create a competition entry regardless of any configured eligibility rule (confirmed live: a completely fresh, zero-session guest received a real HTTP 201). Fixed by wiring the check into `createEntry()` itself, plus a new `required_completion_keys` rule type that reads the real 27-session completion ledger directly.
- **SC-D079 — Golden Box Rules blank-panel static shell** — three large regions of the screen were opaque, decorated, content-free masks over baked artwork that didn't belong on this screen (duplicate Identity/Venue-Select forms, a staff-only table with no real feature). The masking decision was correct; leaving a visible void instead of removing it and reflowing real content was the defect. Rebuilt as real live DOM with every real, approved piece of content (Golden Principles, Quick Rule Reminders, Rule Acknowledgement, Consequences of Misconduct, The Right Way to Enjoy, Golden Tip) as real DOM text/controls. Zero blank panels remain.

## What the UI developer may do

See `DO_NOT_BREAK_RULES.md` and `DESIGNER_FREEDOM_VS_ENGINEERING_LOCKS.md` — improve composition, spacing, typography, animation, imagery treatment, card presentation, navigation presentation, premium styling.

## What the UI developer must not change without engineering review

Canonical sequence, routes, completion/unlock logic, XP/reward values, Passport logic, Golden Box eligibility/entry/judging rules, asset IDs, or any backend API contract. Every one of these is now covered by a build-blocking or regression-gated test — a change that breaks one of them will fail CI, not just "look wrong."
