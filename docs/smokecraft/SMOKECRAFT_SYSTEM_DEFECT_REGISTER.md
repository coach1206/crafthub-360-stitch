# SmokeCraft System Defect Register — Prompt 1

Baseline commit: `d6469504a2a83ab4acfb27e89a25064d505d4d55`

Every defect below is real (reproduced or directly evidenced from source/asset
data gathered this pass), not speculative filler. Items whose evidence is
"not yet gathered" are marked as such explicitly rather than invented.

| ID | Route/Screen | File/Asset | Defect type | Severity | Evidence | Assigned prompt |
|---|---|---|---|---|---|---|
| SC-D001 | `session1.png` (Welcome, and other screens sharing the strip) | `public/assets/smokecraft/session 1.png` | Baked decorative bottom-icon strip (Home/Journey/Learn/Create/Pairing/Mentor) visually resembles live navigation but is not interactive — classified `DEAD VISUAL CONTROL` | Medium | Directly visible in the approved image; confirmed by source read that no live control is overlaid on that region in `WelcomeExperience.jsx` | Prompt 3 |
| SC-D002 | 7 actively-used portrait assets: `enroll` (Guest Pass), `aiSummary`, `knowledgeDrop`, `connections`, `knowledgeDropTobacco`, `knowledgeDropAging`, `terroir` | see `SMOKECRAFT_ASSET_INVENTORY.md` | Portrait/vertical assets in active use, per this mandate's hard requirement that tablet screen visuals be landscape | Medium | Dimensions computed directly from file bytes this pass (1086×1448 etc.) | Prompt 4 |
| SC-D003 | 293 image files under SmokeCraft asset directories are not referenced by any `SC_ASSETS` key | `public/assets/smokecraft/**`, `public/assets/smokecraft-reference/**` | Unreferenced/legacy assets not yet reviewed for quarantine | Low | Computed directly this pass via `SC_ASSETS` cross-reference | Prompt 2 (classification), not auto-deleted |
| SC-D004 | 72 duplicate-hash groups (identical file bytes under different filenames) | see `SMOKECRAFT_ASSET_INVENTORY.md` | Asset naming/organization debt — does not itself cause a live defect, but obscures which file is canonical | Low | Computed directly this pass via SHA-256 | Prompt 2 |
| SC-D005 | ~100 of 109 registered routes | various | Not yet click-tested this pass — title/asset/live-vs-static classification unverified beyond the Locked Baseline list | Unknown (unverified) | Route list itself is verified (mechanical extraction); per-route rendering is not | Prompt 2 |
| SC-D006 | All 27 sessions | various | Per-session quiz/scorecard/slider/upload interaction audit (Part 6 classification) not performed this pass beyond asset+route+component verification already covered by existing test suites | Unknown (unverified) | `SMOKECRAFT_27_SESSION_AUDIT.md` covers route/asset/component only | Prompt 3 |
| SC-D007 | All routes except Venue Selection | various | Four-viewport responsive/scrolling audit (Part 7) not performed this pass beyond the existing full-journey suite's Section G (which sweeps all 31 canonical screens at 4 viewports for horizontal-overflow only, not the full checklist in this mandate — scroll behavior, touch target sizing, hero undersizing, etc.) | Unknown (unverified) | `verify-smokecraft-full-journey-sequence-and-assets.mjs` Section G already exists and passes for horizontal-overflow specifically | Prompt 4 |
| SC-D008 | `verify-smokecraft-full-journey-sequence-and-assets.mjs` — "Welcome honestly declares it has no approved asset" assertion | `verify-smokecraft-full-journey-sequence-and-assets.mjs` | Known pre-existing FAILING assertion — this is a stale, self-invalidating test assertion from before Welcome/S1 had a real approved asset wired (fixed in commit `7e8c4281`, prior session). The assertion itself was designed to flip-and-fail once a real asset was found, which it now correctly does. | N/A (expected, not a live defect) | Reproduced consistently across every full-journey run this session and the prior one | Prompt 6 (test file itself should be updated to stop asserting the stale pre-fix state) |
| SC-D009 | Live Railway production deployment | N/A | Cannot verify what commit/branch Railway is actually serving | Blocking (external) | Org egress 403 to `crafthub360.up.railway.app`, no Railway CLI/credentials — reproduced and confirmed every time it has been attempted this operation | Prompt 6 |

## Not classified as defects (explicit non-issues, per this mandate's own rules)

- Zero connected venues in `/smokecraft/venue-select` — a valid state per Part 8 of this mandate. Not a defect on its own; only dead controls, wrong image, fake data, or blocked navigation in that state would be.
- 6 phases (not 7) in `VISIT_STRUCTURE` — this repository's locked architecture has always been 6 phases / 27 sessions; not silently changed to match this mandate's stated "7 phases," and not silently changed to match without flagging the discrepancy. See `SMOKECRAFT_27_SESSION_AUDIT.md`.
- S9/S13/S17/S18/S20/S26 having no dedicated component registry entry — intentional (shared/merged component), verified in the 27-session audit.
