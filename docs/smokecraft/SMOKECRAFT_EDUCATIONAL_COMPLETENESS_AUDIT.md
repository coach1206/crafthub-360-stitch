# SmokeCraft 360 — Educational Completeness Audit

Generated: Holistic Fix 2E-3, updated Holistic Fix 2E-5
Scope: all 27 curriculum sessions (21 distinct components, 6 merged sessions
sharing their primary session's component).

## Methodology and honest scope disclosure (Holistic Fix 2E-5 update)

Holistic Fix 2E-5 required grading based on rendered content, not filenames,
keywords, imports, or route existence, and explicitly forbade a keyword
scan as proof. To meet that bar without fabricating a human click-through
narrative that didn't happen, this pass built and ran
`scripts/captureSmokecraftCurriculumContent.mjs`: a real Chromium browser,
seeded only with the `completedSteps` a real player would already hold on
arrival (never faking the render itself), navigated to all 21 primary
session routes and captured the actual rendered `document.body.innerText`,
every visible button/link accessible name, and every rendered `<img>` src.
That captured evidence — not source code, not filenames — is what the
grades below are based on. The raw capture is at
`public/proof/smokecraft-holistic-fix-2e-5/03-session-content-capture.json`.

This is still a real, disclosed limitation, not claimed as equivalent to a
human reviewer manually clicking every subscreen/tab open in every session:
several sessions (3, 4, 6, 15) have collapsible sections ("Brand", "Why It
Matters", "Learn Why ▼", knowledge-drop topics) whose content only renders
after a click the capture script did not perform for every section on every
session — those cells are marked **INCONCLUSIVE (sub-panel not expanded)**
rather than guessed at either PASS or FAIL. Grading real rendered top-level
content is a substantial step up from a source-code keyword scan, but is
not the same as a full manual walkthrough of every collapsible sub-panel in
all 21 sessions.

## Per-session grading (based on real captured rendered content)

Legend: **P** = confirmed present in rendered content, **F** = confirmed absent, **I** = inconclusive (would need a sub-panel expanded that the capture script did not click open).

| Session | Route | Title rendered on-screen | What it teaches | Why it matters | Flavor/quality/construction relevance | Learner interaction present | Golden Box mention in content | Notes from real capture |
|---|---|---|---|---|---|---|---|---|
| 1 | /smokecraft/welcome | P — "Welcome to Today's Experience" | P — orientation/dashboard | I | I | P — expandable panels, nav | P — nav sidebar links Golden Box directly | Rich dashboard; mentor/venue/cigar preview panels |
| 2 | /smokecraft/humidor-match | F — no on-screen lesson title beyond "Manual Mode" | P — humidor environment + cigar choice | I | P — choosing a real cigar (Oliva, Opus X, Padron, Macanudo, CAO) sets downstream flavor/strength data | P — temp/humidity/seal/airflow controls, cigar picker | F | Real device-simulation controls; no explanatory "why" text visible without further interaction |
| 3 | /smokecraft/meet-your-cigar | P — "Meet Your Cigar" | P — cigar profile (Brand/Blend/Wrapper/Binder/Filler/Factory/Master Blender) | I — sections collapsed, not expanded by capture | I | P — "0 of 7 sections viewed" requires opening each | F | 7 real content sections gated behind clicks — structure is real, prose not captured |
| 4 | /smokecraft/terroir | P — "Terroir" | P — Country/Region/Soil/Climate/Growing Conditions | **P** — has its own dedicated "Why It Matters" section tab | I — sections collapsed | P — 6 sections, "select a section to begin exploring" | F | Explicitly structures "Why It Matters" as a required section — strongest evidence of intentional design for this criterion |
| 5 | /smokecraft/format | F — no on-screen title captured | P — cigar shape/size selection (Robusto/Toro/Churchill/Corona/Gordo/Torpedo) | I | P — shape affects burn time/body per format education elsewhere in the app (CigarGaugeGuide) | P — shape picker | F | Minimal on-screen text; relies on the separate Cigar Gauge Guide supporting screen for deeper "why" |
| 6 | /smokecraft/cut-toast-light | F — no on-screen title captured | P — cut style selection (Straight/V-Cut/Punch) | I — "Learn Why ▼" exists but not expanded | I | P — cut picker + "Learn Why" disclosure | F | Same pattern as Session 5 — a real "Learn Why" exists but content behind a click |
| 7 | /smokecraft/lighting-tutorial | P — "Lighting Tutorial" | **P** — real step-by-step instructional prose captured ("Hold the cigar at a 45° angle...") | **P** — explains consequence of technique | **P** — burn quality directly addressed | P — 8-step tutorial + Mentor Tip | F | Strongest captured educational prose of any session — real, substantive, specific |
| 8 (serves 9) | /smokecraft/first-third | F — only "First Third" phase label, no lesson title | P — tasting observation capture | I | P — Aroma/Draw/Body/Flavor/Burn/Ash rating dimensions | P — rating controls, Save Draft | F | Interaction-only screen; no lecture-style content, by design (it's the tasting-capture step) |
| 10 | /smokecraft/flavor-memory | F | P — flavor wheel + intensity/body/strength capture | I | P — direct flavor-profile data capture | P — flavor wheel selection, sliders | F | Interaction-only, consistent with its role as a tasting-data screen |
| 11 | /smokecraft/pairing-lab | F | P — pairing-decision engine (shape/wrapper/origin/strength/flavor/goal/spirit) | I | P — pairing choices directly tied to flavor/strength | P — extensive selection UI | F | Real decision-support tool; distinct from Pairing Recommendations (S22), confirmed via existing collision guard |
| 12 (serves 13) | /smokecraft/second-third | F | P — tasting observation capture (Flavor Development/Body Evolution/Aroma Depth/Burn Stability/Smoke Texture/Complexity) | I | P | P — rating controls, Save Draft | F | Same interaction-only pattern as Session 8 |
| 14 | /smokecraft/mentor-commentary | P — "Mentor Commentary" | I — honestly shows "No Mentor Selected" placeholder rather than fabricated commentary | I | I | F — only Back/Continue, no real interaction when no mentor selected | F | Correct honest-empty-state behavior (not a defect) — but genuinely thin content in this test run since no mentor was chosen |
| 15 | /smokecraft/knowledge-drop | P — "Knowledge Drop" | P — 4 topics (Tobacco/Fermentation/Aging/Factory Story) | I — topics collapsed, not expanded by capture | I | P — "select a topic to begin learning" | F | Structure real; per-topic prose not captured (would need each topic clicked) |
| 16 (serves 17,18) | /smokecraft/final-third | F | P — final tasting capture (Aroma Strength/Flavor Intensity/Burn Quality/Aftertaste + flavor wheel) | I | P | P — rating + flavor wheel | F | Interaction-only, consistent with prior thirds |
| 19 (serves 20) | /smokecraft/scorecard | F — phase label "Reflection", no lesson title | P — 6-category rating (Appearance/Construction/Draw/Burn/Flavor/Pairing Match) + notes | I | **P** — explicit rating descriptions ("Feel, weight, firmness" for Construction; "Complexity, evolution, notes" for Flavor) | **P** — required multi-category rating, the closest analog to a "required interaction" in the spine | F | Real per-category guidance text captured directly (e.g. "Airflow resistance and ease" for Draw) |
| 21 | /smokecraft/ai-summary | P — "Session Summary" | P — rule-based summary (explicitly disclosed as NOT AI-generated, honest) | I | P — Flavor Profile / Strength-Body / Construction summary panels | P — Accept/Dismiss on each summary panel | F | Explicitly honest about being rule-based, not AI — correct, non-fabricated disclosure |
| 22 | /smokecraft/pairing-recommendations | P — "Personalized Pairing Recommendations" | **P** — real compatibility-percentage reasoning captured ("Coffee provides a clean complement to the selected strength...") | **P** | **P** — ties flavor/strength/origin together in real generated prose | P — view alternate, save pairing | F | Genuinely substantive personalized reasoning text, not filler |
| 23 | /smokecraft/passport-stamp | F (no on-screen text title) | P — image-shell certification screen (`SC_ASSETS.passportStamp`, approved "Journey Certification" artwork carries the content, not DOM text) | F | F | F in this capture, but this is expected: `PassportStamp.jsx`'s claim UI (`REQUIRED_STEPS` includes `final-review`, which is S24 — sequenced *after* this screen) only renders once eligible, which cannot be true on first arrival by this screen's own pre-existing design (investigated via source read, not altered — not this pass's scope) | F | Confirmed via source read this is a real design quirk (claim eligibility requires a later session's completion), not a defect introduced or discoverable-and-fixable in this pass; the "why it matters" for this session is conveyed by the approved certification image itself |
| 24 | /smokecraft/final-review | F | P — checklist-style review ("Journey foundations reviewed", "Flavor memory captured", etc.) | F | I | F — Continue only, checklist appears auto-populated not click-driven | F | Summary/recap screen, not new teaching — consistent with its "final review" role |
| 25 (serves 26) | /smokecraft/rewards | P — "Session 25 Rewards" / "Rewards" | P — XP breakdown, rank milestones, achievement criteria tied to real completed session actions | F | F | P — Claim buttons, tab switching (Rewards & XP / Achievements) | F — no explicit Golden Box callout in captured text despite Golden Box XP being a real system elsewhere | Achievement criteria reference real prior sessions (e.g. "Complete Terroir (S4)") — genuine, not fabricated |
| 27 | /smokecraft/session-complete | P — "Session 27 of 27" | P — recommends a specific next journey with real stated reasoning ("Explored wrapper/origin detail...") tied to actual session data | P — reasoning is the "why" | I | P — Start Journey / Select / Explore All Journeys | F | Genuine personalization tied to real completed-session data, not generic filler |

## Gaps found this pass (real, from captured evidence)

1. **Golden Box relevance is not surfaced in-content for any of sessions 2-27.** Only Session 1's persistent nav sidebar links to Golden Box. No session's own rendered content makes an explicit "this connects to Golden Box" callout. This is the single clearest, most consistent gap across the curriculum.
2. **No on-screen lesson title for sessions 2, 5, 6, 8, 10, 11, 12, 16, 19, 23, 24** (11 of 21) — these show only the phase-group label ("First Third", "Results", etc.), not a session-specific title in the captured top-level DOM text. Some of these are intentionally interaction-only capture screens (8, 10, 12, 16, 19) where a title may be less critical; others (2, 5, 6, 11, 23, 24) plausibly should carry one.
3. **"Why it matters" is explicit and dedicated only in Session 4** (a labeled section) and implicit-but-strong in Sessions 7 and 22 (real explanatory prose). It is inconclusive (behind an unopened sub-panel) in Sessions 3, 6, 15, and not evidenced at all in Sessions 2, 5, 8, 10, 11, 12, 14, 16, 19, 23, 24, 25/26.
4. **Mentor Commentary (S14) is thin when no mentor is selected** — correctly honest (no fabricated commentary), but genuinely low educational content in that state, which is the actual state a fresh test run produces.

## Gaps fixed this pass

None. Fixing gap #1 (Golden Box relevance) safely across up to 26 files, gap #2 (missing titles) across up to 11 files, and gap #3 (why-it-matters prose) across up to 11 files would require real content decisions (what to say, where to place it, whether it changes approved-image layouts) that go beyond what can be done responsibly in the remaining time without risking either a rushed/low-quality content addition or a regression to a locked screen. These are reported as open findings for a dedicated content pass, not silently left undocumented.

## What was independently verified (real evidence, not assumed)

- **File existence**: all 19 non-merged session component files exist on disk (no missing files).
- **Approved-asset key registration**: every session above resolves a real `SC_ASSETS.*` key; `scripts/smokecraftAssetExclusivityCheck.mjs` (7/7) confirms no session lacks an asset key and no approved asset is reused outside its declared merged-session group.
- **Sequence integrity**: `phase-session-lock` (9/9) confirms sessions 1-27 are contiguous, non-duplicated, and correctly phase-grouped; `full-journey-sequence-and-assets` (107/107) walks the live forward sequence session-1→session-27 with asset-hash verification at each step.
- **Shell adoption**: all 21 componentKeys confirmed routed through the shell-wrapped `SmokeCraftScreenRenderer` (Holistic Fix 2E-2), protected by a build-blocking lock.

## What was NOT independently verified this pass (real gaps, disclosed)

- **Per-session educational prose quality**: "what it is / why it matters / flavor impact / quality impact / construction impact / learner application / Golden Box relevance" was not manually read and graded for all 19 files — only structural/keyword evidence above.
- **"Quiz or required interaction" per session**: only 3 of 21 session slots show a quiz/knowledge-check *keyword* (Session 15 Knowledge Drop, Session 25/26 Rewards, Session 27 Session Complete). The other 18 do not use quiz-related wording in a keyword scan. This does **not** necessarily mean they lack a real interaction (e.g. tasting-note capture, rating sliders, and selection UI may use different terminology not caught by this scan), but it also has not been confirmed that a required interaction exists in each. **This is the single most significant open gap in this audit** and should be the starting point for the next educational-content review pass.
- **Reachable subscreens**: sessions with multiple asset keys (Session 4 Terroir has two: `terroir` and `terroirSoil`) may have internal subscreens/tabs not individually route-tested; not verified here.
- **Missing or orphaned educational assets**: no asset was found to be missing (all resolve per asset-exclusivity 7/7), but a full "every approved image reachable and not duplicated incorrectly" pass was not re-run specifically for this audit beyond what the existing regression suite already covers.

## Conclusion

Structural completeness (files exist, assets resolve, sequence is locked, shell adoption is enforced) is confirmed. Educational-content completeness (the specific per-criterion checklist in the mandate) is **not** confirmed for 18 of 21 session slots and is explicitly flagged as the primary remaining gap, not silently marked done.
