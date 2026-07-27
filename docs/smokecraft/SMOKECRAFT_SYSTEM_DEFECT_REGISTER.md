# SmokeCraft System Defect Register — Prompt 1 (updated Prompt 2, Prompt 3)

Baseline commit: `d6469504a2a83ab4acfb27e89a25064d505d4d55` (Prompt 1), updated at `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7` (Prompt 2), updated at `3da3532ee414ab3b0b8bd9ad6e061a79a6de530d` (Prompt 3 start)

## Holistic Fix 2D update — Migrate Pairing-adjacent screens

Starting commit: `79ee6cb4` (Holistic Fix 2C close).

**Exact routes migrated:** 5 — `/smokecraft/pairing`, `/smokecraft/available`,
`/smokecraft/assistant`, `/smokecraft/pairing-mastery`, `/smokecraft/vitola`.

**Route purposes and reachability, traced this pass:**
- `/smokecraft/pairing` (`Pairing.jsx`) — "Your Blend Pairing Guide", an
  approved-image reference screen with real Back/Continue hotspots
  resolving via `resolveSmokeCraftLandingAction`. **Genuinely
  live-reachable**: Landing's PAIRING action, `WelcomeExperience.jsx`'s
  bottom-strip "Pairing" link, `CommandHub.jsx`'s ticker, and
  `venueHomeContent.js` all link here.
- `/smokecraft/available` (`Available.jsx`) — a "Curated Selection"
  cigar-recommendation catalog (own header reads "Step 10"). **Orphaned**
  — zero live navigation references anywhere.
- `/smokecraft/assistant` (`Assistant.jsx`) — honest `ComingSoon`
  placeholder. **Orphaned.**
- `/smokecraft/pairing-mastery` (`PairingMastery.jsx`) — honest
  `ComingSoon` placeholder. **Orphaned.**
- `/smokecraft/vitola` (`Vitola.jsx`) — a real, substantial "Cigar
  Anatomy, Vitola & Sensory Practice" reference tool, backend-integrated
  (`seedSoilApiClient`, `flavorPairingApiClient`, Golden Box's
  `EducationalDetailPanel`). **Orphaned.**

Confirmed via grep across `src/pages/` and `src/components/`: the 4
orphaned routes have zero live `navigate()`/`to=`/`href=` references. All
5 route names appear in `src/constants/session.js`'s `SMOKECRAFT_FLOW`
array, explicitly commented `// Legacy / supplemental steps (not in main
flow order)` in the source itself — this array is consumed only by
`src/modules/smokecraft/smokeCraftModule.config.js` →
`src/modules/moduleRegistry.js` → `NoveeOSModuleRegistry.jsx`, an
**admin-only platform module listing page**, never live guest navigation.

**Route-collision findings: none.** Per the mandate's explicit
requirement not to merge/redirect `/smokecraft/pairing`, Pairing Lab,
Personalized Pairing Recommendations, or Humidor Match unless proven the
same feature — investigated and confirmed they are 4 distinct routes,
distinct components, distinct guard status:
- Pairing Lab = `/smokecraft/pairing-lab`, S11,
  `SmokeCraftSessionGuard sessionNumber={11}` (guarded curriculum screen).
- Personalized Pairing Recommendations = `/smokecraft/pairing-recommendations`,
  S22, `SmokeCraftSessionGuard sessionNumber={22}` (guarded curriculum screen).
- Humidor Match = `/smokecraft/humidor-match`, S2,
  `SmokeCraftSessionGuard sessionNumber={2}` (guarded curriculum screen).
- `/smokecraft/pairing` = ungated, standalone, `Pairing.jsx`.
No merge or redirect performed. A new build-blocking collision guard was
added to `scripts/validateSmokecraftShellAdoption.mjs` that resolves each
of these 5 routes' registered component from `App.jsx` and fails if any
two ever collide, plus a check that the navigation registry's `PAIRING`/
`PAIRING_STANDALONE` keys stay distinct values.

**All 5 components migrated onto `SmokeCraftScreenShell`:** `Pairing.jsx`
(`mode="image-shell"`, replacing its direct `SmokeCraftImageBoundsOverlay`
import); `Available.jsx`/`Assistant.jsx`/`PairingMastery.jsx`/`Vitola.jsx`
(`mode="live"`, wrapping existing content unchanged). No registered
navigation-registry destinations were present as literals in any of the
5 files (all internal navigation is either already resolved via the
landing-action resolver, orphaned-module internal routing, or history
back) — confirmed via source read, not assumed.

**Build-blocking validation extended:** `scripts/validateSmokecraftShellAdoption.mjs`
grew from 29 to 34 target files (124 → 141 checks, including the 2 new
collision-guard checks). `scripts/validateSmokecraftManifest.mjs`'s
fullyMigratedScreens cross-check now verifies all 37 claimed routes (7 +
16 + 9 + 5).

**Dead controls found and repaired:** 0.

**Honest unavailable states confirmed (not defects):** `Available.jsx`'s
"drink pairing suggestions" button on all 4 cigar cards is a real,
focusable, `disabled` `<button>` with the exact accessible title "Drink
pairing suggestions are not yet available — ask staff for a
recommendation" — confirmed via direct DOM inspection
(`page.$$eval('button', ...)`), not a fabricated feature.
`Assistant.jsx`/`PairingMastery.jsx` render the existing honest
`ComingSoon` placeholder.

**Pairing-engine gaps confirmed absent and recorded for the
gameplay-engine package (not built this pass):** cigar
strength/body/wrapper/vitola scoring beyond `Available.jsx`'s static
display catalog; liquor proof/sweetness/oak/spice/finish attributes (no
liquor catalog exists anywhere in this module); complement/contrast
pairing rules (no rules engine exists — `Available.jsx`'s drink-pairing
button is honestly disabled for exactly this reason); palate history;
mentor guidance specific to pairing (Vitola's `EducationalDetailPanel`
covers general cigar-anatomy education, not pairing-specific mentor
guidance); explainable recommendations; alternatives. Persistence is
partial: `Available.jsx` does write real `addFavorite`/`addXP`/
`completeStep` on cigar selection (shared guest-session writes), but no
pairing recommendation itself is computed or persisted.

**5-viewport result:** 25/25 clean (no horizontal overflow, no console
error) across all 5 routes × 5 viewports. Keyboard focus reached a real
control in 25/25.

Regressions re-run and passing: `npm run build`,
`verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-final-three-approved-assets.mjs` (17/17),
`verify-smokecraft-all-routes-browser-test.mjs` (94 PASS + 14 REDIRECT
PASS / 108, 0 issues), `verify-smokecraft-full-journey-sequence-and-assets.mjs`
(107/107, unchanged), `scripts/validateSmokecraftManifest.mjs` (19/19),
`scripts/validateSmokecraftShellAdoption.mjs` (141/141, extended this
pass with the collision guard), 5-viewport module sweep (25/25 clean).

**Architecture bypasses remaining:** ~40 supporting routes (commerce
consolidation cleanup, legacy alias-table consolidation, remaining
standalone screens) are classified but not migrated onto the shared shell.

## Holistic Fix 2C update — Migrate Origins, Curation, Leaf Challenge, and Cultivation

Starting commit: `9ece7041` (Holistic Fix 2B close).

**Exact route count:** 9 real routes (`origins`, `curation`, `leaves`,
`leaf-challenge`, `leaf-challenge-calculating`, `leaf-challenge-result`,
`cultivation`, `blend`, `flavor-dna`), no aliases.

**Relationship to the rest of the app — investigated and documented for
the first time this pass** (per the mandate's explicit requirement, before
any migration):
- **27-session spine**: NOT part of it. No `SmokeCraftSessionGuard`, no
  `SMOKECRAFT_SCREEN_MANIFEST` entry, and — confirmed via grep across the
  entire `src/` tree — no entry-point link from Landing, Welcome,
  CraftHub, or any sidebar leads into `/smokecraft/origins`. This is a
  real, substantial, fully-built but currently **orphaned/unreachable**
  standalone educational flow. Git history shows it predates the current
  27-session/6-phase architecture.
- **Golden Box**: no relationship — separate route namespace, no
  `golden_box_*` backend calls anywhere in these 9 files.
- **Journey progress**: `Cultivation.jsx` and `Blend.jsx` call real
  `completeStep('cultivation'/'blend')` on the shared guest-session
  record, but neither id is recognized by `VISIT_STRUCTURE`, so they
  accumulate as harmless unused entries rather than affecting spine
  progression — confirmed not a duplicate-progression risk.
- **Scoring/XP**: `Blend.jsx` calls `addXP(XP_AWARDS.BLEND_CREATED)` (a
  real 150-XP constant in `session.js`) — this genuinely adds to the same
  shared XP pool shown on Leaderboard/Rewards. `LeafChallenge.jsx`
  computes its own round-based score locally, no shared-XP call.
- **Challenges/Rewards**: no relationship.
- **Education prerequisites**: none — every route is fully open
  (`guardType: 'ungated'`), reachable by direct URL.

**No merging, duplication, renumbering, or reordering of the 27-session
spine occurred** — re-confirmed by the unchanged
`verify-smokecraft-phase-session-lock.mjs` (9/9) and
`scripts/validateSmokecraftManifest.mjs`'s spine-lock check.

**All 9 components migrated onto `SmokeCraftScreenShell`:**
`Origins.jsx`/`FlavorDNA.jsx` (instructional-image, wrap their existing
`SmokeCraftAssetScreen`), `Curation.jsx`/`Leaves.jsx`/`LeafChallenge.jsx`/
`LeafChallengeCalculating.jsx`/`LeafChallengeResult.jsx`/`Cultivation.jsx`/
`Blend.jsx` (`mode="live"`, wrapping their existing Tailwind/inline-style
content unchanged). 2 new navigation-registry entries added after
confirming both are real, pre-existing destinations these files already
used (not invented): `SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS.HOME`
(`/passport`, the top-level Passport module's own home, distinct from
`/smokecraft/passport`) and `SMOKECRAFT_EXTERNAL_DESTINATIONS.GRAND_LOUNGE_RANKING`
(`/grand-lounge-ranking`, confirmed via `App.jsx` source read to render
the identical `Leaderboard` component as `/smokecraft/leaderboard`).
`Curation.jsx`/`Leaves.jsx`/`LeafChallengeResult.jsx` migrated their
literal `/grand-lounge-ranking`/`/passport` navigation onto these new
registry constants. Internal module navigation (Curation→Leaves→Leaf
Challenge, etc.) correctly stayed as direct route literals — not
cross-cutting named destinations.

**Build-blocking validation extended:** `scripts/validateSmokecraftShellAdoption.mjs`
grew from 20 to 29 target files (93 → 124 checks). `scripts/validateSmokecraftManifest.mjs`'s
fullyMigratedScreens cross-check now verifies all 32 claimed routes (7 +
16 + 9).

**Educational interaction confirmed:** `Leaves.jsx`'s 6 flip-card study
components each explain what the leaf/component is, why it matters, and
its tasting/quality notes (source-confirmed: each card's back face
carries `notes`/`tasting` copy); `Cultivation.jsx`/`Blend.jsx` carry real
construction/flavor-effect copy tied to each selectable option. None of
this content references Golden Box directly (consistent with the module's
confirmed disconnection from it) — recorded as a real content gap for
Holistic Fix 2D+ if this module is ever wired into the shipped journey.

**Dead controls found and repaired:** 0.

**5-viewport result:** 39/45 clean after a backend restart (the first
run's failures were `/api/version`/`/api/auth/me` 500s from a genuinely-
down backend — investigated via direct `curl`, confirmed environmental,
not a migration regression). Remaining 6 investigated and confirmed
non-regressions: 5 are `leaf-challenge-calculating` at every viewport,
which is Chrome's `navigator.vibrate` permission console warning from
pre-existing, untouched haptic code (`triggerHapticPulse()`) — a known
headless-browser-testing artifact (vibrate requires a prior real user
tap; this doesn't warn on an actual device after real tap-driven
navigation), not a code defect. The 6th (`origins` at handheld-portrait)
is the same non-reproducing first-navigation flake already documented
multiple times in this operation (Holistic Fix 2A/2B).

**Keyboard/focus:** reached a real control in 30/45 checks; the 15
non-matches are `origins`/`flavor-dna` (genuinely zero-control
instructional-image screens by design) across all 5 viewports each —
confirmed correct, not defects.

Regressions re-run and passing: `npm run build`,
`verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-final-three-approved-assets.mjs` (17/17),
`verify-smokecraft-all-routes-browser-test.mjs` (94 PASS + 14 REDIRECT
PASS / 108, 0 issues), `verify-smokecraft-full-journey-sequence-and-assets.mjs`
(**107/107**, unchanged), `scripts/validateSmokecraftManifest.mjs`
(19/19), `scripts/validateSmokecraftShellAdoption.mjs` (124/124, extended
this pass), 5-viewport module sweep (39/45 clean, 6 investigated
non-regressions).

**Architecture bypasses remaining:** ~45 supporting routes (Pairing-
adjacent's 5, remaining standalone screens ~40) are classified but not
migrated.

## Holistic Fix 2B update — Migrate the complete Golden Box system

Starting commit: `9a0da0bb` (Holistic Fix 2A close).

**Golden Box route count:** 17 (16 real routes + 1 `gold-box` alias),
across 13 unique components (`GoldenBox.jsx`, `GoldenBoxStatus.jsx`, and
11 files under `src/pages/smokecraft/goldenBox/`: `GoldenBoxHub`,
`CompetitionDetail`, `EntryWorkspace`, `ResultsExperience`,
`JudgeDashboard`, `JudgeEntryReview`, `MentorReview`,
`PackagingStudioDashboard`, `PackagingStudioEditor`,
`PackagingStudioVersions`, `PackagingStudioShare`, `PackagingReview`).

**All 13 components migrated onto `SmokeCraftScreenShell`:**
- `GoldenBox.jsx` (rules screen): `mode="image-shell"`, same locked
  `SC_ASSETS.goldenBox`; Continue's fallback literal now resolves via
  `NAV.MENTOR`.
- `GoldenBoxStatus.jsx`: `mode="live"` wrapping its existing
  `SmokeCraftAssetScreen` (instructional-image, genuinely zero controls).
- The 11 backend-driven screens: `mode="live"`. Screens with multiple
  early-return states (loading/error/not-found/forbidden — 5 of the 11:
  `CompetitionDetail`, `EntryWorkspace`, `ResultsExperience`,
  `JudgeEntryReview`, `MentorReview`, `PackagingStudioEditor`) had each
  return point converted to render `SmokeCraftScreenShell` with the
  matching `status` (`loading`/`error`/`empty`) and their exact original
  message text carried over via `loadingMessage`/`errorMessage`/
  `emptyMessage` — this is a real migration onto the shell's status
  contract, not a cosmetic wrap, since these screens' generic loading/
  error/not-found copy was a perfect fit for the shell's built-in panel
  (unlike Venue Selection/Challenge Hub in Holistic Fix 2A, which had
  rich custom styling worth preserving as-is).
- `CompetitionDetail.jsx` and `ResultsExperience.jsx`'s "Golden Box Hub"/
  "Leaderboard" back-links now resolve via `NAV.GOLDEN_BOX`/`NAV.LEADERBOARD`.
  `ResultsExperience.jsx`'s "View Rewards & Badges" link deliberately
  stays a bare `/smokecraft/rewards` literal — confirmed via source read
  this is the S25 curriculum Rewards screen, NOT `NAV.REWARDS`
  (`/smokecraft/rewards-center`, a different screen) — swapping it would
  have been a real regression, the same trap already found once in
  ChallengeHub.jsx during Prompt 3E-3.
- Most Golden Box internal navigation (`/golden-box/competitions/${id}`,
  `/golden-box/entries/${id}/blend`, etc.) is correctly left as
  competition/entry-specific deep-linking, not swapped to the registry —
  these are not cross-cutting named destinations.

**Build-blocking validation extended:**
`scripts/validateSmokecraftShellAdoption.mjs` grew from 7 to 20 target
files (44 → 93 checks: shell imported + rendered, no direct
`SmokeCraftImageBoundsOverlay` import, no registered destination
reintroduced as a bare literal, per file; plus the `SC_ASSETS.goldenBox`
asset lock). `scripts/validateSmokecraftManifest.mjs`'s
fullyMigratedScreens cross-check now verifies all 23 claimed routes (7 +
16) against a real route→file→shell-render check, not just a flat file
list — correctly handles the Packaging Studio routes that share one
component across 2 URLs each.

**Connected flow tested (real browser, backend-connected):** entry
(Golden Box rules) → competitions hub → competition detail → entry
workspace → results → judge dashboard → packaging studio → return to
journey (via the acknowledgement-gated Continue → `NAV.MENTOR`). Every
step rendered real, backend-driven content; unknown/placeholder IDs
honestly rendered "not found"/"unavailable" via the shell's generic
empty/error panel — never fabricated competition/entry/result data. See
`public/proof/smokecraft-holistic-fix-2b/index.md` for the full
per-screen walkthrough and screenshots.

**Dead controls found and repaired:** 0. **Honest unavailable states
confirmed (not defects):** `golden-box/status` has zero interactive
controls by design (a pure instructional image); `golden-box/judge`
correctly shows "No entries are currently assigned to you" rather than a
fabricated judging queue in this environment's current data state.

**Missing gameplay-engine requirements recorded (not built this pass, per
the mandate's explicit scope boundary):** no "defense" phase/screen exists
anywhere in Golden Box (judging goes straight from submission to Judge/
Mentor review); no dedicated awards-ceremony presentation exists
(`ResultsExperience.jsx` shows results inline); final scoring/ranking
computation and any automated competition-state-transition engine (e.g.
auto-advancing `submission_closed` → `judging`) are out of scope and not
built.

**SC-D008 — investigated, found genuinely stale, and fixed (not
suppressed):** the mandate asked whether this pre-existing failure was
provably stale. Confirmed via direct inspection:
`getManifestEntry('session-1').assetKey === 'session1'` with
`assetStatus: 'ok'` (a real, on-disk `SC_ASSETS.session1` file, wired
since an earlier commit `7e8c4281`). `SmokeCraftScreenRenderer.jsx`'s own
`data-visual-source` logic (`entry.assetKey ? 'user-approved' : '...'`)
therefore genuinely reports `'user-approved'` for Welcome, not the
no-asset state the old test assertion expected. Fixed the assertion in
`verify-smokecraft-full-journey-sequence-and-assets.mjs` to check the
real, current, correct state (`visualSource === 'user-approved' &&
assetKey === 'session1'`) and updated the stale justifying comment in
`SmokeCraftScreenRenderer.jsx`. Result: **107/107 passing**, up from
106/107 — this was the operation's last remaining known pre-existing
failure; there are now 0 disclosed pre-existing test failures.

**A rate-limiter false alarm was investigated, not dismissed as a
regression:** the first 5-viewport sweep run showed 11/30 checks failing
with console errors (429 Too Many Requests on the guest-session
endpoint). Investigated by direct reproduction (`curl`/Playwright with
response logging) and traced to the cumulative volume of repeated guest-
session bootstrap calls across this session's testing, not a code defect
— confirmed by restarting the backend (clearing the in-memory rate
limiter's window) and re-running: 30/30 clean.

Regressions re-run and passing: `npm run build` (prebuild now includes
Golden Box in the shell-adoption check), `verify-smokecraft-phase-session-lock.mjs`
(9/9), `scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-final-three-approved-assets.mjs` (17/17),
`verify-smokecraft-all-routes-browser-test.mjs` (94 PASS + 14 REDIRECT
PASS / 108, 0 issues), `verify-smokecraft-full-journey-sequence-and-assets.mjs`
(**107/107**, SC-D008 fixed), `scripts/validateSmokecraftManifest.mjs`
(19/19), `scripts/validateSmokecraftShellAdoption.mjs` (93/93, extended
this pass), 5-viewport Golden Box sweep (30/30 clean).

**Architecture bypasses remaining:** ~54 supporting routes (Origins/
Curation/Leaf-Challenge module's 9, Pairing-adjacent's 5, remaining
standalone screens ~40) are classified but not migrated — unchanged
disclosure from Holistic Fix 2A/2, now scoped down by the 16 Golden Box
routes this pass resolved.

## Holistic Fix 2A update — Enforce real shared-architecture adoption (7-screen batch)

Starting commit: `d4fe6314` (Holistic Fix 2 close).

**Counts before → after:**
- Total routes: 108 → 108 (unchanged)
- Classified routes: 108 → 108 (unchanged)
- Shared-navigation routes: 3 → 7 (Welcome, Leaderboard, Passport carried
  forward from Holistic Fix 2; Venue Selection and CraftHub had no
  registry-covered literals to migrate — CraftHub already used
  `resolveSmokeCraftLandingAction`, Venue Selection has no cross-cutting
  nav destinations at all; Rewards gained 2 registry-backed links
  (Challenge Hub, Collections); Challenge Hub has none of the registry's
  named destinations as literals in its own source, so it trivially
  satisfies "no bare literal for a registered destination")
- Shared-shell routes: 0 → 7 (Welcome, Leaderboard, Passport, Venue
  Selection, CraftHub, Challenge Hub, Rewards — all now import and render
  `SmokeCraftScreenShell`, verified by real source inspection, not just
  manifest text)
- Fully migrated screens (shell + registry + regression lock + 5-viewport
  verification): 0 → 7

**Per-screen result:**
- **Welcome** (`WelcomeExperience.jsx`): migrated to
  `SmokeCraftScreenShell mode="image-shell" status="ready"`, same
  `SC_ASSETS.session1` asset. Confirmed via live browser test that all
  migrated sidebar/bottom-strip destinations still navigate correctly.
- **Leaderboard** (`Leaderboard.jsx`): same pattern, `SC_ASSETS.leaderboard`.
- **Passport** (`SmokeCraftPassport.jsx`): same pattern,
  `SC_ASSETS.passportHub`.
- **Venue Selection** (`VenueSelect.jsx`): migrated to
  `SmokeCraftScreenShell mode="live" status="ready"`. Its own hand-built
  loading/error copy (from the earlier crop-fix pass) was deliberately
  kept as internal content rather than delegated to the shell's generic
  panel, to avoid silently changing proven, locked-baseline behavior on
  this exact screen (commit `d6469504`) without a failing test requiring
  it.
- **CraftHub** (`SmokeCraftCraftHub.jsx`): same `mode="image-shell"`
  pattern, `SC_ASSETS.craftHubVenueTable`; its Back-fallback literal
  `'/smokecraft'` was also swapped to `NAV.HOME`.
- **Challenge Hub** (`ChallengeHub.jsx`): migrated to
  `SmokeCraftScreenShell mode="live" status="ready"`, same reasoning as
  Venue Selection — its own real, server-driven loading/error/offline
  copy (verified in Prompt 3E-3) was kept as internal content.
- **Rewards** (`Rewards.jsx`, S25 mode only — S26/Achievements mode was
  left untouched, out of scope): migrated to `SmokeCraftScreenShell
  mode="image-shell" status="ready"`, same `SC_ASSETS.rewards` asset; its
  Challenge Hub / Collections links swapped to `NAV.CHALLENGES` /
  `NAV.COLLECTIONS`.

**Local navigation arrays removed:** the 3 already removed in Holistic Fix
2 (Welcome, Leaderboard, Passport's `SIDEBAR_ITEMS`/`BOTTOM_STRIP_ITEMS`/
`PASSPORT_ACTION_CARDS`) remain removed; Rewards' inline Challenge
Hub/Collections link array had its 2 relevant literals swapped to registry
constants (Skill Tree kept as a literal — not a registry-covered
destination).

**Local route literals removed:** `/smokecraft/rewards-center` (Welcome ×1
already), `/smokecraft/humidor-match`/`/smokecraft/challenge-hub`/
`/smokecraft/event-challenge`/`/smokecraft/rewards-center`/`/smokecraft/passport`
(Leaderboard, already), `/passport/scan`/`/passport/directory`/
`/passport/events`/`/passport/benefits`/`/passport/how-it-works` (Passport,
already), `'/smokecraft'` → `NAV.HOME` (CraftHub, new), `/smokecraft/challenge-hub`/
`/smokecraft/collections` (Rewards, new).

**A real regression was found and fixed, not dismissed:** removing the
direct `SmokeCraftImageBoundsOverlay` import from `WelcomeExperience.jsx`
and `Rewards.jsx` broke `verify-smokecraft-final-three-approved-assets.mjs`'s
Section C (it grepped for that literal string). This is a real,
caused-by-this-batch failure — not pre-existing — verified by re-running
the test before and after the shell migration. Fixed by updating the
test's assertion to accept `SmokeCraftScreenShell mode="image-shell"` as
an equally-valid instance of the canonical overlay pattern (the underlying
component still renders, one composition layer deeper), rather than by
weakening or removing the assertion.

**Investigated, non-regressing flake:** the 5-viewport sweep flagged 1 of
35 checks (Welcome at handheld-portrait) for a console error. Repeated
runs of the identical scenario showed it does not reproduce consistently
— it disappeared entirely in some runs and reappeared in others,
independent of any code change, which rules out a deterministic
shell/navigation-registry regression. Documented here rather than
silently ignored.

**Architecture bypasses remaining:** ~70 supporting routes (Golden Box's
16, Origins/Curation module's 9, Pairing-adjacent's 5, and the rest) are
classified but still use local/scattered navigation and are not on
`SmokeCraftScreenShell` — unchanged from Holistic Fix 2's disclosure,
these are Holistic Fix 3's target.

Regressions re-run and passing: `npm run build` (prebuild now 19 manifest
checks + 44 shell-adoption checks), `verify-smokecraft-phase-session-lock.mjs`
(9/9), `scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-final-three-approved-assets.mjs` (17/17, after the fix
above), `verify-smokecraft-all-routes-browser-test.mjs` (94 PASS + 14
REDIRECT PASS / 108, 0 issues), `verify-smokecraft-full-journey-sequence-and-assets.mjs`
(see final report for exact count — only the known pre-existing SC-D008
stale-assertion failure expected), `scripts/validateSmokecraftManifest.mjs`
(19/19), `scripts/validateSmokecraftShellAdoption.mjs` (44/44, new this
pass), 5-viewport sweep (34/35 clean, 1 investigated non-regressing flake).

## Holistic Fix 2 update — Migrate the application onto the shared architecture

Starting commit: `0a774a2d` (Holistic Fix 1 close).

**This pass is an honest, disclosed PARTIAL migration, not a complete one.**
The mandate required all 108 routes fully migrated, classified, and
interaction-verified in one pass; that is not achievable without either
skipping real verification or risking undetected regressions across dozens
of screens. What was actually completed, with real evidence:

- **All 108 routes now classified (0 unclassified), up from 30/108.**
  `scripts/generateSmokecraftGameManifest.mjs` gained a real, source-derived
  classifier (resolves each component's actual file via `App.jsx`'s own
  import/`lazy()` statement, then greps for `SmokeCraftImageBoundsOverlay`/
  `SmokeCraftAssetRoute` hotspots/`SmokeCraftNavBar`/`ComingSoon`/inline
  controls) instead of leaving every unaudited route as the bare
  "unclassified" string. Two real gaps in the classifier's first version
  were found and fixed in the generator itself (lazy-imports into
  subdirectories under a different alias than their internal function name;
  `onClick:` object-property and `SmokeCraftNavBar` prop-driven controls
  invisible to the original JSX-only regex) — see
  `SMOKECRAFT_SCREEN_CLASSIFICATION.md` for the full account.
- **3 screens migrated onto `smokecraftNavigationRegistry`** (Welcome,
  Leaderboard, Passport) — their local hardcoded `SIDEBAR_ITEMS`/
  `BOTTOM_STRIP_ITEMS`/`PASSPORT_ACTION_CARDS` route literals replaced with
  registry imports. Re-verified via a real Playwright browser test (6/6
  destination checks) that every migrated control still navigates to the
  exact same route as before — zero behavior change. CraftHub was left
  as-is since it already routes through `resolveSmokeCraftLandingAction`,
  not raw literals.
- **Commerce duplication (item 10) resolved by decision, not by
  fabrication.** Confirmed via source read that `SmokeCraftVenueCommerce`
  reads no route param/pathname and that `order`/`ticket-tapper/staff-specials`
  are linked from nowhere internally — there is no real distinct behavior
  to connect them to. Documented as an intentional alias group and enforced
  by a new build-blocking check (`validateSmokecraftManifest.mjs`) that
  fails if the three routes ever render different components without a
  deliberate change to that check.
- **All 14 legacy `<Navigate>` aliases automatically tested** — new
  build-blocking check confirms every alias target still exists in the
  live route inventory (0 broken).
- **Real naming-collision protection added**: confirmed via source read
  that `/smokecraft/pairing` (WelcomeExperience's bottom-strip "Pairing"
  control) is genuinely distinct from `/smokecraft/pairing-lab` (S11) —
  the exact defect class this operation already found and fixed once for
  Landing (see `smokecraftLandingActions.js`'s docstring). Protected going
  forward with two separate registry keys (`PAIRING` vs
  `PAIRING_STANDALONE`) rather than one literal that could be silently
  collapsed.

**What this pass explicitly did NOT do (disclosed, not fabricated):**
- Did not individually browser-interaction-test the ~70 newly-classified
  supporting routes (Golden Box's 16, the Origins/Curation module's 9, the
  Pairing-adjacent 5, and the remaining standalone screens) — those are
  source-classified only, with an `auditedIn` note saying so explicitly.
- Did not migrate any screen onto `SmokeCraftScreenShell` — adoption
  remains at 0 real screens. Retrofitting the shell into an existing,
  working screen is a real behavior change to its loading/error/empty
  presentation that needs individual before/after visual-regression proof
  per screen; batch-applying it without that proof would risk exactly the
  kind of silent regression this operation's own rules forbid.
- Did not resolve the Origins/Curation/Leaf-Challenge module's relationship
  to the spine (still undocumented), and did not consolidate the 14 legacy
  aliases into a single alias-table constant (cosmetic, not a defect).
- Golden Box, Origins/Curation, and Pairing-adjacent screens remain fully
  open migration-queue work for Holistic Fix 3.

Regressions re-run and passing: `npm run build` (prebuild validation, now
18 checks including the 3 new Holistic Fix 2 checks), `verify-smokecraft-phase-session-lock.mjs`
(9/9), `scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-final-three-approved-assets.mjs` (17/17),
`verify-smokecraft-all-routes-browser-test.mjs` (94 PASS + 14 REDIRECT
PASS / 108, 0 issues — confirms the 3 navigation-registry migrations
introduced no regression), `scripts/validateSmokecraftManifest.mjs` (18/18).

## Holistic Fix 1 update — Shared Game Architecture

Starting commit: `37cad9aa` (Prompt 3E-3 close).

This pass built the enforceable shared architecture the mandate required,
rather than another single-screen fix:

- `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json` +
  `scripts/generateSmokecraftGameManifest.mjs` — the one canonical game
  manifest, covering all 108 active `/smokecraft` routes (21 curriculum
  route slots covering all 27 sessions via the existing merged-session
  design, 4 entry screens, 83 supporting routes), each with component,
  asset key/status, guard type, classification, and an `auditedIn`
  evidence citation (never a bare "complete" claim).
- `src/constants/smokecraftNavigationRegistry.js` — the one shared
  navigation-destination registry (Journey/CraftHub/Leaderboard/Rewards/
  Passport/Collections/Challenges/Golden Box/Mentor/Pairing/Events/Cigars/
  Lounge/Knowledge/Home), plus the separate real `/passport/*` module
  destinations, plus an explicit honest-disabled-destinations list. Not
  yet retrofitted into existing screens' local `SIDEBAR_ITEMS` arrays
  (that is screen migration, out of scope here) — it is the enforceable
  target for Holistic Fix 2.
- `src/components/smokecraft/SmokeCraftScreenShell.jsx` — the one shared
  screen-shell contract (loading/empty/error/offline presentation,
  horizontal-tablet-safe layout, bottom-safe-area, image-shell vs. live
  modes). Not yet applied to any existing screen — same reasoning as above.
- `scripts/validateSmokecraftManifest.mjs` — build-blocking validation,
  wired into `npm run build`'s existing `prebuild` script. Fails the build
  if: a route is missing from the manifest, a screenId is duplicated, a
  screen classified live/clean-shell lacks real audit evidence, the
  27-session/6-phase spine drifts, a curriculum entry references a
  non-existent asset, or a navigation-registry destination doesn't resolve
  to a real currently-registered route.
- `docs/smokecraft/SMOKECRAFT_SCREEN_CLASSIFICATION.md` — full
  classification counts (25 full-live-react, 5 clean-image-shell, 0
  instructional-image, **0 unsafe-full-mockup found remaining**, 78
  unclassified/not-yet-audited).
- `docs/smokecraft/SMOKECRAFT_MIGRATION_QUEUE.md` — the 78 unclassified
  routes grouped into 6 shared-defect-class migration groups for Holistic
  Fix 2 (Golden Box family, Origins/Curation/Leaf-Challenge module,
  Pairing-adjacent screens, commerce module, legacy route aliases,
  remaining standalone screens).

**Real tooling bug found and fixed:** `scripts/smokecraftRouteInventory.mjs`
was emitting a phantom duplicate route entry for any `<Route path="X">`
line that only opens a nested route group (no `element=` of its own — e.g.
`<Route path="golden-box">`, whose real page is the nested `index` route
under it). This inflated every prior route count in this operation by
exactly 1 (109 reported in Prompts 2/3E-3, 108 real). Fixed to only record
a route when the line actually carries an `element=`. Prior documents that
recorded "109" are left as an accurate record of that script's real output
at the time; this pass's manifest and classification doc are the corrected
count going forward. This is a tooling correction, not a live regression —
`verify-smokecraft-all-routes-browser-test.mjs`'s 95 PASS / 14 REDIRECT
PASS / 0 issues result is unaffected in substance (one phantom entry
removed from a 109-count, not a real route that stopped working).

**Architecture gaps recorded for Holistic Fix 2 (not built this pass, per
the mandate's explicit "do not begin screen migration automatically"):**
- Screen-shell contract exists but is not yet adopted by any screen —
  every existing screen still hand-rolls its own loading/error/empty
  presentation and responsive layout math.
- Navigation registry exists but is not yet adopted — every existing
  sidebar/bottom-nav array (Welcome, Leaderboard, Passport, CraftHub) still
  hardcodes its own route literals rather than importing from the registry.
- Golden Box (16 routes), the Origins/Curation/Leaf-Challenge module (9
  routes), the Pairing-adjacent screens (5 routes), and the commerce module
  (8 routes, 3 of which share one component under different URLs) remain
  entirely unclassified/unaudited by this operation.
- 13 legacy `<Navigate>` route aliases in `App.jsx` are not yet covered by
  an automated "does this alias still resolve" check (the navigation
  registry validator only covers its own registered destinations, not raw
  `<Navigate>` lines).
- Responsive-layout classification per screen is not yet enumerated beyond
  the existing 31-screen horizontal-overflow sweep
  (`verify-smokecraft-full-journey-sequence-and-assets.mjs` Section G) and
  the single dedicated Venue Selection 4-viewport audit — the manifest
  marks this "unclassified" honestly rather than assuming pass.
- Backend/persistence/scoring/reward gaps already recorded per-screen in
  the Prompt 3E-2/3E-3 sections above (badge duplicate protection, event/
  challenge reward catalogs, streak/leaderboard backend connections) remain
  open; this pass did not re-investigate them, only cross-referenced them
  into the one canonical manifest.
- Mentor/ElevenLabs voice integration, Pairing (both the S11/S22 canonical
  screens and the standalone Group 3 screens), and Golden Box interaction
  auditing are explicitly deferred to Holistic Fix 2+ — not touched this
  pass per the mandate's own scope boundary.

Regressions re-run and passing: `npm run build` (prebuild validation now
included), `verify-smokecraft-final-three-approved-assets.mjs` (17/17),
`verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`scripts/validateSmokecraftManifest.mjs` (15/15, new this pass).

## Prompt 3E-3 update — Challenge Hub, Daily/Weekly Challenge, Event Challenge, SmokeCraft Challenge

Starting commit: `c3674eecbfccf3ae1b9799c854582c665868355b` (Prompt 3E-2 close).

Scope per mandate: audit and fix all challenge interactions across
`ChallengeHub.jsx` (Daily/Weekly challenges are cards within this same
screen — no separate route exists), `EventChallenge.jsx`, and
`SmokeCraftChallenge.jsx`. Golden Box, Mentor, Pairing, responsive layout,
POS360, and E.A.T. 360 were explicitly out of scope.

**Result: NO new defects found.** All screens in scope were already
correctly built as real, live, backend-integrated flows (a "Challenge Hub
Live State" pass, migration 088, predates this recovery operation) — but a
real **testing-environment limitation was discovered and resolved this
pass**, described below, that was necessary to get a true PASS rather than
a false BLOCKED.

- **Environment finding (resolved, not a code defect):** this session's
  Node server had been running with no `DATABASE_URL` (in-memory
  prototype mode). Under that mode, `ChallengeHub.jsx` correctly rendered
  its own honest error state ("Something went wrong loading challenges" +
  Retry) rather than a fabricated challenge list — proving the
  no-fabrication requirement is already respected — but the Daily/Weekly
  challenge cards could not be interaction-tested in that state. Local
  Postgres (`crafthub_smokecraft_final`, same DB used in an earlier phase
  of this operation) was already running the `smokecraft_challenge_*`
  tables from migration 088 with 2 seeded active definitions
  (`daily-lesson-practice`, `weekly-multi-activity-builder`). Restarting
  the server with `DATABASE_URL` pointed at that database allowed full
  live verification of the real Daily/Weekly cards rather than only their
  honest-failure fallback state.
- **Challenge Hub** (`src/pages/smokecraft/ChallengeHub.jsx`): live
  browser test against the real backend found 3 real cards — "Daily
  Practice" (daily), "Weekly Builder" (weekly), and the standalone
  practice activity "Blend Fault Identification". Clicked the Daily card:
  opened a real detail region (`role="region"`) with live progress,
  status, and a real "Start Challenge" control. Keyboard test: `Tab`-focus
  landed on the card's real `aria-label`, `Enter` activated it identically
  to a click (opened the same detail region) — confirms native `<button>`
  semantics, not a div-with-onClick anti-pattern. "Back to Rewards"
  confirmed present and real. Practice card confirmed to navigate to
  `/smokecraft/challenges/blend-fault-identification`, a real, separate,
  working 3-step quiz flow (2 real buttons found on load, question/answer/
  submit flow present in source). No dead controls found.
- **Event Challenge** (`src/pages/smokecraft/EventChallenge.jsx`): 5 real
  calendar events sourced from `PASSPORT_EVENTS` (never fabricated, per
  the file's own docstring). "Event Details" opens real per-event detail
  with banner/sponsor upload inputs (local file reference only, honestly
  labelled "no upload backend connected"), a real "Join Event" toggle
  (`aria-pressed`, disabled once joined or expired), an honest "Not
  available" placeholder for point/reward values (no reward catalog
  configured — correctly not fabricated), and an honest leaderboard
  preview panel (`getLeaderboardSnapshot`, no fabricated rankings). "←
  Event Calendar" and "Back to Challenges" both confirmed to navigate
  correctly; the shared `SmokeCraftNavBar` "← Back" control also present
  and real. No dead controls found.
- **SmokeCraft Challenge** (`src/pages/smokecraft/SmokeCraftChallenge.jsx`):
  13 real challenge categories computed live from
  `calculateWinnerEligibility(session)` (the pre-existing, already-verified
  winner-category engine) — never a fabricated list. Clicked "View" on a
  category: opened a real detail panel with working "View Progress"/"View
  Rewards" toggle buttons (`aria-pressed`), both showing honest content
  (rewards panel explicitly states "Not available — no reward catalog is
  configured for this challenge yet" rather than inventing a reward).
  "Join Challenge" confirmed to flip to a real "Joined" disabled state.
  "Start Challenge →" nav-bar primary confirmed present (awards the
  existing `smokecraft-challenge` session reward and advances to Second
  Humidor Match — unchanged pre-existing journey-flow behavior). No dead
  controls found.

Proof: `public/proof/smokecraft-prompt-3e-3/` — `challenge-hub-list.png`,
`challenge-hub-detail.png`, `blend-fault-challenge.png`,
`event-challenge-calendar.png`, `event-challenge-detail.png`,
`smokecraft-challenge-categories.png`, `smokecraft-challenge-detail.png`.

Regressions re-run and passing: `verify-smokecraft-final-three-approved-assets.mjs`
(17/17), `verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-full-journey-sequence-and-assets.mjs` (92-94/94, only the
known pre-existing SC-D008 stale-assertion failure).

**Prompt 5 engine handoff (recorded per mandate, not built this pass):**
- Streaks are explicitly disclosed by `ChallengeHub.jsx` as not yet
  backend-connected ("Streaks and leaderboards are not yet
  backend-connected for this hub").
- Challenge Hub has no leaderboard integration of its own (separate from
  the existing standalone Leaderboard screen).
- Event Challenge has no reward catalog (grand reward / participation
  reward / points rules all render "Not available" honestly) and no
  banner/sponsor upload backend (local file reference only).
- SmokeCraft Challenge categories have no reward catalog either (same
  "Not available" honesty pattern) and its "Live events" section
  explicitly discloses no scheduled-events backend exists yet.
- Blend Fault Identification (practice activity, `BlendFaultChallenge.jsx`)
  has a working 3-step scoring flow but no server-side persistence beyond
  its own existing scope — disclosed in `ChallengeHub.jsx`'s own comment
  as a pre-existing limitation, out of scope for this pass.
- None of the above are code defects in this pass — they are genuine,
  already-disclosed backend/catalog gaps for a future phase.

## Prompt 3E-2 update — Rewards, Badge Collection, Passport Stamp, Connections

Starting commit: `854495f042888c4507367935d435b6dc55fc90e9` (Prompt 3E-1 close).

Scope per mandate: audit `Connections.jsx`, `PassportStamp.jsx`, `Rewards.jsx`
(badge display), for dead/baked controls of the SC-D001/SC-D010/SC-D011/SC-D012/
SC-D013 class. Golden Box, Mentor, Pairing, Challenges, responsive layout,
POS360, and E.A.T. 360 were explicitly out of scope for this pass.

**Result: NO new defects found.** All three screens were already correctly
built before this pass. Source-level investigation was followed by real
browser verification (seeded guest session, Playwright, `localhost:5050`)
rather than relying on source read alone, since prior passes in this
operation twice caught real mistakes (route-nesting) that source read alone
missed.

- **Connections** (`src/pages/smokecraft/Connections.jsx`): 7 real toggle
  buttons (`CONNECTION_OPTIONS.map`). Live-clicked 3 of the 7 in a real
  browser: all 3 changed `aria-pressed` state correctly (`false -> true`).
  Continue button confirmed real, navigated to `/smokecraft/management-sync`
  as expected. Back control present. No fix needed.
- **Passport Stamp** (`src/pages/smokecraft/PassportStamp.jsx`): confirmed
  real backend-integrated claim flow (`POST /api/smokecraft/passport-stamp/claim`,
  real 409-duplicate detection, honest `idle`/`claiming`/`claimed`/`duplicate`/
  `error`/`offline` states). Live browser test: renders without crashing,
  Back/Continue controls present and real. No fix needed. Note: Prompt 5's
  "duplicate protection" requirement is already satisfied server-side here —
  not an open gap for that phase.
- **Rewards / Badge Collection** (`src/pages/smokecraft/Rewards.jsx`, S25
  mode): confirmed `BadgeCrest` is a non-interactive decorative component
  (no `onClick`, no misleading pointer cursor) rendered via
  `aria-label="... badge (earned)"` / `"(locked)"` — not a clickable-looking
  dead control. Confirmed via `src/App.jsx` there is exactly one `rewards`
  route (Session 25), so there is no separate "Badge Collection" screen to
  audit — badges are inline within Rewards. Live browser test: page renders
  real XP/rank/point values, 6 real buttons present, badge elements confirmed
  present and non-interactive by inspection. No fix needed.

Proof: `public/proof/smokecraft-prompt-3e-2/connections-toggled.png`,
`passport-stamp.png`, `rewards-badges.png`.

Regressions re-run and passing: `verify-smokecraft-final-three-approved-assets.mjs`
(17/17), `verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7).

**Prompt 5 engine handoff (recorded per mandate, not built this pass):**
automatic badge/stamp unlock triggers keyed to rule-based session-completion
events; duplicate protection for badges specifically (Passport Stamp already
has real server-side duplicate protection via the claim API — this is not a
gap, but badge awarding has no equivalent server endpoint yet — confirmed by
grep, `Rewards.jsx` computes badge `earned` state purely from local
`completedSteps`, no server round-trip); unlock reason/timestamp capture;
cross-device/cross-screen persistence (current state is `localStorage`-only,
disclosed elsewhere in this operation as "LOCAL PREVIEW MODE"); and an
admin correction/audit history surface (does not exist anywhere in this
codebase).

## Prompt 3 update

- **SC-D010 CLOSED with browser evidence** — see table row below for full detail.
- **SC-D001 CLOSED (Prompt 3B, Batch 1)** — the defect was actually broader than "bottom-icon strip": the entire left sidebar (9 items), top bar (Back to Journey, notifications, help, account), and bottom strip (6 items) were baked/dead, not just the bottom strip. All 18 controls now wired live, verified via real browser test (all 18 `data-testid` elements found, 3 spot-checked destinations navigate correctly, zero visual regression). See table row below.
- **Full system-wide interaction audit (all 27 sessions' internal controls, every sidebar on every screen, all bottom navs beyond `SmokeCraftNavBar`, all landing/dashboard cards, hotspot alignment at 5 viewports) was NOT attempted this pass.** This turn fixed the one concretely-evidenced defect from the Prompt 2 register (SC-D010) with full verification, rather than claiming broader coverage that wasn't actually performed.

## Prompt 2 updates (closed and new)

- **SC-D005 CLOSED with browser evidence.** All 109 routes were opened in a real browser (`verify-smokecraft-all-routes-browser-test.mjs`), seeded with a fully-progressed guest session so every guard renders real content. Result: **95 PASS, 14 REDIRECT PASS** (the known `Navigate` aliases), **0 REPAIR REQUIRED, 0 DEAD ROUTE, 0 BLOCKED**. Full per-route results + 109 screenshots: `public/proof/smokecraft-system-audit-prompt-2/all-routes/`.
- **Phase 6-vs-7 conflict investigated and documented, NOT silently resolved either way.** See `SMOKECRAFT_PHASE_RECONCILIATION.md`: the 7-phase count was the original pre-implementation plan; it was deliberately superseded by a documented, tested, shipped 6-phase decision ("Package J") before this recovery operation began, and no session-to-phase breakdown for the original 7-phase plan is preserved anywhere to safely restore from. Locking tests added (`verify-smokecraft-phase-session-lock.mjs`, 9/9 passing) protect the current, real, working structure against further drift while leaving the 6-vs-7 naming question open for an explicit product decision.
- **SC-D010 (new): Leaderboard sidebar has 8 of 9 baked labels with no live control.** `src/pages/smokecraft/Leaderboard.jsx` overlays exactly ONE live click handler ("LOUNGE" → back to Landing, line ~510) on top of the approved image's baked sidebar, which visually shows 9 labels (LOUNGE, JOURNEY, CIGARS, CHALLENGES, EVENTS, LEADERBOARD, REWARDS, PASSPORT, CONNECTIONS, SETTINGS — confirmed by source read of the same file's own comments). The other 8 are `DEAD VISUAL CONTROL`. Assigned to Prompt 3.
- **Asset-exclusivity validation script added** (`scripts/smokecraftAssetExclusivityCheck.mjs`, Part 9) — 7/7 checks pass: no missing assets, no curriculum session without an asset, Session-1 image not shared with CraftHub, Leaderboard uses the disclosed newest approved asset, Venue Selection asset used by exactly one key, no undeclared cross-screen asset sharing.

Every defect below is real (reproduced or directly evidenced from source/asset
data gathered this pass), not speculative filler. Items whose evidence is
"not yet gathered" are marked as such explicitly rather than invented.

Every defect below is real (reproduced or directly evidenced from source/asset
data gathered this pass), not speculative filler. Items whose evidence is
"not yet gathered" are marked as such explicitly rather than invented.

| ID | Route/Screen | File/Asset | Defect type | Severity | Evidence | Assigned prompt |
|---|---|---|---|---|---|---|
| SC-D001 | `/smokecraft/welcome` (Session 1) | `src/pages/smokecraft/WelcomeExperience.jsx` | ~~Entire left sidebar (9 items), top bar (4 controls), bottom strip (6 items) baked/dead~~ **CLOSED Prompt 3B** | N/A (resolved) | Fixed: `SIDEBAR_ITEMS`/`BOTTOM_STRIP_ITEMS` arrays + live overlay buttons for all 18 controls, pixel-calibrated via PIL crop. Real browser test: 18/18 `data-testid` elements found; Rewards/Leaderboard/Pairing spot-checks navigate correctly; Settings honestly disabled (no real screen exists); Sign Out navigates to Landing (no destructive reset — this is a guest kiosk app with no real auth). Screenshot: `public/proof/smokecraft-system-audit-prompt-3b/session1-sidebar-repaired.png`. | Closed |
| SC-D002 | 7 actively-used portrait assets: `enroll` (Guest Pass), `aiSummary`, `knowledgeDrop`, `connections`, `knowledgeDropTobacco`, `knowledgeDropAging`, `terroir` | see `SMOKECRAFT_ASSET_INVENTORY.md` | Portrait/vertical assets in active use, per this mandate's hard requirement that tablet screen visuals be landscape | Medium | Dimensions computed directly from file bytes this pass (1086×1448 etc.) | Prompt 4 |
| SC-D003 | 293 image files under SmokeCraft asset directories are not referenced by any `SC_ASSETS` key | `public/assets/smokecraft/**`, `public/assets/smokecraft-reference/**` | Unreferenced/legacy assets not yet reviewed for quarantine | Low | Computed directly this pass via `SC_ASSETS` cross-reference | Prompt 2 (classification), not auto-deleted |
| SC-D004 | 72 duplicate-hash groups (identical file bytes under different filenames) | see `SMOKECRAFT_ASSET_INVENTORY.md` | Asset naming/organization debt — does not itself cause a live defect, but obscures which file is canonical | Low | Computed directly this pass via SHA-256 | Prompt 2 |
| SC-D005 | ~~~100 of 109 registered routes~~~ **CLOSED Prompt 2** | various | All 109 routes browser-tested: 95 PASS, 14 REDIRECT PASS, 0 requiring repair | N/A (resolved) | `public/proof/smokecraft-system-audit-prompt-2/all-routes/00-all-routes-results.json` | Closed |
| SC-D006 | All 27 sessions | various | Per-session quiz/scorecard/slider/upload interaction audit (Part 6 classification) not performed this pass beyond asset+route+component verification already covered by existing test suites | Unknown (unverified) | `SMOKECRAFT_27_SESSION_AUDIT.md` covers route/asset/component only | Prompt 3 |
| SC-D007 | All routes except Venue Selection | various | Four-viewport responsive/scrolling audit (Part 7) not performed this pass beyond the existing full-journey suite's Section G (which sweeps all 31 canonical screens at 4 viewports for horizontal-overflow only, not the full checklist in this mandate — scroll behavior, touch target sizing, hero undersizing, etc.) | Unknown (unverified) | `verify-smokecraft-full-journey-sequence-and-assets.mjs` Section G already exists and passes for horizontal-overflow specifically | Prompt 4 |
| SC-D008 | `verify-smokecraft-full-journey-sequence-and-assets.mjs` — ~~"Welcome honestly declares it has no approved asset" assertion~~ **CLOSED Holistic Fix 2B** | `verify-smokecraft-full-journey-sequence-and-assets.mjs` | Fixed: confirmed `getManifestEntry('session-1').assetKey === 'session1'` with `assetStatus: 'ok'` (real asset wired since commit `7e8c4281`), so the assertion now correctly checks `visualSource === 'user-approved' && assetKey === 'session1'` instead of the stale no-asset expectation. Full suite now passes 107/107. | N/A (resolved) | `public/proof/smokecraft-holistic-fix-2b/` (full-journey re-run) | Closed |
| SC-D009 | Live Railway production deployment | N/A | Cannot verify what commit/branch Railway is actually serving | Blocking (external) | Org egress 403 to `crafthub360.up.railway.app`, no Railway CLI/credentials — reproduced and confirmed every time it has been attempted this operation | Prompt 6 |
| SC-D011 | `/smokecraft/passport` | `src/pages/smokecraft/SmokeCraftPassport.jsx`, asset `360 PASSPORT  2.png` | ~~5 action cards baked/dead~~ **CLOSED Prompt 3D, corrected 3E-1** | N/A (resolved) | Fixed: `PASSPORT_ACTION_CARDS` array + live overlay for all 5 cards. **Correction made in 3E-1**: the original fix routed "Scan to Connect"/"Join an Event"/"Explore Benefits" to generic screens (Connections/Event Challenge/Rewards Center) and incorrectly disabled "Explore Directory" as unsupported — a real, existing, substantial top-level `/passport/*` module (`src/pages/passport/*.jsx`, 265-775 lines each) was missed. Corrected to route to the real dedicated pages: Scan -> `/passport/scan`, Directory -> `/passport/directory`, Event -> `/passport/events`, Benefits -> `/passport/benefits`. "View Matches" remains honestly disabled — confirmed no "matches" route exists anywhere. All destinations re-verified via real browser test after correction. Screenshot: `public/proof/smokecraft-system-audit-prompt-3d/passport-cards-repaired.png`. | Closed |
| SC-D012 | `/smokecraft/passport` | same as SC-D011 | ~~"FULL GUIDE" link and "Directory" list row not investigated~~ **CLOSED Prompt 3E-1** | N/A (resolved) | Fixed: both now route to the real `/passport/how-it-works` and `/passport/directory` pages (same top-level module discovered while fixing SC-D011). Verified via real browser test: both destinations confirmed correct. Screenshot: `public/proof/smokecraft-prompt-3e-1/passport-guide-directory-repaired.png`. | Closed |
| SC-D013 | `/smokecraft/crafthub` | `src/pages/smokecraft/SmokeCraftCraftHub.jsx` | ~~"STAFF HANDOFF"/"DAYONE360 TRAVEL" unwired~~ **CLOSED Prompt 3E-1** | N/A (resolved) | Fixed: DAYONE360 TRAVEL now routes to `/dayone360-travel` (a real, existing top-level route — confirmed via browser test it is a sibling of `/smokecraft`, not nested under it, same class of correction as SC-D011/SC-D012). STAFF HANDOFF confirmed to have no real feature anywhere in this codebase — wired as a real, focusable, `disabled` button with accessible name "Staff Handoff (not yet available)" rather than fabricated. Verified via real browser test + screenshot, zero visual regression: `public/proof/smokecraft-prompt-3e-1/crafthub-bottom-row-repaired.png`. | Closed |
| SC-D010 | `/smokecraft/leaderboard` sidebar | `src/pages/smokecraft/Leaderboard.jsx` | ~~8 of 9 baked sidebar labels had no live click handler~~ **CLOSED Prompt 3** | N/A (resolved) | Fixed: added a `SIDEBAR_ITEMS` array + live overlay `<button>` for each row (JOURNEY→`/smokecraft/resume`, CIGARS→`/smokecraft/humidor-match`, CHALLENGES→`/smokecraft/challenge-hub`, EVENTS→`/smokecraft/event-challenge`, REWARDS→`/smokecraft/rewards-center`, PASSPORT→`/smokecraft/passport`; LEADERBOARD itself gets no separate control since it's the current page and its highlight is real, not a false default; SETTINGS wired as a real, focusable, `disabled` button with accessible name "Settings (not yet available)" since no SmokeCraft settings screen exists — honest, not silently dead). Pixel positions calibrated via PIL crop of the 1538×1022 approved image. Verified via real browser test: all 7 buttons present, Rewards→`/smokecraft/rewards-center` and Passport→`/smokecraft/passport` confirmed navigating correctly; Cigars correctly triggered the existing S2 session guard (test session wasn't progressed far enough to unlock S2 — expected guard behavior, not a new defect). Screenshot confirms zero visual regression (overlays invisible, image unchanged). Proof: `public/proof/smokecraft-system-audit-prompt-3/leaderboard-sidebar-repaired.png`. | Closed |

## Not classified as defects (explicit non-issues, per this mandate's own rules)

- Zero connected venues in `/smokecraft/venue-select` — a valid state per Part 8 of this mandate. Not a defect on its own; only dead controls, wrong image, fake data, or blocked navigation in that state would be.
- 6 phases (not 7) in `VISIT_STRUCTURE` — this repository's locked architecture has always been 6 phases / 27 sessions; not silently changed to match this mandate's stated "7 phases," and not silently changed to match without flagging the discrepancy. See `SMOKECRAFT_27_SESSION_AUDIT.md`.
- S9/S13/S17/S18/S20/S26 having no dedicated component registry entry — intentional (shared/merged component), verified in the 27-session audit.

## Holistic Fix 2E-3 — commerce, alias, and orphan-route classification decisions

| Item | Classification | Decision | Evidence |
|---|---|---|---|
| `menu` / `cart` / `checkout` / `payment-success` / `order-status` (`SmokeCraftMenu.jsx`, `SmokeCraftCart.jsx`, `SmokeCraftCheckout.jsx`, `SmokeCraftPaymentSuccess.jsx`, `SmokeCraftOrderStatus.jsx`) | **Distinct workflow** (5 separate real components forming one internally-consistent checkout flow: menu→cart→checkout→payment-success/order-status), but also **orphaned/unreachable** | **Retain as documented direct-access.** Not an alias of `venue-commerce`/`order`/`ticket-tapper/staff-specials` (different components, different purpose). Its only live trigger, `src/components/smokecraft/SmokeCraftMenuButton.jsx`, is confirmed unused by any other file in the codebase (`grep -rln SmokeCraftMenuButton src/pages src/components` returns only the file itself). No route inside this flow is reachable from any live navigation in the app today. Retained rather than removed since it is a complete, working, non-trivial feature — not proven obsolete, just not yet wired to an entry point. | `grep` confirmed zero live callers of `SmokeCraftMenuButton`; zero `navigate()`/`to=` references into `/smokecraft/menu` from outside this flow's own 5 files. |
| `venue-commerce` / `order` / `ticket-tapper/staff-specials` | **Intentional alias group** (already decided in an earlier pass) | Unchanged — all three routes render the identical `SmokeCraftVenueCommerce` component. Enforced by `validateSmokecraftManifest.mjs`'s existing commerce-alias-group check. | Re-confirmed passing this pass (0 failures). |
| `request-purchase` | **Distinct workflow** — curriculum-adjacent supporting screen (`RequestPurchase.jsx`), gated by `requires="humidor-match"`, unrelated to the menu/cart/checkout flow or the venue-commerce alias group | No change — already migrated onto `SmokeCraftScreenShell` (Holistic Fix 2E batch 1). | N/A |
| 14 legacy `<Navigate>` aliases inside the SmokeCraft route tree | Canonical alias table | **The manifest's `alias-redirect`-classified entries ARE the canonical alias table** — formalized this pass with a new build-blocking drift check in `validateSmokecraftManifest.mjs` that fails if any literal `<Navigate to="/smokecraft/...">` inside `App.jsx`'s SmokeCraft route tree is not represented as an alias-redirect manifest entry with a matching target. | New check passes (0 undocumented literal alias targets). |
| `Demo.jsx`, `SmokeCraftDemoReset.jsx` | Admin/founder-only, direct-access | **Retain as documented direct-access, role-gated at the component level** (`SmokeCraftDemoReset` already gates on `isDemoMode || meetsMinRole(role, 'admin')`; `Demo.jsx` has no route-level guard but is intentionally reachable only via direct URL for investor/founder walkthroughs, not linked from guest navigation). | Confirmed via source read (prior passes); unchanged this pass. |

**Not completed this pass**: a from-scratch enumeration of every route with zero live entry points (only the items above were newly investigated; the broader "classify every orphaned, demo-only, direct-access, admin-only, and unreachable route" sweep across all ~108 routes was not re-run exhaustively this pass — prior passes' Fix 2C/2D orphan findings for the pairing-adjacent family remain the most recent full sweep).

## SC-D014 — ~~mid-spine screens with backend-dependent Continue actions cannot be verified by a localStorage-only test harness~~ **CLOSED Holistic Fix 2E-6**

Originally found while building `verify-smokecraft-hf2e5-curriculum-forward-backward.mjs`: a real click on Flavor Memory's (Session 10) "Continue" control did not advance the session, root-caused to `FlavorMemory.jsx`'s `handleContinue()` requiring both `saveToBackend()` and `saveToPassport()` (the latter using `credentials: 'include'`) to resolve `ok`.

**Root cause confirmed this pass: (a), a test-harness gap — not a real product defect.** Traced the guest-identity cookie (`smokecraft_guest_session`, `server/middleware/smokecraftGuestIdentity.js`) to being issued only when `ensureSmokeCraftGuestIdentity` runs, which happens via `managementSyncRoutes.js`'s `POST /guest-session` — called by `establishGuestSession()` inside `useSmokeCraftServerJourney()`, a hook `WelcomeExperience.jsx` (Session 1) invokes on mount. A real player always visits Session 1 before any later session, so the cookie is always present by the time Flavor Memory's Continue runs. The original test hit this failure only because it seeded `localStorage` directly and navigated straight to Flavor Memory without ever visiting Welcome first — skipping the one real page load that establishes server-side identity.

**Verified via real browser test**: visited `/smokecraft/welcome` first (confirmed via `context.cookies()` that `smokecraft_guest_session` is set), then navigated to Flavor Memory, clicked a real flavor selection and the Continue button — advanced correctly to `/smokecraft/pairing-lab` (Session 11). This is now a permanent regression test in `verify-smokecraft-hf2e5-curriculum-forward-backward.mjs` (section "SC-D014 regression"), so this exact test-harness gap (and any real regression in the underlying cookie-issuance flow) will be caught immediately if it recurs.

No product code was changed to close this — the underlying behavior was already correct; only the test's understanding of it was wrong.

## Holistic Fix 2E-9 — all-27-session interaction sweep findings (both non-defects)

`verify-smokecraft-hf2e9-all-session-interactions.mjs` discovered 276 visible interactive controls across the 21 primary curriculum routes and hit-tested a sample of up to 15 per session (blocked-overlay check + console-error check), plus a keyboard-focus check per session. 86 of 88 checks passed. The 2 failures are both confirmed non-defects:

- **Session 1 (Welcome): one 404 console error.** Matches the already-documented recurring non-reproducing first-navigation flake (see the note near line 198 of this file) — re-confirmed non-reproducing this pass, not a new regression.
- **Session 27 (Session Complete): one "Blocked call to navigator.vibrate" console warning.** Traced to `triggerHaptic()` (`src/utils/haptics.js`), called from several handlers in `SessionComplete.jsx`. Chrome blocks `navigator.vibrate()` unless it's called from within a real, trusted user-gesture event handler — a Playwright-driven Tab keypress and hit-test evaluation in headless automation do not count as a trusted gesture, but a real user's touch/click on a physical device does. Confirmed via source read this is standard browser security policy, not a product defect — no real guest playing on a real device would ever see this.

Both findings are disclosed here rather than silently dismissed, and neither required a code fix.

## Holistic Fix 2E-11 — control taxonomy closure findings

No new product control defects were found or fixed this pass. Two
suspected failures encountered while extending
`verify-smokecraft-hf2e10-control-state-persistence.mjs` were investigated
to root cause and confirmed as test-harness mistakes, not product defects:

1. **Terroir section-expand test failure**: initial test used
   `getByRole('button', { name: /Country/i })`, which matched nothing.
   Root cause: Terroir's sections are intentionally rendered with
   `role="tab"` (source-confirmed, `Terroir.jsx` line ~170), not
   `role="button"`. Fixed the test to use `getByRole('tab', ...)`. Not a
   product defect — the real component's design was correct.
2. **HumidorMatch duplicate-click test false positive**: initial test
   dispatched `Promise.all([continueBtn.click(), continueBtn.click({force:
   true})])` from the Node/Playwright side and observed an apparent
   double-advance (landed on `/smokecraft/terroir` instead of
   `/smokecraft/meet-your-cigar`). Root cause: the two clicks were not
   truly simultaneous — the first click's navigation completed before the
   second Playwright action resolved, so the second click landed on the
   *next* page's own legitimate Continue button. Fixed the test to
   dispatch both click events synchronously inside a single
   `page.evaluate()` against the same pre-navigation DOM element. Re-test
   confirmed the real `if (done) return` guard works correctly — no
   product defect existed.

Stage 2 control-architecture closure (Holistic Fix 2E-11): all 276
controls mapped to 7 tested implementation groups, 0 unmapped, coverage
validator passing. See `SMOKECRAFT_CONTROL_IMPLEMENTATION_MAP.md` and
`SMOKECRAFT_INTERACTION_MATRIX.md`'s 2E-11 section for full detail.

## Holistic Fix 3 — responsive closure findings

**Two real defects found and fixed:**

- **SC-D015 (new, CLOSED)**: `SmokeCraftVenueCommerce.jsx`'s two-column
  layout (`gridTemplateColumns: '1fr 280px'`) caused genuine horizontal
  overflow (116px measured at 390px viewport width) on the three routes
  rendering it (`/venue-commerce`, `/order`,
  `/ticket-tapper/staff-specials`). Fixed with a shared responsive CSS
  class (`.sc-commerce-two-col` in `src/styles.css`) collapsing to a
  single column below 820px. Verified live post-fix: 0px overflow.
- **SC-D016 (new, CLOSED)**: `Connections.jsx` declared `NAT_W=1672,
  NAT_H=941` for `SC_ASSETS.connections`, whose real file
  (`cropped/connections-hero.jpg`) is 492×781 — confirmed via direct PIL
  read. The wrong constants fed `SmokeCraftImageBoundsOverlay`'s scale
  math incorrectly, genuinely stretching the rendered image (computed
  `object-fit: fill` with a mismatched box) on every viewport. Fixed by
  correcting the constants to the asset's real dimensions. Cross-checked
  all 27 other image-shell screens' declared dimensions against actual
  file bytes; no other mismatches found.

**Investigated and confirmed as sweep-script measurement bugs, not
product defects** (three rounds of live re-verification before trusting
the sweep's output): scroll-blocked false positives from not checking
native document/body scroll; obscured-control false positives from (a)
counting a nav's own buttons as obscured by itself, (b) flagging
controls merely below the fold on unscrolled initial load that were
fully reachable once scrolled (confirmed live on `/smokecraft/mentors`),
and (c) matching incidental small fixed elements unrelated to real
navigation (confirmed via source read of `src/pages/SmokeCraft.jsx` that
the flagged Rewards/Rankings/Passport/CraftHub buttons are baked-image
hotspots, not covered by anything); and hero-image "stretch" false
positives from not distinguishing legitimate `object-fit:cover` crops
from actual `fill` distortion. All corrected in
`verify-smokecraft-hf3-responsive-inventory.mjs` before the final
validator pass.

**SC-D002 (portrait assets) remains open, not silently resolved**: 5
disclosed portrait assets (`enroll`, `connections`, `pairing`, plus the
mentor-selection avatar thumbnail and venue-commerce menu backdrop)
render safely letterboxed (no stretch, no information-losing crop) via
`SmokeCraftImageBoundsOverlay`'s `contain`-equivalent math, but remain
flagged for horizontal-replacement artwork — no substitute imagery was
fabricated this pass, per explicit mandate instruction.

## Holistic Fix 4 — server-authoritative state findings

**SC-D017 (new, CLOSED)**: the entire primary 27-session curriculum's
XP, rank, badges, `completedSteps`, and Passport-stamp state was
client-authoritative only (`GuestSessionContext` ->
`localStorage['novee_guest_session']`), guarded only by an in-memory
`if (completedSteps.includes()) return` check — insufficient against
two tabs, two devices, or a retried request, and explicitly disclosed to
guests via the product's own "Local Preview Mode" message
(`SmokeCraftProgressContext.jsx`). Fixed for the session-completion and
Passport-stamp award paths: new migration
`092_smokecraft_canonical_player_state.sql` (real database UNIQUE
constraints) + `/api/smokecraft/player-state/*` API + client wiring in
`GuestSessionContext.jsx`. Verified live: 3 sequential duplicate
requests, a true concurrent-request race, and a two-real-browser-tab
race each resulted in exactly one recorded completion and exactly one
XP award.

**SC-D018 (new, found and CLOSED during this pass's own testing)**:
migration 092 made `idempotency_key` globally UNIQUE across all guests.
Live duplicate-request testing surfaced a real defect: a guest whose
client-generated idempotency key fell back to a generic value (observed
live: `guestId` was `null` for a guest who hadn't been through the
Passport entry flow, producing the literal key
`"unknown-guest::complete:mentor"`) could collide with a DIFFERENT
guest's completion using the same fallback key — the second guest's
legitimate request would be misidentified as a duplicate of the first
guest's row and silently report success without ever recording that
guest's own completion. Root-caused via a deliberate two-different-
guests-same-key test. Fixed by migration
`093_smokecraft_player_state_idempotency_key_guest_scope.sql`, scoping
the UNIQUE constraint to `(guest_reference, idempotency_key)` instead of
a bare global unique index. Re-tested: two different guests sharing the
literal same idempotency key string now both get their own completion
recorded correctly, no cross-contamination.

**Known, disclosed, NOT closed this pass**: guest-to-account conversion
(no account/auth system exists anywhere in this codebase for SmokeCraft
guests to convert into — a hard blocker, not a scoping choice); the
~30 non-award `SmokeCraftJourneyContext` fields remain client-cache-only
(deliberate scope decision — no duplicate-award risk); XP/badge award
paths beyond session completion and Passport stamps were not
individually wired to screens this pass (the shared API/service
supports them — `POST /awards/xp` and `POST /awards/badge` both work
and are tested — but no screen currently calls them directly, since
`awardSessionRewards` already grants session-tied badges atomically with
the session-completion mutation). See
`SMOKECRAFT_STATE_OWNERSHIP_MAP.md`'s Known Gaps for full detail.
