# SmokeCraft 360 — Full Journey Sequence & Approved-Asset Authority — Final Report

**Starting commit:** `a548ff0cd797d59d906316e81556f3681579e630` — local HEAD == remote HEAD, clean tree, branch `recovery/smokecraft-codex-final` (verified before any work began).

---

## 1. Executive summary

This pass was an **audit-first** pass. The mandate describes a large amount of infrastructure as if it needed building; the great majority of it **already existed and was already correct**, built by prior passes. The honest result:

- The mandate's "conflicting authorities" premise is **largely stale**. Ten of the eleven listed responsibilities are already served by exactly one function each (§3).
- **No second "journey decision" resolver was built.** Doing so would have repeated this operation's most-repeated mistake. The existing functions were mapped to responsibilities instead (§3).
- **One genuine, real, previously-undetected defect was found and fixed** — a Landing CTA layout fault affecting every returning user at all four required desktop viewports (§4).
- Everything else audited was confirmed already correct, with evidence, and left alone.

---

## 2. Canonical journey authority — path(s)

There is **one** authority per responsibility. None of them duplicate each other; the entry resolver *orchestrates* the others rather than reimplementing them.

| Responsibility | Single authority | File |
|---|---|---|
| 6-phase / 27-session structure | `VISIT_STRUCTURE` | `src/constants/session.js` |
| Per-screen route/component/asset/prereq/prev/next | `SMOKECRAFT_SCREEN_MANIFEST` (generated from `VISIT_STRUCTURE`) | `src/constants/smokecraftScreenManifest.js` |
| screenId → component | `SMOKECRAFT_COMPONENT_REGISTRY` | `src/constants/smokecraftComponentRegistry.js` |
| Start destination | `resolveSmokeCraftLandingAction(START)` → `resolveSmokeCraftEntryDestination` | `src/constants/smokecraftLandingActions.js` |
| Resume destination | `resolveSmokeCraftLandingAction(RESUME)` → same function | same |
| Start-New destination | `resolveSmokeCraftLandingAction(START_NEW)` | same |
| Entry-step routing / entry completion | `getSmokeCraftEntryReadiness` | `src/constants/smokecraftEntryReadiness.js` |
| Current session / phase / completion % | `computeJourneyStatus` (contiguous-prefix rule) | `src/constants/smokecraftJourneyStatus.js` |
| Previous / Next route | manifest `previousScreenId` / `nextScreenId` (+ `nextRouteOverride` for the approved S5 branch) | manifest + `smokecraftCompletionService.js` |
| Direct-route access / locked-route return | `SmokeCraftSessionGuard` (`sessionNumber` + `requires`, both consulting `getSmokeCraftEntryReadiness`) | `src/components/smokecraft/SmokeCraftSessionGuard.jsx` |
| Approved image selection | `SC_ASSETS` + manifest `assetKey` | `src/constants/smokecraftAssets.js` |
| Fallback component selection | **none exists by design** — `SmokeCraftScreenRenderer` throws rather than guessing | `SmokeCraftScreenRenderer.jsx` |
| Supporting-module access | `SmokeCraftSessionGuard requires="…"` | same guard |

### Phase 2 decision: no new `getSmokeCraftJourneyDecision()` was created

Every responsibility the mandate listed for that proposed function is already covered by exactly one existing function, as tabulated above. Building a twelfth function that re-answers those questions would have created precisely the competing-resolver problem that caused the Start/Resume, Passport and Pairing defects fixed in earlier passes. **No genuine gap was found, so nothing new was built.** This is a deliberate, evidence-backed decision, not an omission.

---

## 3. Verification of the "conflicting authorities" claim

Checked against the actual current source, not assumed:

- `src/pages/SmokeCraft.jsx` contains **zero** inline `navigate('/…')` destination strings; every Landing control resolves through the one resolver.
- All 27 curriculum routes in `src/App.jsx` wrap `SmokeCraftScreenRenderer` with a `sessionNumber` guard whose number matches the manifest exactly — verified route by route.
- `SmokeCraftScreenRenderer` **throws** on an unknown screenId rather than falling back, so there is no silent fallback-component authority at all.
- The only remaining plural-looking construct is the legacy alias set `/smokecraft/session-1..4` (§6) — audited and confirmed **not** a sequence bypass.

**Conclusion: the mandate's framing is stale.** The consolidation it asks for was already done.

---

## 4. The one genuine defect found and fixed

**Landing returning-user CTA stack overlapped the approved artwork and itself — all four required viewports.**

`SecondaryHotspot` ("START NEW JOURNEY") carried a fixed `minHeight: 72`, which overrode its declared percentage band (`height: 5.2%` ≈ **30px** at 1024×768). The control therefore rendered ~2.4× its approved height and ran downward across the approved artwork's baked "Begin your guided cigar profile…" paragraph, while colliding with the primary CTA above it. The gap between the two bands is 7.6% of image height, so the overlap was **arithmetically guaranteed** at any viewport under ~947px of rendered image height — i.e. at every one of the four required desktop viewports, for every returning user.

Compounding it, the primary CTA's longer returning-user labels ("RESUME SMOKECRAFT JOURNEY →", "VIEW COMPLETED JOURNEY →") wrapped to a second line and spilled outside the gold pill, leaving live text sitting directly on the artwork.

This was newly exposed rather than newly introduced: the prior pass's fix correctly made RESUME reachable for enrolled-but-zero-session users, which turned the two-button returning layout into the common path.

**Fix** (`src/pages/SmokeCraft.jsx`, the only source file changed):
- Removed the band-breaking `minHeight: 72`, replaced with `minHeight: 28` so the approved band governs. *(The 72×72 rule asserted by `verify-smokecraft-tactile-haptic-interactions.mjs` targets `SmokeCraftTactileCard`, not these image-aligned hotspots — checked, not assumed; that suite still passes 71/71.)*
- Trimmed the secondary band to `top: 63.6%, height: 4.4%` so it ends clear of the baked paragraph (~68.6%).
- Primary CTA: `whiteSpace: nowrap`, reduced type/letter-spacing, and widened `21.5% → 23.0%` into the empty gap before HOW IT WORKS (26.7%) so the longest label fits on one line without clipping and without shrinking type to an unreadable size.

**No artwork was created, redesigned, or modified.** Verified by three new assertions that check real geometry at all four viewports (CTA-vs-CTA overlap, secondary-vs-baked-paragraph encroachment, and label wrap *and* clip), plus visual inspection of the before/after screenshots.

---

## 5. Confirmed-correct (audited, no change made)

| Area | Evidence |
|---|---|
| Start sequence | New user → Guest Pass; enrolled → Venue (Guest Pass never reappears, incl. on refresh and a second click); entry complete → Welcome/S1; Begin Experience → S2. All via **real clicks**. |
| 27-session order | All 27 resolve at their canonical route with correct screenId/component/phase markers; 27 distinct sessions, exactly 6 phases, no 28th, no repeat, no skip. |
| Approved images | 30 registered assets, **0 missing on disk**; **26/27** sessions hash-verified rendered==disk in a real browser (the 1 exception has no approved asset). No asset reused outside the 4 declared merged groups. |
| Previous / Next | Derived from the registry, never page logic; S4 Back → S3 verified by real click. S5's approved `request-purchase` branch preserved. |
| Refresh / deep link | S6 survives reload with markers intact; deep link to an unlocked screen loads correctly. |
| Resume | Mid-journey Resume opens the earliest incomplete session (S10) by real click. |
| Guards | Direct access to a far-future session (S19) blocked with a real lock state; lock action returns to the actual current session; unenrolled deep link to Welcome redirects to Guest Pass with no flash. |
| Supporting routes | Pairing / Pairing Lab / Pairing Recommendations are three distinct routes; Lab is guarded to S11 and Recommendations to S22 (both verified locked-before / open-at). Passport, Rewards Center, Rankings, CraftHub, Challenge Hub all preserve `completedSteps` and the selected venue byte-for-byte. |
| Placeholder data | Welcome shows the real venue and no `Guest`/`Unknown`/`No venue selected`/`undefined`/`null`. No stale archived identity on a clean landing. |
| Legacy paths | Fresh sweep found nothing new to remove (§6). |

---

## 6. Legacy / duplicate paths — honest result: **nothing new removed**

A fresh sweep was run rather than trusting prior passes. `verify-smokecraft-zero-legacy-runtime` (9/9) and `verify-smokecraft-zero-old-visuals` (20/20) both hold.

The one construct worth reporting is the pre-existing alias set `/smokecraft/session-1..4`, which redirects to `/smokecraft`, `/enroll`, `/golden-box`, `/mentor-selection`. Their numbers do **not** correspond to the canonical S1–S27 spine, which reads as a contradiction. Audited:

- Every target is either public or `requires`-guarded; **none** is a numbered spine route, so **no alias bypasses a session guard or the sequence**.
- They are already disclosed in two prior audit documents, and a prior pass deliberately chose these exact targets, with `verify-smokecraft-route-corrections.mjs` asserting them.

**Decision: left untouched.** Changing them would break a passing suite and reverse a deliberate prior decision, to fix a naming collision that causes no routing defect. Disclosed here rather than silently "cleaned up" or silently ignored. Recommended for a future naming pass.

---

## 7. Missing approved assets (Phase 6 policy)

Three screens, all disclosed, none fabricated — see the inventory doc for full reasoning:

1. **`session-1` Welcome** — no approved Welcome artwork exists in the repo. Renderer honestly emits `live-component-no-approved-asset`.
2. **`session-25` Rewards** — `REWARDS 222.png` is a fully-baked mock dashboard with fake figures in its pixels and zero blank overlay zones. Left on its decorative-band usage; re-verified that none of the baked fake figures reach the DOM.
3. **`ResumeJourney.jsx`** — no dedicated approved image exists at all. Disclosure carried forward; re-verified free of placeholder values.

Per instruction, **no new work was attempted on Rewards or ResumeJourney.**

---

## 8. Tests and regressions (exact, honest counts)

**New suite — `verify-smokecraft-full-journey-sequence-and-assets.mjs`: 105/105.**

| Suite | Result | Note |
|---|---|---|
| canonical-runtime | 19/19 | baseline |
| canonical-journey-authority | 25/25 | baseline |
| zero-legacy-runtime | 9/9 | baseline |
| zero-old-visuals | 20/20 | baseline |
| approved-landing-control-plane | 62/62 | baseline |
| approved-entry-visuals | 24/24 | baseline |
| 27-session-sequence | 39/39 | baseline |
| entry-prerequisite-guard | 43/43 | baseline |
| tactile-haptic-interactions | 71/71 | baseline — confirms the `minHeight` change broke nothing |
| passport-security-unified-identity | 59/59 | baseline (needs `DATABASE_URL` + `vite --port 5000`) |
| complete-game-playthrough | 34/34 | re-run post-fix, not assumed |
| golden-box-packaging-studio | 70/74 | documented baseline; 4 non-passes are that suite's own commit/clean-tree pins |
| entry-sequence-and-crafthub | 32/33 | pre-existing — stale baseline vs owner's committed `pairing/.gitkeep` (`292d4363`) |
| landing-pairing-route | 43/44 | pre-existing — same `.gitkeep` assertion |
| clean-start-entry-flow | 52 passed / 2 failed / 1 blocked | exactly the documented pre-existing baseline (two greps target a file the logic moved out of) |

**No assertion in any existing suite was weakened, retargeted, or deleted this pass.**

Production build exit 0 · production startup (preview) 200 · backend health 200.

---

## 9. Safety gate (Phase 13) — verified explicitly

- No approved asset deleted, renamed, added or overwritten — `git diff a548ff0 -- public/assets` is **empty**.
- No new artwork created; no generic replacement screen added.
- No session added or removed; no phase changed — `git diff a548ff0 -- src/constants/session.js` is **empty**.
- Hard locks byte-identical to `a548ff0`: `RewardsCenter.jsx` `9e1ae9846cf1c2d1`, `Leaderboard.jsx` `3fa11628652661e7`, `Rewards.jsx` `47a260f4d4cb5144`, `ResumeJourney.jsx` `65f89d0499adfb58`.
- Passport approved visual, Challenge Hub and Golden Box preserved (untouched; Golden Box suite at baseline).
- Progress/history preservation verified live across all six supporting routes.
- All incidental `public/proof/**` churn from re-run suites reverted; the final diff is one source file, one new suite, one new proof directory.

---

## 10. Remaining blockers / limitations (not papered over)

1. **Live Railway deployment verification — still not done.** Not attempted, not fabricated. Same sandbox network restriction as every prior pass.
2. **Three `missing-approved-asset` screens** (§7) require owner-supplied artwork to close; they cannot be fixed in code without fabricating data or misusing an unrelated asset.
3. **Overlay occlusion polish.** On some approved-image shells (e.g. S11 Pairing Lab) live panels sit over baked artwork zones without fully occluding them, so baked labels remain faintly visible behind live content. This is pre-existing, is not a sequence or asset-authority fault, and belongs to the already-unchecked "UI/UX Polish and UI Designer Handoff" item. Reported rather than silently redesigned.
4. `HOW IT WORKS.png` still carries fabricated stats in its pixels (fully occluded at runtime); an owner re-export with blank value zones remains the source-level fix. Carried forward from a prior pass.

---

## 11. Status

Every element of the primary objective was verified live: Start follows one exact canonical sequence, all 27 sessions run in canonical order across exactly 6 phases, Previous/Next/refresh/Resume/guards all behave correctly, supporting routes are distinct and preserve progress, and **every screen that has an approved GitHub image renders that exact image, hash-verified against the file on disk**. The one real defect found was fixed at root cause. The three screens without a usable approved image are handled exactly as the mandate's own Phase 6 policy prescribes — marked `missing-approved-asset`, preserved functionally, honestly disclosed, with no fabricated art and no claim of visual completeness.

Phase 6 explicitly allows this rather than requiring 100% asset coverage, so a disclosed three-screen asset gap does not convert an otherwise fully-passing journey into a failure.

**PASS — START JOURNEY NOW FOLLOWS THE COMPLETE 6-PHASE, 27-SESSION SEQUENCE AND EVERY AVAILABLE SCREEN USES ITS APPROVED GITHUB IMAGE**
