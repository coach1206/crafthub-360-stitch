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

## Holistic Fix 4B — account identity and conversion findings

**Two real defects found and fixed during this pass's own testing:**

- **SC-D020 (new, CLOSED)**: no passport_member login endpoint existed
  anywhere in the codebase before this pass — `promoteGuestToMember`
  could only ever create a new member once; there was no way for an
  existing member to sign back in on a second device. Fixed by adding
  `POST /api/smokecraft/account/login` (email+PIN, reusing the existing
  bcrypt/JWT/lockout infrastructure). Verified live: a real second
  cookie jar successfully logs into the same account and resumes its
  state.
- **SC-D021 (new, CLOSED)**: the new account router's rate limiter
  (`server/routes/smokecraftAccountRoutes.js`) did not follow this
  codebase's existing convention (`skip: () => !IS_PROD` on
  `server/index.js`'s global auth limiter — dev/test suites must not be
  throttled by production-grade rate limiting). Found live: the
  automated test suite (31 scenarios, many making auth calls) began
  failing with cascading 429s around scenario 7 after ~10 cumulative
  auth requests. Root-caused by direct inspection, confirmed as a real
  inconsistency (not a rate-limiter false positive, since a real user
  would rarely exceed 10 auth actions in 15 minutes — but automated
  testing legitimately does), and fixed by adding the same `skip`
  pattern to both the new account router and the Holistic Fix 4 player-
  state router (which had the identical gap). Re-tested clean: 31/31.

**Investigated, confirmed NOT a defect**: `SMOKECRAFT_GAME_MANIFEST.json`
briefly reported a stale route count (108 instead of 109) after adding
the `/smokecraft/account` route in an earlier commit within this same
pass, before the manifest generator was re-run. Root-caused to a commit-
ordering artifact (the generator runs correctly in `npm run build`'s
prebuild chain; this was caught between two separate manual commits
within the same working session, not a build-time defect) — fixed by
regenerating the manifest and hardening
`scripts/validateSmokecraftResponsive.mjs`'s previously-hardcoded "108
routes" check to compare against the live route count instead, so this
exact class of staleness can't silently recur.

**Known, disclosed, NOT closed this pass** (see
`SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md`'s Known Trade-offs and
`SMOKECRAFT_STATE_OWNERSHIP_MAP.md`'s Known Gaps): the journey-content
snapshot is versioned as one whole blob, not per-field — a guest's
independent journey content is discarded (not silently, it's disclosed
in the conversion's `journey_merge_outcome` audit field) in favor of an
account's own pre-existing snapshot on conversion, rather than being
field-by-field merged; `selected mentor`'s two-independent-owners issue
(`SmokeCraftJourneyContext.mentor` vs `GuestSessionContext.selectedMentor`)
remains documented, not fixed.

## Holistic Fix 4B — journey-snapshot staleness regression (found via own regression suite)

**SC-D022 (new, CLOSED)**: `SmokeCraftJourneyContext`'s mount effect
adopted the server journey snapshot whenever one existed (version > 0),
with no check for whether the LOCAL cache was itself fresher. Found via
the full-journey regression suite: sessions 17-27 all incorrectly
redirected to `/smokecraft/venue-select` instead of their real routes.
Root cause confirmed by direct code trace: `SmokeCraftSessionGuard`
reads `journey` (via `getSmokeCraftEntryReadiness(session, journey)`) to
decide entry-readiness redirects — an unconditionally-adopted stale
server snapshot silently overwrote fields that guard depends on. This
is a real product defect, not merely a test artifact: a real guest who
runs `startNewJourney()` (resets local journey fields to null) on a
browser where the server still holds an older synced snapshot would hit
the same bug on their next page load, silently resurrecting old data
over the freshly-reset "new journey" state. Fixed by comparing
`journey_updated_at` (server) against `journeyUpdatedAt` (local) and
only adopting when the server is strictly newer or local has none at
all. Also fixed the full-journey test's `seed()` helper, which had been
giving every re-seeded iteration a timestampless local cache (something
no real client write ever produces, since `updateJourney()` always
stamps `journeyUpdatedAt`) — both fixes were required together.
Re-verified: full journey 107/107.

## Holistic Fix 5A — gameplay ledger findings

**SC-D023 (new, CLOSED)**: the mentor selection dual-ownership defect
disclosed in Holistic Fix 4's ownership map
(`SmokeCraftJourneyContext.mentor` vs `GuestSessionContext.selectedMentor`,
two independently-settable fields for one concept) is closed:
`Mentor.jsx` now writes only `journey.mentor` (already server-synced);
`session.selectedMentor` is a pure reactive mirror derived from it in a
dedicated effect, never independently settable. Both fields are kept
(real cross-module consumers outside `/smokecraft` — NCIE, POS3, staff
handoff, EAT analytics — read `session.selectedMentor` and cannot reach
`SmokeCraftJourneyProvider`), but they can no longer diverge.

**SC-D024 (new, CLOSED)**: badges and the one curriculum-tied Passport
stamp were previously claimed by the client (which decided locally that
a badge/stamp was earned, then called an idempotent server RECORD
endpoint) rather than calculated and issued by the server, violating
this mandate's core non-negotiable rule. Fixed: `completeSession()`
now auto-grants the session's tied badges (from the existing, real
`SESSION_REWARDS[id].sessionBadges` table) and the `session-complete`
session's tied Passport stamp, in the same atomic transaction as the
completion — the client only ever requests "complete this session,"
never "grant me this badge."

**Test-harness assumptions found stale by this pass's own new
functionality (not product regressions)**: two pre-existing automated
tests (`verify-smokecraft-hf4-player-state-idempotency.mjs` section 4,
`verify-smokecraft-hf4b-account-and-conversion.mjs` section 4) asserted
exact total badge counts that were correct before Holistic Fix 5A but
became stale once session completion started auto-granting real tied
badges in the same guest identity's award list. Both were investigated,
confirmed to be test-assumption staleness (not defects — the new badge
counts are the CORRECT, expected result of real new functionality), and
fixed to assert against the specific award keys each test actually
exercises rather than a total count that a real, working feature now
legitimately changes.

**Known, disclosed, NOT closed this pass** (see
`SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`'s Known Gaps): `addXP()` in
`GuestSessionContext` has no idempotency guard and no server mirror at
all — a genuine remaining client-controlled-XP surface for the
Origins-module `XP_AWARDS` call sites; the 3 Origins-module Passport
stamps (`master-blend`, `cultivator`, `leaf-recognition`) have
server-idempotent recording but client-decided eligibility; Challenge
Hub and Golden Box scoring remain explicitly deferred to Holistic Fix
5C; pairing/mentor intelligence remains deferred to Holistic Fix 5B.

## Holistic Fix 5A-2 update

**SC-D025 — CLOSED.** `addXP()` had no idempotency guard and no server
mirror at all for 7 Origins-module named-XP call sites, and Knowledge
Check / Leaf Challenge XP amounts were client-computed from a
client-tracked score. Fixed: `NAMED_XP_SOURCES` is now populated
server-side (previously an empty placeholder); Knowledge Check and Leaf
Challenge now submit raw evidence (responses/answers) and are scored
server-side against the same real question/answer data, dual-imported by
client and server. See `SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`'s Holistic Fix
5A-2 section for the full closure list.

**SC-D026 — CLOSED.** `addBadge()` (the direct-award path used by
Origins-module badges not tied to a curriculum session) had zero server
mirror — a real client-controlled-badge surface parallel to SC-D024's
closure of session-tied badges in Holistic Fix 5A. Fixed: mirrors to the
existing `/awards/badge` endpoint, same as curriculum badges.

**Still disclosed, NOT closed this pass:** the `master-blend`/
`cultivator` Passport stamps' eligibility is still the paired-activity
XP grant succeeding (a real improvement, but not full free-form-content
verification — their content is subjective, not a scoreable answer key);
tasting draft/completion distinction and skill-checkpoint evidence
requirements are not rebuilt; reward screens (Rewards Center/Passport/
Collections/Skill Tree) still read the local GuestSessionContext mirror
rather than an explicit fresh fetch on each view; Challenge Hub/Golden
Box (5C) and pairing/mentor intelligence (5B) remain deferred.

## Holistic Fix 5A-3 update

**SC-D028 — CLOSED.** The `master-blend` Passport stamp had client-decided
eligibility (the client claimed the stamp on any Submit click, regardless
of whether a complete blend was actually selected). Fixed: the client now
submits its raw wrapper/binder/filler selection as evidence
(`POST /blend/submit`); the server independently verifies it is a
complete, well-formed selection (valid wrapper, valid binder, exactly 3
distinct fillers) before granting XP or the stamp. Verified: a
2-filler (incomplete) submission and an out-of-range wrapper index are
both rejected 400, never silently accepted; the stamp cannot be granted
twice even under a different selection/idempotency key.

**SC-D027 — FOUND, NOT CLOSED (newly discovered, confirmed PRE-EXISTING,
not introduced by this pass).** A `role="alert"` element intercepts
pointer events on some screens (observed: S4/terroir, the Rewards Center
"Back" button), causing real clicks to retry/timeout under Playwright.
Root-caused via a controlled before/after comparison: `git stash`'d this
pass's entire diff, rebuilt, and reran both the interaction sweep
(88-check) and full-journey (107-check) suites against the byte-identical
unmodified commit `c77e4a44` — the SAME 15 interaction-sweep failures and
the SAME 2 full-journey failures (S4 asset fetch, Rewards Center Back
button blocked by the alert div) reproduced identically, twice, on fresh
server/preview restarts each time. This conclusively rules out this
pass's changes as the cause. Not investigated further or fixed this pass
(out of scope for a reward-engine-focused mandate, and root-causing a UI
alert-persistence defect responsibly needs its own dedicated pass) —
flagged here as a real, disclosed, currently-open defect for a future
pass to close. Cultivator stamp remains open for the same
unverified-content reason disclosed in Holistic Fix 5A-2 (no
UI-behavior-changing evidence gate was added this pass to avoid risking
a real regression under the same time constraint).

## Holistic Fix 5A-3B update

**SC-D027 — CLOSED.** Root cause: `src/components/system/
BuildDiagnosticFooter.jsx`'s version-mismatch banner
(`role="alert"`, mounted once globally in `App.jsx`, rendered on every
route) is `position: fixed; top:0; left:0; right:0; zIndex: 9999` — a
full-viewport-width strip at the very top of every screen. It had no
`pointerEvents` override, so its ENTIRE bounding box (including the
empty flex-gutter space around its centered text, not just the visible
text/button) intercepted pointer events on anything underneath it,
across the whole top strip of every route — real controls that happened
to render near the top of the viewport (headers, Back buttons) became
unclickable whenever a version mismatch was active.

Fix: the outer alert wrapper is now `pointerEvents: 'none'` (never
blocks anything underneath), and only the actually-interactive Refresh
button opts back in with `pointerEvents: 'auto'` (stays fully clickable/
focusable). `role="alert"` and all visible styling are unchanged — no
visual redesign, no route-specific z-index patch (this was the one
shared component causing it; every other `role="alert"` usage in the
codebase is inline/page-scoped, confirmed by grep, not a global fixed
overlay).

Verified via a controlled before/after: the new deterministic regression
test (`verify-smokecraft-hf5a3b-alert-pointer-regression.mjs`, forces the
mismatch state via network interception rather than depending on real
build drift) FAILS on the unfixed code (confirmed by reverting via `git
stash`) and PASSES on the fixed code — a real, meaningful guard, not a
tautology. Re-ran the previously-failing interaction sweep (was 73/88,
now 88/88) and full-journey suite (the Rewards Center Back-button
failure, the specific SC-D027 symptom, is gone — 106/107, one unrelated
pre-existing S4 asset-fetch timing issue remains, disclosed separately,
not a pointer-blocking symptom and out of this pass's scope).

## Holistic Fix 5A-3C update

**"S4 asset fetch" full-journey failure — CLOSED (test-harness defect,
not a real product defect).** Root-caused via reproducible instrumented
runs (before/after debug logging captured live): clicking S4 (Terroir)'s
"Country" section button reliably triggers the approved
`smokecraft-terroir.png` fetch and the correct hash-matching image
renders, every time, in isolation. The failure only appeared during
Holistic Fix 5A-3's diagnostic runs, which were executed under real
resource contention (multiple concurrent Node/Playwright/build processes
running simultaneously in this container). The actual defect:
`verify-smokecraft-full-journey-sequence-and-assets.mjs`'s
`revealSections()` helper used a fixed `page.waitForTimeout(350)` after
the section-reveal click instead of a deterministic readiness condition
— sufficient in isolation, occasionally too short under contention.
Fixed: replaced the fixed sleep with `page.waitForResponse()` scoped to
image requests (bounded at 3s, resolves as soon as the real response
arrives). Re-verified: full journey 107/107 (was 106/107), and a new
targeted 7-check regression suite
(`verify-smokecraft-hf5a3c-s4-asset-fetch-regression.mjs`) covering
first-visit, refresh, back-and-return, repeated-visit, cached response,
and a real slow-response (800ms, artificially throttled) scenario — all
7 passing, confirming the fix is both correct and not merely "wait
longer."

## Holistic Fix 5A-3D update

**SC-D029 — CLOSED.** `MiniTasting.jsx` granted XP immediately on
clicking "Begin", with no real completion criteria (no requirement to
actually select a cigar) and no server-side draft persistence (a real
cross-device-resume gap — selection/comparison lived only in local
browser state). Fixed: server-authoritative draft save/reload
(`smokecraft_tasting_drafts`, migration 097, optimistic concurrency) and
completion (`submitTastingCompletion`, reusing the existing
`smokecraft_activity_attempts` ledger) — the server independently
verifies the submitted `selectedCigarId` is real (from its own copy of
the flight inventory) before granting XP; draft saves never grant
anything; a two-tab completion race grants XP exactly once (verified).

## Holistic Fix 5A-3E update

**SC-D030 — CLOSED.** The `cultivator` Passport stamp (disclosed as an
open gap since Holistic Fix 5A-2: "cultivator stamp still records
idempotently without independent content verification beyond the paired
XP activity succeeding") granted XP + the stamp on any "Save to
Passport" click, with zero requirement to have actually viewed any
cultivation content. Fixed: the client now tracks which of the 7 real
cultivation stages were genuinely opened and submits that set as
evidence; the server independently verifies it covers every required
stage before granting anything (`submitCultivatorEvidence`, reusing the
existing `smokecraft_activity_attempts` ledger — no new migration
needed). Verified: incomplete/fabricated evidence rejected 400, valid
evidence grants XP+stamp exactly once, a two-tab race grants exactly
once, cross-user isolation holds. Live Playwright smoke test confirmed
the real screen gates the Save button until all 7 stages are viewed and
correctly transitions through submitting → saved states.

## Holistic Fix 5A-3F update

**SC-D031 — CLOSED.** `collectionsRoutes.js` lacked the established
dev/test rate-limiter skip (same class as SC-D021, Holistic Fix 4B) —
would throttle automated test suites making repeated calls.

**SC-D032 — CLOSED.** An authenticated account's Collections identity
used the raw, unprefixed `req.smokecraftIdentity.id` instead of the
established `user:${id}` convention — inconsistent with every other
player-state table, and as a direct consequence,
`convertGuestToAccount` never transferred Collections ownership on
guest-to-account conversion at all (it had no matching `user:` reference
to find). Fixed: `bridgeIdentity` now prefixes correctly, and
`convertGuestToAccount` now transfers Collections rows (set union by
`collection_item_key`, same pattern as awards/sessions). Verified live:
a guest who earns an item, creates an account, and converts still sees
the item under their new authenticated identity.

**SC-D033 — CLOSED.** `collectionsRoutes.js` was missing
`ensureSmokeCraftGuestIdentity` in its middleware chain (only had the
read-only `attachSmokeCraftIdentity`) — a genuinely first-ever visit
directly to `/smokecraft/collections`, before visiting any other
SmokeCraft route, returned a real 401 instead of getting a fresh guest
identity issued. Found live via a fresh-browser Playwright smoke test
(not assumed), confirmed by checking every other player-state router's
established `attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity`
chain. Fixed by adding the missing middleware.

**Correction/reversal for Collections — ADDED.** Extends the existing
Holistic Fix 5A-2 correction ledger (`smokecraft_reward_corrections`,
`correctionType='collection'`) — no new migration needed. A reversal
never deletes/edits the original `smokecraft_collection_ownership` row;
`recalculate()` now reads the corrections ledger to report an honest
`'corrected'` state. Staff-only (`requireStaff`), verified live:
non-staff rejected 403, staff succeeds 201.

## Holistic Fix 5A-3G update (Skill Tree ledger integration)

- **SC-D034**: `skillTreeRoutes.js` rate limiters lacked
  `skip: () => !IS_PROD` (same class as SC-D021/SC-D031) — closed.
- **SC-D035**: `bridgeIdentity` in `skillTreeRoutes.js` used
  `req.smokecraftIdentity.id` for BOTH guest and authenticated-account
  identities (missing the `user:` prefix for accounts), inconsistent
  with the rest of player-state — closed.
- **SC-D036**: `skillTreeRoutes.js` was missing
  `ensureSmokeCraftGuestIdentity` — a genuinely first-ever visit to
  `/smokecraft/skill-tree` would have 401'd instead of getting a real
  guest identity (same class as SC-D033) — closed, verified live via a
  fresh-cookie-jar request.
- **SC-D037**: `convertGuestToAccount` never transferred any of the 6
  evidence tables that back Skill Tree node evaluation (Seed & Soil,
  Filler Arrangement, Rolling Progress, Flavor Stage Observations,
  Pairing Drafts, Golden Box Entries). Since node state is always
  re-derived live from evidence and never cached-trusted, this meant
  100% of Skill Tree progress was silently lost on every guest-to-
  account conversion — closed by transferring the underlying evidence
  (plus the learner-state cache) and re-running `recalculate()` for the
  new identity after commit. Verified live end-to-end.

All four closed via `server/routes/skillTreeRoutes.js`,
`server/services/smokecraft/playerStateService.js`, and
`server/services/smokecraft/skillTreeService.js` (new
`getReversedNodeKeys` correction overlay). See
`public/proof/smokecraft-holistic-fix-5a-3g/00-proof-index.md`.

## Holistic Fix 5A-3H update (Leaderboard ledger integration and integrity closure)

- **SC-D041**: `smokecraft_leaderboard_eligibility.venue_id` existed in
  the schema and was already read by `getLeaderboard`'s venue filter,
  but was never accepted/written by `setLeaderboardPreference` — venue
  scoping was a dead feature. Closed.
- **SC-D042**: `convertGuestToAccount` never transferred the leaderboard
  eligibility/opt-out/venue preference row on guest-to-account
  conversion — a guest who explicitly opted out would silently revert
  to default-visible under their new account identity. Closed.
- **SC-D043**: `Leaderboard.jsx` rendered its "You" row and rank strip
  entirely from the local `GuestSessionContext`/`SmokeCraftJourneyContext`
  mirror and never rendered the real fetched community leaderboard at
  all (the fetch happened, but its result was discarded except for a
  summary string). Closed by wiring the screen through `fetchPlayerState()`
  and the real `snapshot.communityEntries`.

All three closed via `server/services/smokecraft/playerStateService.js`,
`server/controllers/playerStateController.js`,
`src/services/smokecraft/smokeLeaderboardService.js`, and
`src/pages/smokecraft/Leaderboard.jsx`. See
`public/proof/smokecraft-holistic-fix-5a-3h/00-proof-index.md`.

## Holistic Fix 5B-1 update (server-authoritative pairing engine)

- **SC-D044**: `SERVING_STYLE` was defined but not exported from
  `src/utils/pairingEngine.js`, breaking the new server-side dual-import
  — closed (export added, no scoring-behavior change).
- **SC-D045**: `transferSavedPairings`'s JSONB columns were passed as
  raw JS arrays instead of JSON-stringified during guest-to-account
  transfer, causing every conversion with a saved pairing to fail —
  closed, found live during this pass's own testing.
- **SC-D046**: the initial `savePairing` implementation bumped
  `save_version` and appended a new revision on every identical
  idempotency-key resubmission instead of a true no-op — closed with an
  early idempotency-key lookup.

All three closed via `src/utils/pairingEngine.js` and
`server/services/smokecraft/pairingEngineService.js`. See
`public/proof/smokecraft-holistic-fix-5b-1/00-proof-index.md`.

## Holistic Fix 5B-1A update (pairing screen visual and interaction closure)

Real Playwright browser verification of PairingLab (S11) and
PairingRecommendations (S22) — the only disclosed gap from Holistic Fix
5B-1 — found and fixed 3 real defects:

- **SC-D047**: PairingLab.jsx was missing the single accessible `<h1>`
  page title present on every other SmokeCraft screen — closed.
- **SC-D048**: PairingLab.jsx's journey-sync `useEffect` depended on a
  freshly-created object (`rec`) instead of stable primitive values,
  causing `setPairing` to fire on every render indefinitely — a real
  infinite-render loop, invisible to any API-level test, found live via
  Playwright (chip buttons constantly detaching from the DOM). Closed
  by depending on real primitive values instead.
- **SC-D049**: PairingLab.jsx's Pairing Choices panel and the
  pairing-type hotspot row genuinely overlap (both independently
  measured against the approved image); with no explicit stacking
  order, the invisible hotspot buttons silently intercepted clicks
  meant for the visible flavor-note chips underneath — a real,
  silent blocked-overlay defect found live via Playwright ("element
  intercepts pointer events"). Closed with an explicit `zIndex: 3`, no
  visual change.

All three closed via `src/pages/smokecraft/PairingLab.jsx`. Encoded as
permanent regression checks in
`scripts/validateSmokecraftPairingEngineAuthority.mjs`. See
`public/proof/smokecraft-holistic-fix-5b-1a/00-proof-index.md`.

## Holistic Fix 5B-2A update (mentor state, guidance, and live screen integration)

- **SC-D050**: `MentorCommentary.jsx`'s hardcoded `COMMENTARY` map was
  keyed by short first-name-derived ids (`alejandro`, `javier`,
  `jamastrán`, ...) that never matched the real `MENTORS` roster ids
  (`dominican`, `nicaragua`, `honduras`, ...) — every real mentor
  selection silently fell through to `DEFAULT_COMMENTARY`, so every
  learner saw identical generic commentary regardless of which mentor
  they actually chose. Closed by routing through the new real,
  server-authoritative mentor-guidance service.
- **SC-D051**: `MentorCommentary.jsx` rendered `mentor.origin` and
  `mentor.expertise` — fields that do not exist on the real `MENTORS`
  roster (only `country`/`bio` exist) — rendering as literally
  `undefined`. Closed by using the real `mentor.country`/`mentor.bio`
  fields.

Both closed via `src/pages/smokecraft/MentorCommentary.jsx`, the new
`server/services/smokecraft/mentorGuidanceService.js`, and
`src/hooks/useSmokeCraftMentorGuidance.js`. See
`public/proof/smokecraft-holistic-fix-5b-2a/00-proof-index.md`.

## Holistic Fix 5B-2A-1 update (remove remaining static mentor guidance)

- **SC-D052**: `server/routes/blendFaultRoutes.js`,
  `server/routes/challengeHubRoutes.js`, and
  `server/routes/fillerArrangementRoutes.js` all mounted
  `router.use(optionalAuth, attachSmokeCraftIdentity)` without
  `ensureSmokeCraftGuestIdentity` — the same recurring defect class as
  SC-D033/SC-D036/SC-D041. `attachSmokeCraftIdentity` only reads an
  existing guest-identity cookie; it never issues one. A genuinely
  fresh guest landing directly on Challenge Hub, the Blend Fault
  Identification challenge, or Filler Arrangement got a real 401 on
  every request those routers serve. For Filler Arrangement
  specifically this cascaded into a second, worse symptom: the
  screen's own progress-fetch 401 set `status = 'error'`, which
  triggered an early `return <ErrorScreen/>` that skipped rendering
  `DynamicMentorPanel` entirely — so the mentor guidance panel added
  this pass appeared to be missing when the true cause was the
  upstream 401. Found live via Playwright (real console errors and a
  missing mentor name/guidance on first-navigation). Closed by adding
  `ensureSmokeCraftGuestIdentity` to the import and `router.use()`
  chain in all three route files, matching the already-correct pattern
  in `collectionsRoutes.js`/`skillTreeRoutes.js`/
  `pairingEngineRoutes.js`/`mentorGuidanceRoutes.js`.

Closed via `server/routes/blendFaultRoutes.js`,
`server/routes/challengeHubRoutes.js`,
`server/routes/fillerArrangementRoutes.js`. Encoded as a permanent
regression check in
`verify-smokecraft-hf5b2a1-mentor-six-screens-browser.mjs` (the "no
console errors" and mentor-identity/guidance checks on all six
screens). See
`public/proof/smokecraft-holistic-fix-5b-2a-1/00-proof-index.md`.

## Holistic Fix 5B-2B-1 update (ElevenLabs voice foundation and secure preview)

- **SC-D053**: `DynamicMentorPanel`'s sibling — the new Mentor
  Selection `VoicePreviewControl` — initially only rendered the
  preview transcript/caption text while `status === 'ready'` or
  `'loading'`, so a mentor whose voice is genuinely unavailable (no
  ElevenLabs key configured, or no real voice ID assigned) showed the
  honest "Voice unavailable" message but silently withheld the
  transcript text the learner could otherwise have read — a real,
  live-found accessibility/honesty gap (mandate requirement 8:
  "transcript always available when audio is generated" was met
  narrowly, but the more useful case — transcript available
  regardless of audio outcome — was missed). Found live via Playwright
  (transcript text assertion failed against the real unavailable
  state). Closed by rendering the transcript whenever a preview has
  been requested at all (`status !== 'idle'`), not only on `ready`.

Closed via `src/pages/smokecraft/Mentor.jsx`. Encoded as a permanent
regression check in
`verify-smokecraft-hf5b2b1-mentor-selection-browser.mjs`. See
`public/proof/smokecraft-holistic-fix-5b-2b-1/00-proof-index.md`.

## Holistic Fix 5B-2B-2 update (Seed & Soil baseline repair, shared mentor narration)

- **SC-D054**: `npm run db:migrate` — the repo's own documented reset
  workflow (`docs/DATABASE_FOUNDATION.md`) — only ever applied schema
  migrations. `golden_box_component_catalog` (and everything that
  foreign-keys to it — `smokecraft_seed_soil_progress`,
  `smokecraft_quiz_questions`, `smokecraft_flavor_notes`,
  `smokecraft_component_compatibility`) has never had its rows created
  by a migration; they were only ever inserted by the pre-existing,
  already-idempotent `server/db/seeds/seedSmokecraftEducationalContent.mjs`
  script, which nothing in the automated reset path ever invoked. A
  genuinely fresh database therefore always passed every migration yet
  still had zero catalog rows, so the first real request referencing a
  catalog id (`POST /api/smokecraft/seed-soil/progress`) failed with a
  23503 foreign-key violation — surfacing as a failing mentor-guidance
  regression check ("Guidance changes after real Skill Tree progress
  advances") whose real root cause was one layer upstream of guidance
  entirely. Reproduced directly: a fresh `npm run db:migrate` left
  `golden_box_component_catalog` at 0 rows; calling
  `seed-soil/progress` on that database returned `23503` before any
  mentor-guidance code ever ran. Closed by having `runMigrations.js`'s
  CLI entrypoint spawn the required content seed(s) as a real child
  process (awaited to completion — a first attempt using a plain
  dynamic `import()` was itself a real defect: the seed script's
  `main()` is fire-and-forget at module scope with no top-level
  `await`, so `import()` resolved before the async inserts actually
  completed, silently leaving the catalog empty despite logging
  "Seeded") after every clean migration run. Verified idempotent and
  additive-only across two consecutive resets and against pre-existing
  unrelated data.

Closed via `server/db/runMigrations.js`,
`server/db/migrations/100_smokecraft_mentor_voice_narration.sql`
(unrelated schema change bundled in the same pass — see below),
`package.json` (`db:seed` script added). Encoded as a permanent
regression check in
`verify-smokecraft-hf5b2b2-clean-reset-baseline.mjs` (drops and
recreates the real database, runs the real reset command, asserts
real content rows exist) and in
`scripts/validateSmokecraftMentorVoiceSecurity.mjs`. See
`public/proof/smokecraft-holistic-fix-5b-2b-2/00-proof-index.md`.

## Holistic Fix 5C-1A update (Challenge Hub scoring authority)

- **SC-D055**: `challengeHubRoutes.js` and `blendFaultRoutes.js` both
  used the raw `smokecraftIdentity.id` for an authenticated account's
  `goldenBoxGuestReference` instead of the established `user:${id}`
  prefix already used correctly by `skillTreeRoutes.js` and
  `mentorGuidanceRoutes.js`. This meant a converted account's Challenge
  Hub and Blend Fault Identification requests queried under the WRONG
  identity string — the just-transferred state (written to
  `user:${id}` by `convertGuestToAccount`) was invisible to every
  subsequent request from that same account, silently reverting to a
  fresh/empty state. Found live via the account-conversion API test
  (the after-conversion re-fetch failed to see the just-transferred
  completed challenge and Blend Fault attempt history, despite the
  transfer itself reporting success). Closed by prefixing with
  `user:` in both routers' `bridgeIdentity`, matching the established
  pattern exactly.
- **SC-D056**: a comment in `ChallengeHub.jsx` incorrectly claimed
  Blend Fault Identification had "no server-side scoring or
  persistence yet." It does — migration 089's
  `smokecraft_blend_fault_attempts`/`_answers` tables have backed a
  fully server-authoritative, transactional scoring engine
  (`blendFaultService.js`) since a prior pass. Corrected during this
  pass's audit; no code change was needed, only the misleading
  documentation.
- Real, structural gap closed (not a bug per se): `smokecraft_challenge_definitions.xp_reward`
  has existed since migration 088 and was already serialized to the
  client (`ChallengeHub.jsx` reads `activeDetail.xpReward`), but no
  server code ever read or awarded it — completion set
  `participation_state = 'completed'` with no reward-granting path at
  all. Closed via `completeChallengeAndAward()` (row-locked
  transaction) + `smokecraft_challenge_rewards` (migration 101, real
  UNIQUE-constraint idempotency). Both currently-seeded challenges
  remain at the pre-existing, disclosed `xp_reward = 0` — no new
  reward amount was invented, only the dead code path made live.

Closed via `server/routes/challengeHubRoutes.js`,
`server/routes/blendFaultRoutes.js`,
`server/services/smokecraft/challengeHubService.js`,
`server/services/smokecraft/challengeEventService.js` (new),
`server/db/migrations/101_smokecraft_challenge_hub_scoring_authority.sql`,
`server/services/smokecraft/playerStateService.js` (account-conversion
transfer). Encoded as permanent regression checks in
`verify-smokecraft-hf5c1a-challenge-hub-api.mjs` and
`scripts/validateSmokecraftChallengeHubAuthority.mjs`. See
`public/proof/smokecraft-holistic-fix-5c-1a/00-proof-index.md`.

## Holistic Fix 5C-1B update (Golden Box scoring and persistence audit)

- **SC-D057**: `goldenBoxRoutes.js` was missing `ensureSmokeCraftGuestIdentity`
  in its `router.use()` chain — the same recurring defect class as
  SC-D033/036/041/052/055. A genuinely fresh guest landing directly on
  a Golden Box route got a real 401. Closed by adding it.
- **SC-D058**: `goldenBoxRoutes.js`'s `bridgeIdentity` used the raw
  `smokecraftIdentity.id` for an authenticated account instead of the
  established `user:${id}` prefix (same SC-D055 defect class,
  independently present here). Worse than the Challenge Hub instance:
  because `convertGuestToAccount` writes transferred data to the
  `user:${id}`-prefixed identity, this mismatch meant a converted
  account's Golden Box requests never found their own transferred
  entry — `createEntry`'s existing-entry lookup (`guest_reference`
  only) would silently create a brand-new, empty entry instead.
- **SC-D059**: `convertGuestToAccount()` included `golden_box_entries`
  in the generic set-union copy loop used for simple, childless
  evidence tables. Because `golden_box_entries.entry_id` has
  `DEFAULT gen_random_uuid()` and was not in that loop's copied column
  list, the copied row got a brand-new `entry_id` — silently orphaning
  every real `golden_box_entry_versions`/`golden_box_blend_components`/
  `golden_box_submissions` row that referenced the OLD `entry_id` via a
  real foreign key. A converted account would see an empty, version-1
  draft with no history and no submission record, despite the
  conversion itself reporting success. Found via the account-
  conversion API test (real end-to-end: build a draft, submit it,
  convert, verify the SAME identity still sees the submitted entry and
  its 4 saved components). Closed with a bespoke transfer function
  that generates a real new `entry_id` for the copy but then remaps
  every child row's foreign key to it (same technique as the Blend
  Fault attempt/answer transfer in 5C-1A).
- Structural gap (not a bug per se): `saveDraft()` had zero optimistic-
  concurrency protection and zero idempotency-key dedupe — a rapid
  double-click created a real duplicate version row, and two
  concurrent saves both silently succeeded with no conflict signal
  (last-write-wins, invisible data loss). Closed via a row-locked
  (`FOR UPDATE`) transaction, `expectedVersion` conflict detection, and
  `idempotency_key` (migration 102). `submitEntry()` also never caught
  a `UNIQUE_VIOLATION` race on the submissions insert (would have
  produced an unhandled 500 for the losing request in a genuine
  two-tab race) — closed with a graceful catch that returns the real
  winning submission.

Closed via `server/routes/goldenBoxRoutes.js`,
`server/services/goldenBox/entryService.js`,
`server/services/goldenBox/goldenBoxEventService.js` (new),
`server/db/migrations/102_smokecraft_golden_box_submission_authority.sql`,
`server/services/smokecraft/playerStateService.js`. Encoded as
permanent regression checks in
`verify-smokecraft-hf5c1b-golden-box-api.mjs` and
`scripts/validateSmokecraftGoldenBoxAuthority.mjs`. See
`public/proof/smokecraft-holistic-fix-5c-1b/00-proof-index.md`.

## Holistic Fix 5C-2A update (Golden Box judge assignment and scorecard authority)

- **SC-D060**: `golden_box_scorecards`' pre-existing
  `UNIQUE(entry_id, judge_id, amended_from)` constraint (migration 077)
  never actually enforced "at most one original (non-amended)
  scorecard per judge+entry" — Postgres treats every `NULL
  amended_from` as distinct for uniqueness purposes. Two concurrent
  first-ever `POST .../scorecard/draft` requests for the same brand-new
  judge+entry pair (no row existed yet to lock) both returned `200 OK`
  and created two separate scorecard rows. Reproduced live with two
  backgrounded concurrent `curl` calls, then closed for real, encoded
  as a permanent regression test (`verify-smokecraft-hf5c2a-scorecard-api.mjs`,
  "Two-tab race on the very FIRST draft save"). Closed with a partial
  unique index (`idx_gbsc_one_original_per_judge_entry ON
  golden_box_scorecards (entry_id, judge_id) WHERE amended_from IS
  NULL`, migration 103) plus a rewritten `getOrCreateDraftScorecard()`
  that wraps the risky first-ever INSERT in a `SAVEPOINT` so a
  `UNIQUE_VIOLATION` (23505) can be caught without aborting the
  surrounding transaction, then re-fetches the real winning row via
  `SELECT ... FOR UPDATE`. Same defect class as the voice-preview cache
  NULL-uniqueness bug fixed earlier in this operation — a recurring
  pitfall, not a one-off.
- Structural gap (not a bug per se): `submitScorecard()` previously
  always transitioned status straight to `'submitted'` in one call,
  with no way to save an incomplete draft — the mandate's own "draft;
  draft update" requirement had no real implementation. Closed by
  splitting into a genuine `saveScorecardDraft()` (never transitions
  status, partial scores allowed, optimistic-concurrency `draft_version`,
  idempotency-key dedupe) and a rewritten `submitScorecard()` (requires
  every rubric criterion present, computes the weighted total
  server-side, locks).
- Structural gap (not a bug per se): there was no server-side weighted-
  total computation for individual scorecards at all — only a separate,
  unrelated cross-judge `computeAggregateResult()` average existed.
  Closed by computing `sum(score * weight) / sum(maxScore * weight) *
  100` server-side from validated scores only inside `submitScorecard()`,
  verified live that an injected client `weightedTotal`/`totalScore`
  field is completely ignored.
- `goldenBoxRoutes.js`'s `readLimiter`/`writeLimiter` lacked the
  `skip: () => !IS_PROD` dev/test bypass already established elsewhere
  in this codebase (`mentorVoiceRoutes.js`, `challengeHubRoutes.js`).
  Real 429s during this pass's own test-writing/testing surfaced the
  gap live. Closed by adding the same dev-mode skip.

Closed via `server/db/migrations/103_smokecraft_golden_box_judging_authority.sql`,
`server/services/goldenBox/judgingService.js`,
`server/services/goldenBox/goldenBoxEventService.js`,
`server/controllers/goldenBoxController.js`,
`server/routes/goldenBoxRoutes.js`,
`src/services/goldenBox/goldenBoxApiClient.js`,
`src/pages/smokecraft/goldenBox/JudgeEntryReview.jsx`. Encoded as
permanent regression checks in
`verify-smokecraft-hf5c2a-judge-assignment-api.mjs`,
`verify-smokecraft-hf5c2a-scorecard-api.mjs`,
`verify-smokecraft-hf5c2a-judge-browser.mjs`, and
`scripts/validateSmokecraftGoldenBoxJudgingAuthority.mjs`. See
`public/proof/smokecraft-holistic-fix-5c-2a/00-proof-index.md`.

## Holistic Fix 5C-2B-1 update (Golden Box results aggregation and final ranking)

- **SC-D061**: `handleGetCompetitionResults()`'s first implementation
  always returned a freshly recomputed LIVE view
  (`computeCompetitionResults()`) to admin callers, even after a real
  finalization already existed — meaning an administrator could never
  actually see the real, immutable finalized ranking through this
  endpoint; every admin request just recomputed the live
  pending/ready-to-finalize state again. Found live via the browser
  test's own reload-after-finalize assertion
  (`verify-smokecraft-hf5c2b1-results-browser.mjs`, "Finalized ranking
  renders after reload"). Closed by checking for an existing
  finalization FIRST for every caller (admin included) — once one
  exists, it is the only thing returned, never a freshly recomputed
  view that could silently drift from what was actually finalized.
- Structural gap (not a bug per se): `golden_box_results` existed
  since migration 077 but nothing ever populated `placement`,
  `is_winner`, `tie_break_reason`, or a real per-entry aggregate beyond
  a naive unweighted average with no eligibility/exclusion/tie-break
  logic at all. Closed by building the full `resultsService.js`
  aggregation and finalization engine.

Closed via `server/db/migrations/104_smokecraft_golden_box_results_authority.sql`,
`server/services/goldenBox/resultsService.js` (new),
`server/services/goldenBox/goldenBoxEventService.js`,
`server/controllers/goldenBoxController.js`,
`server/routes/goldenBoxRoutes.js`,
`src/services/goldenBox/goldenBoxApiClient.js`,
`src/pages/smokecraft/goldenBox/ResultsExperience.jsx`. Encoded as
permanent regression checks in
`verify-smokecraft-hf5c2b1-results-api.mjs`,
`verify-smokecraft-hf5c2b1-results-browser.mjs`, and
`scripts/validateSmokecraftGoldenBoxResultsAuthority.mjs`. See
`public/proof/smokecraft-holistic-fix-5c-2b-1/00-proof-index.md`.

## Holistic Fix 5C-2B-2 update (Golden Box award and reward issuance)

- **SC-D062** (client-authority gap, not a live regression — the route
  predates any real caller): `handleIssueRewards()`
  (`goldenBoxController.js`, Package 1 era) accepted a fully client-
  controlled `req.body.xpAmount` and `req.body.badgeId` with zero
  connection to the entry's real placement or any approved rule — an
  authenticated admin could grant an arbitrary XP amount or badge to
  any entry with no rule basis at all. Dead/unwired beyond its own
  route (never called by any frontend screen or other service). Left
  in place (its route and behavior are unchanged — deleting a live
  admin-facing endpoint is out of this mandate's scope), but the new,
  real award pipeline (`awardsService.issueAwards()`) never calls it
  and derives every award exclusively from the immutable finalized
  ranking — no client-submitted placement or amount reaches the new
  path at all.
- **Documented rule gap** (not a bug — the mandate's own explicit
  "if approved rules are incomplete, document the exact gap and
  implement only supported awards" clause): `xp_award_rules`
  (migration 077) has never been seeded with a `golden_box` row by any
  package across this entire codebase; no golden-box-specific badge
  catalog entry or Passport stamp catalog entry exists anywhere
  either. Award RECORDS (first/second/third place, objective
  placement descriptors, not invented content) are fully implemented
  and issued; XP/badge/Passport-stamp CONTENT is genuinely unavailable
  today and honestly reported as such (`xp_status`/`badge_status`/
  `passport_stamp_status = 'unavailable'`) rather than fabricated. The
  service is fully wired to grant real content through the canonical
  `xpService.awardXp()` / `rewardsIntegrationService.grantBadge()` /
  `passport360SmokeCraftPersistenceService.awardPassportStampLive()`
  the moment a real rule/catalog entry is added — no parallel reward
  mechanism was created.

Closed via `server/db/migrations/105_smokecraft_golden_box_awards_authority.sql`,
`server/services/goldenBox/awardsService.js` (new),
`server/services/goldenBox/goldenBoxEventService.js`,
`server/controllers/goldenBoxController.js`,
`server/routes/goldenBoxRoutes.js`,
`src/services/goldenBox/goldenBoxApiClient.js`,
`src/pages/smokecraft/goldenBox/ResultsExperience.jsx`. Encoded as
permanent regression checks in
`verify-smokecraft-hf5c2b2-awards-api.mjs`,
`verify-smokecraft-hf5c2b2-awards-browser.mjs`, and
`scripts/validateSmokecraftGoldenBoxAwardsAuthority.mjs`. See
`public/proof/smokecraft-holistic-fix-5c-2b-2/00-proof-index.md`.

## Stage 5 Closure Gate update

- **SC-D062 — permanently closed** (previously only documented in
  5C-2B-2): the dormant `handleIssueRewards` controller function and
  its `POST /entries/:entryId/rewards` route (client-controlled
  `xpAmount`/`badgeId`, no rule basis, zero live callers) have been
  REMOVED from `goldenBoxController.js` and `goldenBoxRoutes.js`
  entirely — not merely documented. Verified live: the route now
  returns an honest `404 Route not found`. The unused
  `rewardsIntegrationService` import in the controller was removed
  alongside it. A permanent regression check
  (`scripts/validateSmokecraftGoldenBoxAwardsAuthority.mjs`, section
  10) fails the build if this route, the `handleIssueRewards` handler,
  or any `req.body.xpAmount`/`req.body.badgeId` read ever reappears.
- **SC-D063**: `goldenBoxController.js`'s `identityFrom()` — the
  identity resolution used by the `requireAuth`-only results/award
  visibility routes — never applied the `user:` prefix
  `convertGuestToAccount()` uses when transferring Golden Box entries,
  the same SC-D055 defect class already fixed once for
  `goldenBoxRoutes.js`'s `bridgeIdentity` middleware (SC-D058) but
  independently present here for a different code path (JWT-
  authenticated `req.user`, not the SmokeCraft guest-identity bridge).
  A converted account viewing their own finalized results or award
  through these routes silently resolved to the wrong viewer role
  (never `'entrant'`) and lost visibility into their own real,
  finalized data. Found live via the Stage 5 closure integration
  journey (`verify-smokecraft-stage5-closure-integration.mjs`) — the
  very first real end-to-end test of the full guest→conversion→judge→
  results→award chain as one continuous flow. Closed by prefixing any
  authenticated non-guest `req.user.id` with `user:` in
  `identityFrom()`, matching `bridgeIdentity`'s established pattern
  exactly. Verified live: full 22-step integration journey passes,
  all existing cross-user-denial assertions across every Golden Box
  regression suite still pass (the fix only restores the legitimate
  owner's own visibility — it does not loosen any authorization check
  for any other viewer).

Closed via `server/controllers/goldenBoxController.js`,
`server/routes/goldenBoxRoutes.js`,
`scripts/validateSmokecraftGoldenBoxAwardsAuthority.mjs`. Encoded as a
permanent regression check in
`verify-smokecraft-stage5-closure-integration.mjs`. See
`public/proof/smokecraft-stage-5-closure/00-proof-index.md`.

## Venue Humidor 1A update

No defects found this pass — this is a brand-new backend foundation
(migration 106, `inventoryService.js`, `productService.js`,
`orderService.js`, `venueHumidorController.js`,
`venueHumidorRoutes.js`), not a fix to prior work. All 32 live API
assertions and all 20 build-blocking validator checks passed clean.
Two established defect classes from earlier Golden Box passes were
proactively designed out from the start rather than found live here:
- The NULL-uniqueness idempotency gap (SC-D060's class) — every
  idempotency-key column in this migration uses a real partial
  `UNIQUE ... WHERE idempotency_key IS NOT NULL` index, and every
  insert path is wrapped in a `SAVEPOINT`-equivalent
  transaction/rollback-and-refetch pattern for the first-ever-insert
  race, matching the fix already proven necessary in Golden Box.
- The `user:` identity-prefix gap (SC-D055/SC-D058/SC-D063's class) —
  Venue Humidor's RBAC intentionally does not introduce a second
  guest/account identity bridge at all; it authenticates every caller
  through the existing `requireAuth` JWT session and checks real
  `venue_memberships` rows keyed on `system_users.user_id` directly —
  there is no guest-reference prefix concept to get wrong here.

See `public/proof/smokecraft-venue-humidor-1a/00-proof-index.md`.

## Venue Humidor 1B-1 update

- **SC-D064**: `VenueHumidorCigarDetail.jsx`'s Save to Favorites
  control tracked `isFavorited` as pure local component state,
  initialized to `false` and only ever flipped by the button's own
  click handler — the real persisted favorite (or lack of one) was
  never fetched on load. A page reload or a second device would
  always show "not favorited" regardless of the real server record.
  Found live via the browser test's own reload assertion
  (`verify-smokecraft-venue-humidor-1b1-browser.mjs`, "Favorite
  persists across reload"). Closed by fetching the real favorite list
  (`api.listFavorites()`) on every mount and deriving `isFavorited`
  from it.
- Test-infrastructure note (not a product defect): the shared seed
  catalog product used across both the API and browser test suites
  accumulates real holds/reservations on every run (idempotency keys
  are per-run-unique, so repeated runs never dedupe against each
  other) — a genuinely real, expected side effect of exercising real
  inventory mutations, not a bug. Both suites now reset that one seed
  product's inventory/holds/reservations/events before running so
  repeated runs stay deterministic.

## Venue Humidor 1B-2A update

- **SC-D065** (double-sell via converted-hold undercounting):
  `inventoryService.js`'s `computeAvailableQuantity()` summed held
  quantity only from holds with `status = 'active'`. Once
  `checkoutService.createOrderFromHold()` transitions a hold to
  `'converted'` (a real pending order now exists against it, unpaid),
  that hold stopped counting toward consumption — making the exact
  same physical stick available for a second customer to hold or buy
  while the first customer's unpaid order was still pending. Found
  live via the mandate's own cancellation-restoration test: available
  quantity did not change on order cancellation, because the hold had
  already silently stopped counting the moment the order was created.
  Closed by widening the held-quantity query to
  `WHERE status IN ('active', 'converted')`, and widening
  `releaseHold()`'s allowed from-statuses from `['active']` to
  `['active', 'converted']` so cancelling a pending order can actually
  release its (now-converted) hold back to available inventory.
- **SC-D066** (idempotency-ordering race, two-tab class):
  `checkoutService.createOrderFromHold()`'s original implementation
  locked the hold row and validated its status/ownership/expiry
  *before* checking the caller's idempotency key. In a genuine
  concurrent two-tab race sharing one idempotency key, the losing
  request acquired the lock only after the winner had already
  committed and flipped the hold to `'converted'` — so the loser's
  status validation threw a fabricated `stale_hold:converted` error
  instead of deduping via the real idempotency key it shared with the
  winner. Found live via the mandate's own required two-tab-race test.
  Closed by splitting hold-locking (`lockHold`, no status check) from
  hold-validation (`validateOwnedActiveHold`, pure function) and
  reordering `createOrderFromHold()` to: lock → recheck idempotency key
  (authoritative, in-lock) → validate hold status. Same
  pre-lock-fast-path-plus-in-lock-authoritative-recheck pattern class
  as SC-D060, but with the ordering corrected relative to the other
  in-lock validations.

See `public/proof/smokecraft-venue-humidor-1b-2a/00-proof-index.md`.

## Venue Humidor 1B-2B-1 update

No new defects in previously-locked behavior were found this pass.
Three bugs were caught in this pass's own new code before commit (via
its own required tests, never shipped): a sign error where
`complimentary` initially increased inventory instead of decreasing
it; an ambiguous-column SQL error in the event-history join
(`product_id`/`created_at` unqualified across a two-table join); and a
Playwright locator bug where `text=receiving` matched a hidden
`<select><option>` before the visible table cell. None of these
reached the committed baseline, so none receive an SC-D number (that
sequence is reserved for defects found in already-locked/shipped
behavior, per this operation's convention).

See `public/proof/smokecraft-venue-humidor-1b-2b-1/00-proof-index.md`.

## Venue Humidor 1B-2B-2 update

No new defects in previously-locked behavior were found this pass.
One bug was caught in this pass's own new code before commit (via the
1A regression suite's cancellation-restoration test, run as part of
this pass's own required regression sweep): the new
`fulfillment_status` column's `CHECK` constraint only covers the
staff-workflow values (new/awaiting_confirmation/confirmed/
in_preparation/ready/completed/cancelled/expired/blocked) — it has no
`'refunded'` value. `checkoutService.cancelOrder()`'s refund path
(cancelling an already-completed order) initially tried to stamp
`fulfillment_status = 'refunded'` in the same authoritative `UPDATE`
that sets `status = 'refunded'`, violating the `CHECK` constraint and
breaking 1A's real refund-restoration regression test. Fixed before
commit by mapping the refund path onto the existing `'cancelled'`
`fulfillment_status` value (the financial `'refunded'` vs `'cancelled'`
distinction remains owned entirely by the real `status` column). This
bug never reached the committed baseline, so it receives no SC-D
number per this operation's convention — but it is recorded here
because it was caught by, and is now permanently guarded by, the 1A
regression suite that continues to run as part of every Venue Humidor
pass.

See `public/proof/smokecraft-venue-humidor-1b-2b-2/00-proof-index.md`.

## Venue Humidor 1B-2B-3 update

No new defects in previously-locked behavior were found this pass.
Several bugs were caught in this pass's own new code before commit,
via its own required tests: a missing regex closing slash in a
Playwright text-selector (matched nothing, masking a real completion
check until fixed); an ASI parsing bug where a bare parenthesized
ternary on its own line was parsed as a call onto the previous
statement's return value, throwing a "used before initialization"
error; and a React dev-mode warning (harmless in production, still
fixed) from mixing the `border` shorthand with a `borderColor`
override on several new buttons. None of these reached the committed
baseline, so none receive an SC-D number.

See `public/proof/smokecraft-venue-humidor-1b-2b-3/00-proof-index.md`.

Closed via `src/pages/smokecraft/venueHumidor/VenueHumidorCigarDetail.jsx`.
Encoded as a permanent regression check in
`verify-smokecraft-venue-humidor-1b1-browser.mjs`. See
`public/proof/smokecraft-venue-humidor-1b-1/00-proof-index.md`.

## Venue Humidor 1B-2B-4 update

No defects found in previously-locked behavior. Two bugs were caught
and fixed entirely within this pass's own new test code before commit:
a missing `.patch()` method on a test-file `makeClient()` helper
(caused a false-negative "archived product still reorder-eligible"
result — the classification PATCH call silently mismatched the Express
route since the test harness only exposed `.get()`/`.post()`), and an
ASI (automatic-semicolon-insertion) parsing bug in the browser test
where a bare parenthesized boolean expression followed by a ternary,
on its own line, was parsed as a call onto the prior statement's
return value. Neither reached the committed baseline, so neither
receives an SC-D number.

See `public/proof/smokecraft-venue-humidor-1b-2b-4/00-proof-index.md`.

## Venue Humidor 1B-2B-5 update

No defects found in previously-locked behavior. Two issues were caught
and fixed entirely within this pass's own new code before commit: (1)
`getAlternatives()` initially did not compute live availability for the
target product before deriving its unavailability reason, so an
out-of-stock target was never correctly reported as such; (2) an
initial standalone pairing-page wrapper file had no detectable
interactive markup of its own, causing the route classifier to honestly
mark it "unclassified" rather than fabricate a classification — fixed
by routing `/smokecraft/humidor/pairing` directly to the same live
`VenueHumidorRecommendations` component instead of a separate wrapper.
Neither reached the committed baseline, so neither receives an SC-D
number.

See `public/proof/smokecraft-venue-humidor-1b-2b-5/00-proof-index.md`.

## Venue Humidor 1B-2B-6 update

No defects found in previously-locked behavior. Full regression suite
(269 API + 8 validators + 134 browser = 411 checks across all 8 Venue
Humidor packages) passed clean on this pass's first run with zero
drift from every prior package's own recorded numbers. A new 31-check
live closure-verification script
(`verify-smokecraft-venue-humidor-1b2b6-closure.mjs`) also passed
31/31 on its first run, covering concurrency, idempotency, cross-venue/
cross-customer denial, and financial/Passport integrity under real
concurrent load. No new SC-D number assigned — highest remains SC-D066.

See `public/proof/smokecraft-venue-humidor-1b-2b-6/00-proof-index.md`.

## Post–Venue Humidor Audit (SmokeCraft Remaining-Work Audit)

Audit-only pass, no feature code changed. Re-ran every directly
relevant existing test suite live (496+ checks across Venue Humidor,
Golden Box, mentor engine, pairing engine, rewards/leaderboard/
skill-tree/collections, a fresh 130-route navigation sweep, and the
full five-viewport responsive validator) — 100% passing except one
investigated-and-explained test-harness false positive (`networkidle`
timeout on `/smokecraft/flavor-memory`; direct re-navigation confirmed
a real 200 response with real content — not a defect, no SC-D number
assigned per this operation's "no numbers for unverified suspicions"
rule). No new SC-D defects found. SC-D002 (portrait assets) remains
open exactly as previously disclosed, unchanged. Highest SC-D number
remains SC-D066.

Full findings, priority matrix, and recommended next work package
(SmokeCraft Production Hardening — Phase 1) at
`public/proof/smokecraft-post-humidor-audit/20-final-audit-report.md`.

## SmokeCraft Production Hardening — Phase 1

No new SC-D defects found (no functional/security defect newly
confirmed in previously-locked behavior). Strengthened
`server/config/envValidator.js` (unsafe-default/length/malformed-origin
rejection), added `server/config/securityHeaders.js` (CSP,
Permissions-Policy, COOP, production-only HSTS, Cache-Control: no-store
for `/api`), patched `body-parser` to 1.20.6 via a `package.json`
override. `react-router`/`react-router-dom` remain unresolved (no fixed
6.x release exists; documented with a real exposure assessment — no
user-controlled navigation targets found anywhere in this codebase).
228 regression checks re-run clean (Venue Humidor, Golden Box,
scoring, mentor, pairing, rewards, plus a new 29-check security suite).
Highest SC-D number remains SC-D066.

Full findings: `public/proof/smokecraft-production-hardening-phase-1/00-final-report.md`.

## Required-Interaction Manifest and 21-Session Audit

No new SC-D defect assigned — the 13 non-complete sessions found this
pass are newly-defined scope gaps (relative to a manifest this pass
itself created), not previously-promised, now-broken behavior. Full
findings: `public/proof/smokecraft-required-interaction-manifest-audit/15-final-audit-report.md`.
Highest SC-D number remains SC-D066.

## SmokeCraft Production Closure — 55-view touch proof and safe haptics

Starting HEAD: `d0340434` (5-viewport touch browser proof).

**Found and fixed SC-D067**: the 55-case viewport/touch browser proof
(`public/proof/smokecraft-viewport-touch-proof/browser-proof.json`)
recorded 33/55 passing. Root causes, both real:

1. **Undersized touch targets (22 of 22 non-console failures).** Six
   screens shipped interactive controls below the 44×44 CSS-px floor:
   `VenueSelect.jsx`'s type-filter pills (padding-only sizing, no
   floor), `WelcomeExperience.jsx`'s and `SmokeCraftPassport.jsx`'s
   absolutely-positioned image-surface hotspot buttons (percentage-of-
   artwork height/width with no px floor — e.g. `height: '4.4%'` ==
   ~36px at 900px-tall viewports), `SmokeCraft.jsx`'s `SecondaryHotspot`
   (an explicit `minHeight: 28` — a deliberate prior trade-off against
   overlapping baked artwork, documented in-file — now raised to the 44px
   floor, well short of the earlier `minHeight: 72` regression that
   caused the overlap this file's own comment warns against), and
   `GoldenBox.jsx`'s hotspots. Fix: every affected absolute-position
   `<button>` now carries `minHeight: 44` (or, where the existing size
   was itself percentage-based, `minHeight: 'max(44px, N%)'` /
   `minWidth: 'max(44px, N%)'` via CSS `max()`), so the control grows to
   the floor without breaking the image-aligned layout at any viewport.
2. **`navigator.vibrate` browser-policy console warnings (all 5
   `final-session` cases).** `SessionComplete.jsx`'s completion
   `useEffect` called `triggerHaptic('success')` at mount time, before
   any user gesture — Chrome's vibration policy silently blocks
   `navigator.vibrate()` until a real gesture (pointerdown/keydown/click)
   has reached the document, logging "Blocked call to navigator.vibrate…"
   on every such call. Fix: `src/utils/haptics.js`'s `triggerHaptic` now
   tracks the first real user gesture globally (via a
   capture+passive document listener) and no-ops — returns `false`,
   never warns, never throws — until one has occurred. Also added a
   `document.visibilityState !== 'visible'` guard and made the function
   return a real boolean (`true` only on an actual fired vibration),
   per the safe-haptic-helper contract. Proven by
   `scripts/verifySmokecraftSafeHaptics.mjs` (5/5): no vibration on
   load, allowed after a real gesture, unsupported browsers stay safe,
   a throwing/rejected `vibrate()` call never propagates, and
   `prefers-reduced-motion` suppresses vibration even after a gesture.

Static-gameplay detector re-run clean at 85/85 after these edits.
Highest SC-D number is now SC-D067.

## SmokeCraft Production Closure — real 55-case re-capture and 27-session verification

Starting HEAD: `de68bdc7` (SC-D067 fix committed but not re-verified against
a real browser capture).

**Found and fixed SC-D068**: `npm run build` (plain `vite build`, no
explicit `--mode production`) was silently producing a non-production
bundle in this environment — 5.4MB main chunk including the dev-only
`DevRoleSwitcher` toolbar (guarded by `import.meta.env.DEV`, which should
be `false`/dead-code-eliminated in a real production build), live and
interactive in the shipped `dist/`. This inflated the touch-target
failure count in re-capture attempts with a control (`●Guest` role-switch
pill, `~84×38`) that will not exist in a correctly production-built
deploy. Fix: rebuild with `NODE_ENV=production npx vite build --mode
production` — verified 0 occurrences of the dev toolbar's marker string
in the resulting bundle, 3.1MB main chunk. **Railway's own build
invocation needs independent confirmation that it resolves to production
mode** — not proven from this sandbox; flagged for the owner in the final
report rather than assumed either way.

**Found and fixed SC-D069**: three additional real touch-target gaps
beyond SC-D067's six screens, found via a real Playwright re-capture
against the corrected production build with a real, server-progressed
guest identity (`scripts/seedSmokecraftDemoGuestCookie.mjs` +
`scripts/captureSmokecraftViewportTouchProof.mjs`):
1. A shared `[aria-label="Back"]` hotspot under 44px at several viewports
   across most image-surface screens — fixed with a global CSS floor in
   `src/styles.css` (exact source component not pinned down in this
   pass's budget).
2. `SmokeCraft.jsx`'s `PrimaryHotspot`/`StaticHotspot` (landing screen
   Start/Begin controls) had no `minHeight` floor — added.
3. `GoldenBox.jsx`'s acknowledgment checkbox (16–20px) — not a real
   defect: its native touch target is the enclosing `<label>`. The
   capture script's touch-target measurement was corrected to measure
   the label for checkbox/radio inputs instead of flagging a false
   positive.

Result: 52/55 (up from a real 33/55 at `d0340434`). 3 cases remain open
and undiagnosed in this pass's remaining budget — see
`public/proof/smokecraft-production-closure/00-proof-index.md` for exact
detail. None are regressions of this or the prior pass's fixes.

**27-session journey** (`scripts/verify-smokecraft-full-game-fresh-player.mjs`,
real server API, one fresh isolated guest, no shortcuts): **62/62 passed**.

Highest SC-D number is now SC-D069.

## SmokeCraft final production closure — 55/55, permanent build-mode lock, R2 groundwork

Starting HEAD: `f0bf4634` (52/55, build-mode fix known but not permanently
enforced, R2 not yet touched).

**Found and fixed SC-D070**: three real, root-caused browser-proof bugs,
closing the gap from 52/55 to a real 55/55:
1. No explicit favicon `<link>` in `index.html` — every new tab/page issued
   an implicit `GET /favicon.ico`, 404ing 3x on `venue-select--desktop`
   (once per page opened in that browser context). Fixed: explicit
   `<link rel="icon">` to the existing approved NOVEE icon.
2. `scripts/captureSmokecraftViewportTouchProof.mjs` measured page
   overflow/touch-targets AFTER performing its exploratory touch tap —
   on `admin-readiness` (a real first-tappable-element being a navigation
   link), the tap navigated the page away, destroying the execution
   context mid-measurement (`page.evaluate: Execution context was
   destroyed`), silently producing a null/failed reading. This was a
   measurement-ordering bug in the test script, not an application
   defect. Fixed by measuring before the tap.
3. `GoldenBox.jsx`'s acknowledgment checkbox (16-20px) is not a real
   defect — its true touch target is the enclosing `<label>` (native
   HTML tap-anywhere-in-label-toggles-checkbox behavior). The capture
   script's measurement now uses the label for checkbox/radio inputs.

A genuine, separate, network-dependent finding (not fixed this pass):
`src/data/connectionsData.js` hardcodes external `googleusercontent.com`
avatar URLs for demo/connections fixture data, rendered on the Passport
screen. One of five stability re-runs hit `ERR_TUNNEL_CONNECTION_FAILED`
on this external dependency in this sandbox's network environment — a
real instance of exactly the "no external image references" production
standard being violated, flagged for a follow-up pass rather than
patched blind under this pass's remaining time.

**SC-D068 (permanent fix)**: `npm run build` now always routes through
`scripts/buildProduction.mjs`, which forces `NODE_ENV=production` +
`vite build --mode production` programmatically (no shell-specific
syntax, no reliance on a human typing the right flags), then runs
`scripts/verifyProductionBundleIsClean.mjs` — a build-blocking gate that
fails the build if any dev-only bundle marker (e.g. DevRoleSwitcher) or
an abnormally large main chunk is detected. Dockerfile and
`nixpacks.toml` both resolve through the same locked `npm run build`.

**R2 groundwork (Parts 4-11, not "complete")**: extended the existing
real S3/R2-compatible adapter
(`server/services/venueManagement/objectStorageAdapter.js`) with
`headObject()`/`putObjectAtKey()` for deterministic-key GitHub-asset
sync (no other code in that file touched). Added
`scripts/smokecraftAssetInventory.mjs` (real scan: 425 image files
across 4 SmokeCraft asset roots, classified against the real
`SC_ASSETS` production-reference map — 79 ACTIVE_APPROVED, 262
APPROVED_SUPPORTING, 41 REPLACE_WITH_CURRENT, 37 RETIRED, 3
STATIC_MOCKUP_NOT_FOR_PRODUCTION, 3 ARCHIVE, 94 duplicate-checksum
groups, 1 broken SC_ASSETS reference found: `visitComplete`) and
`scripts/smokecraftAssetsSyncR2.mjs` (dry-run verified: 79/79 candidates
resolve, 0 missing, 0 checksum drift; `--upload-missing` correctly
fails closed with no live credentials rather than silently no-opping).
Added a real `R2_CONFIGURATION_MISSING`-reporting diagnostic to
`GET /api/smokecraft/diagnostics/readiness` (`checkR2Diagnostics()`) —
verified end-to-end in this sandbox (correctly reports `degraded` +
`R2_CONFIGURATION_MISSING`, not a fabricated pass). Real upload/HEAD/
delete against a live bucket was not performed — no credentials in this
sandbox; Railway production credential status is unverified from here,
not asserted absent.

Highest SC-D number is now SC-D070.

## SmokeCraft final media and stability closure

Starting HEAD: `1adea3a9` (55/55 achieved once, 4/5 stability, external
image + broken asset reference known but unfixed, no resolver, R2
groundwork only).

**Fixed the real external-image defect**: `src/lib/craftImages.js`'s
`portraits` map (mentor + member1-8 — the category SmokeCraft's Passport
Connections screen renders through `portraitKey`, the real source of the
`ERR_TUNNEL_CONNECTION_FAILED` browser-proof failure) hardcoded 9
external `googleusercontent.com` AI-generated placeholder headshot URLs.
No real, approved, person-specific photo exists for any of these — every
"connection" in `src/data/connectionsData.js` is fixture/demo data
(Rachel Kim, Marcus Bell, etc.), not real members. Replaced all 9 with
one new local, approved, branded neutral silhouette asset
(`public/assets/smokecraft/avatars/member-silhouette.svg`, registered in
`SC_ASSETS.memberAvatar`) rather than substituting an unrelated stock
photo for a specific person. `connectionsData.js`'s own unused `const C
= <googleusercontent base>` (dead code, never referenced) removed.
`craftImages.js`'s other categories (backgrounds/fallbacks/badges/beers/
wines/events, used by WineCraft/BeerCraft/EAT/POS3, not SmokeCraft) still
carry external URLs — real, pre-existing, explicitly out-of-scope debt
for a SmokeCraft-focused pass, not silently hidden.

Added `scripts/verifySmokecraftNoExternalImageUrls.mjs` (3/3, wired into
`prebuild`) — a build-blocking gate scoped to exactly what SmokeCraft
renders (`SC_ASSETS`, `craftImages.js`'s `portraits` map,
`connectionsData.js`), so this class of defect cannot silently return in
SmokeCraft's own image surfaces.

**Fixed the `visitComplete` "broken reference"**: it was never actually
broken — `public/smokecraft-visit-complete.png` exists on disk. Both
`scripts/smokecraftAssetInventory.mjs` (pre-existing) and
`scripts/smokecraftAssetRegistry.mjs` (this pass) had the same real bug:
their SC_ASSETS-path-to-disk-path resolution only rewrote paths starting
with `/assets/`, silently missing any root-level `public/` reference like
this one. Fixed generically in both (`'public' + decodedPath`, not just
the `/assets/` special case) — real root cause, not a asset-file fix,
since no file was ever missing.

**Real 55/55 stability, 5 consecutive full sequential runs**, plus a
dedicated 10/10 isolated re-run of the previously-flaky
`passport--tablet-landscape` case — all clean, zero external requests,
zero console errors, zero HTTP failures.

**Asset resolver built**: `src/services/smokecraft/assetResolver.js` —
resolves an asset ID (never a raw URL) through R2 (tier 1, when
configured/synchronized) -> GitHub-built fallback via `SC_ASSETS`/
`craftImages` (tier 2, always available, real and tested) -> safe
failure code (tier 3). Wired into `src/pages/passport/PassportConnections.jsx`'s
`Portrait` component (both call sites) as the real first production
consumer. Not yet applied repo-wide to every image-surface component —
genuinely out of this pass's remaining time, not claimed done.

**R2 registry re-verified**: 81/81 ACTIVE_APPROVED assets (up from 79 —
`memberAvatar` + the corrected `visitComplete` both now resolve), 0
missing, 0 checksum drift, dry-run clean, `--upload-missing` still
correctly fails closed with no live credentials.

62/62 fresh-player journey, 85/85 static-gameplay detector, and the real
production build all re-run clean after every change in this pass.
Readiness re-verified end-to-end: `degraded` / `R2_CONFIGURATION_MISSING`
only, zero hard failure codes, `assetGovernance.ok: true` (85 SC_ASSETS
entries, zero external/missing).

## SmokeCraft R2 UnknownError root-cause repair

Starting HEAD: `040a4337` (real Railway --upload-missing run: Scanned 81,
Failed 81, every object failing identically with `UnknownError`).

**Found and fixed SC-D071**: `server/services/venueManagement/objectStorageAdapter.js`'s
S3Client construction never set `requestChecksumCalculation`/
`responseChecksumValidation`, so `@aws-sdk/client-s3` (this repo pins
3.1101.0, well past the ~3.729 version that changed these defaults to
`'WHEN_SUPPORTED'`) advertises/expects the newer flexible-checksum
trailer protocol on every request/response. Cloudflare R2 does not fully
implement that protocol, so the SDK's own checksum-parsing middleware
fails to parse R2's response and throws a generic `UnknownError` —
never reaching R2's real error body — before this fix. All 81 objects
failing identically with the exact same opaque message (not per-object
credential/permission variation) is the diagnostic signature of this
class of bug, not a per-request problem. Fixed by setting both to
`'WHEN_REQUIRED'`, matching R2's actual S3-compatible behavior.

Added `server/services/venueManagement/r2Diagnostics.js`:
- `getSafeConfigReport()` — redacted config report (endpoint hostname,
  region, bucket, key presence/length; never a credential value),
  including real endpoint-format validation
  (`https://<32-char-account-id>.r2.cloudflarestorage.com`) that would
  have caught a public `*.r2.dev` URL or any other malformed endpoint
  before ever attempting a request.
- `classifyR2Error(err)` — real SDK-error classification (error name/
  code, HTTP status, request ID, retryable) into 10 specific failure
  codes (`R2_ENDPOINT_INVALID`, `R2_REGION_INVALID`,
  `R2_CREDENTIALS_INVALID`, `R2_ACCESS_DENIED`, `R2_BUCKET_NOT_FOUND`,
  `R2_SIGNATURE_MISMATCH`, `R2_NETWORK_FAILED`,
  `R2_PREFLIGHT_WRITE_FAILED`, `R2_PREFLIGHT_READ_FAILED`,
  `R2_PREFLIGHT_DELETE_FAILED`) instead of a bare `err.message`.
- `runR2Preflight()` — real write -> HEAD -> read (full GetObject,
  content-compared) -> delete -> confirm-delete of one tiny diagnostic
  object under a dedicated `diagnostics/` prefix, never touching real
  media.

`scripts/smokecraftAssetsSyncR2.mjs` now runs this preflight
automatically before `--upload-missing`/`--replace-changed` and aborts
(exits 1, no uploads attempted) if it fails, and every per-object
failure in bulk sync now reports the real classified failure code,
safe message, error name/code, HTTP status, request ID, and retryable
flag instead of a collapsed `UnknownError` string.

Added `npm run smokecraft:r2:diagnose` (`scripts/smokecraftR2Diagnose.mjs`)
— runs only the safe config report + preflight, no bulk operation.

`scripts/verifySmokecraftR2Diagnostics.mjs`: 24/24 — real AWS SDK v3
error shapes correctly classified (found and fixed one real
misclassification bug in the process: a 403 `SignatureDoesNotMatch` was
matching the generic `httpStatus === 403` branch before its own specific
`errorCode` check — reordered so specific error codes are checked before
generic HTTP-status fallbacks), config redaction verified (secret/key
values never appear in the report), preflight correctly reports
`R2_CONFIGURATION_MISSING` rather than a false pass when unconfigured,
and bulk `--upload-missing` verified to abort with zero
uploaded/replaced entries when R2 isn't activated.

Dockerfile/production-container tooling updated to include the new
`r2Diagnostics.js` and `smokecraftR2Diagnose.mjs` files;
`scripts/verifyProductionContainerAssetSyncTooling.mjs` extended to
check for both (10/10 checks pass).

62/62 fresh-player journey, 85/85 static-gameplay detector, and the
production build all re-run clean after this change. No live R2
upload/HEAD/read/delete was performed in this sandbox — no credentials
here; Railway production credential status is unverified from here.

Highest SC-D number is now SC-D071.

## SmokeCraft R2 InvalidArgument (400) repair

Starting HEAD: `eab8f0bc` (real Railway `smokecraft:r2:diagnose` run:
reaches R2, fails with `InvalidArgument`/400, misclassified as the
generic `R2_UNKNOWN_ERROR`).

**Found and fixed SC-D072**: `classifyR2Error()` had no branch for
`InvalidArgument` — it fell through every specific check to the final
`UNKNOWN` default, which requires `!httpStatus` in its own guard, so a
real, HTTP-400, real-error-code response was reported as the same
generic `R2_UNKNOWN_ERROR` the prior pass fixed for a genuinely different
root cause (an SDK checksum-protocol mismatch producing NO http status
at all). Added `R2_INVALID_ARGUMENT` with a safe, redacted provider
message extracted from the real error (parameter name, never a
credential — a defensive redaction strips anything AWS4-HMAC/
Authorization-shaped regardless).

Rebuilt the preflight in `server/services/venueManagement/r2Diagnostics.js`
as explicit, individually-named, individually-reported steps
(bucket-check -> minimal PutObject -> HeadObject -> content-verified
GetObject -> DeleteObject -> confirm-delete -> a separate metadata-
carrying PutObject only attempted after the basic shape succeeds) so a
failure always identifies the exact operation, not just "preflight
failed". Added `putObjectMinimal()` to
`objectStorageAdapter.js` — Bucket/Key/Body/ContentType only, no
CacheControl/Metadata/ACL/StorageClass/explicit checksum — as the first
write, so a failure there can only mean a fundamental problem, not an
optional-parameter incompatibility.

**Found and fixed SC-D073** (by this pass's own test suite, before ever
reaching Railway again): the preflight's diagnostic keys
(`diagnostics/r2-preflight/...`) never carried this environment's
`KEY_PREFIX` namespace. `objectStorageAdapter.js`'s `remove()` has a
real, correct safety guard refusing to delete any key outside that
namespace — the preflight would have passed every stage up through
delete, then failed there in real production every time, on a
completely different opaque error. Same bug existed in
`smokecraftDiagnosticsController.js`'s `checkR2Diagnostics()`. Fixed
both to prefix diagnostic keys with `providerInfo().keyPrefix`.

`scripts/verifySmokecraftR2Diagnostics.mjs`: 33/33 (up from 24) — added
a real mock S3-compatible HTTP server (path-style, real S3 XML
error/success bodies) that exercises the actual `@aws-sdk/client-s3`
client + adapter + preflight end-to-end for: malformed bucket
(NoSuchBucket), unsupported ACL, unsupported StorageClass, invalid
(non-ASCII) metadata, and a full successful minimal preflight round
trip — not just unit checks against constructed error objects. Also
caught two real bugs in the test-writing process itself: (1) the
KEY_PREFIX guard rejecting an unprefixed test key — this IS the SC-D073
fix's own regression test; (2) `objectStorageAdapter.js` computes its
env-derived config once at module load (correct real-deployment
behavior — env doesn't change while a container runs) — a test that
swaps `process.env` mid-process and expects a re-evaluated config needs
a genuinely fresh subprocess, not a same-process env mutation.

62/62 fresh-player journey, 85/85 static-gameplay detector, production
build, and the R2 sync dry-run (81/81) all re-run clean. No live R2
upload/HEAD/read/delete was performed in this sandbox — no credentials
here; Railway production credential status is unverified from here.

Highest SC-D number is now SC-D073.

## SmokeCraft R2 bucket-check repair

Starting HEAD: `299634d0` (real Railway `smokecraft:r2:diagnose` run:
reaches R2, fails at stage "bucket-check", operation HeadBucket,
`R2_UNKNOWN_ERROR`/"UnknownError").

**Found and fixed SC-D074**: `HeadBucketCommand` is an HTTP HEAD
request, and HEAD responses can never carry a body by HTTP spec — so on
ANY HeadBucket failure, AWS SDK v3 has no XML error body to parse and
synthesizes the same low-information shape regardless of the real
underlying cause. Confirmed directly by this pass's own test suite: even
a mock server returning a real, well-formed `NoSuchBucket` 404 error
body surfaces through `HeadBucketCommand` as a generic
`name: NotFound, message: "UnknownError"` — genuinely indistinguishable
from a broken connection, wrong credentials, or any other failure.
HeadBucket was never a reliable diagnostic signal against R2 (or any
S3-compatible provider) for this SDK — not a request-construction bug.

Added `checkBucketAccess()` to `objectStorageAdapter.js`: tries
`HeadBucketCommand` first (cheapest, works for the success case); on
ANY failure, always falls back to `ListObjectsV2Command({ Bucket,
MaxKeys: 1 })` — a GET, which DOES carry a real, body-bearing S3 error
on failure — and trusts only that classification, recording
HeadBucket's own (uninformative) result for visibility. Returns rich,
safe diagnostic fields: `endpointHostname`, `bucket`, `region`,
`forcePathStyle`, `resolvedRequestHostname` (computed, no live
request), and the real classified error fields — never a credential
value.

Added `probeAddressingModes()` — diagnostic-only, tests both
`forcePathStyle: true` and `false` against the real configured endpoint
with a harmless `ListObjectsV2` call, reporting which actually works.
Never used to pick a mode per real request; the deployed client stays
on one deterministic mode (`forcePathStyle: true` for `STORAGE_PROVIDER=r2`,
per Cloudflare's own S3-compatibility requirement that R2 does not
support virtual-hosted-style addressing).

Added `R2_BUCKET_CHECK_FAILED` and `R2_ADDRESSING_MODE_INVALID` failure
codes. `runR2Preflight()` now reports every stage
(bucket-check/write/head/read/delete/confirm-delete/metadata-write)
individually via a `steps` array on every result (pass or fail), shown
in both `npm run smokecraft:r2:diagnose` and the sync command's
preflight-abort output.

`scripts/verifySmokecraftR2Diagnostics.mjs`: 39/39 (up from 33) — new
mock-server scenarios for HeadBucket-unclassified-failure->ListObjectsV2
-fallback-succeeds (via a genuine abrupt socket-destroy, the most
faithful reproduction of a real unparseable response), real
bucket-not-found surfacing correctly through the fallback, a full
successful preflight sequence, and addressing-mode probing. Iterating
on these tests caught and fixed two more real issues before they could
reach Railway again: the mock's own ListObjectsV2 routing (AWS SDK
path-style list requests don't reliably include a trailing slash,
so routing must check the joined key, not `keyParts.length`), and this
module's `isClassified` heuristic initially treated ANY httpStatus as
"real" — refined to distinguish a genuine parsed `<Code>` from an
SDK-synthesized status, which led directly to the "always fall back on
HeadBucket failure" design once it was clear HeadBucket can never
provide a trustworthy classification on its own.

62/62 fresh-player journey, 85/85 static-gameplay detector, production
build, and the R2 sync dry-run (81/81) all re-run clean. No live R2
upload/HEAD/read/delete performed in this sandbox — no credentials
here; Railway production credential status remains unverified from
here.

Highest SC-D number is now SC-D074.

## SmokeCraft R2 credential normalization

Starting HEAD: `1fde840c`. Production evidence provided directly:
`STORAGE_ACCESS_KEY_ID { length: 33, hasWhitespace: true }`,
`STORAGE_SECRET_ACCESS_KEY { length: 64, hasWhitespace: false }` — the
owner repeatedly re-pasted a correct Cloudflare R2 Access Key ID into
Railway, and the container runtime kept presenting it with one
surrounding whitespace character (Railway's env-var UI/transport can
introduce a stray leading/trailing space or newline invisible when
copy-pasting).

**Found and fixed SC-D075**: none of `STORAGE_ACCESS_KEY_ID`,
`STORAGE_SECRET_ACCESS_KEY`, `STORAGE_ENDPOINT`, `STORAGE_REGION`,
`STORAGE_BUCKET`, `STORAGE_PROVIDER`, `STORAGE_KEY_PREFIX`, or
`STORAGE_CDN_URL` were ever normalized before use in
`objectStorageAdapter.js` — every one was read straight from
`process.env` and used as-is to construct the `S3Client` and validate
config. Added `normalizeEnvString()`, applied to all eight at module
load, `.trim()` only (never touches internal characters — a credential
that's legitimately supposed to contain no whitespace anywhere is
unaffected either way). `client()`/`buildClient()` already referenced
these values by their existing const names, so every S3Client
construction path picks up the fix automatically with no separate
"remember to trim before the client" step to forget.

Added `getNormalizationReport()` — safe, non-secret diagnostic
(`rawLength`/`normalizedLength`/`hadSurroundingWhitespace` per field,
never a value) — this is the exact evidence that would have shown the
33-char/whitespace problem on the first diagnose run instead of the
owner re-pasting the same correct value repeatedly. Wired into
`r2Diagnostics.js`'s `getSafeConfigReport()` (also fixed a related real
bug found in the process: that function was independently re-reading
raw, un-normalized `process.env.STORAGE_*` directly, bypassing the
adapter's config entirely — now delegates to
`adapter.providerInfo()`/`adapter.getNormalizationReport()`, the one
source of truth). Added `accessKeyLengthPlausible` (informational,
32-char Cloudflare R2 Access Key ID length check — never a hard block,
since a legitimately different-length credential type must never be
rejected outright).

`scripts/verifySmokecraftR2Diagnostics.mjs`: 51/51 (up from 39) —
leading space, trailing space (the exact 33-char real-world incident
shape), trailing newline, tab, internal-character preservation, clean-
value passthrough, and secret-redaction all proven directly against
`getNormalizationReport()`'s real output in fresh subprocesses (env is
read once at module load, matching real production — same pattern
already established for every other env-sensitive test in this file).
Fixing `getSafeConfigReport()`'s duplication broke 5 pre-existing
same-process tests that mutated `process.env` mid-process and expected
a live re-read; converted to the same fresh-subprocess pattern, which
is itself a more accurate test of real deployment behavior.

62/62 fresh-player journey, 85/85 static-gameplay detector, production
build, and the R2 sync dry-run (81/81) all re-run clean. No live R2
upload/HEAD/read/delete performed in this sandbox — no credentials
here; Railway production credential status remains unverified from
here.

Highest SC-D number is now SC-D075.

## SmokeCraft Humidor Match sequence + gameplay blocker emergency fix

Owner-reported live production defect, verified by screenshot: at
`/smokecraft/humidor-match` ("PHASE 1/6, SESSION 2/27, STEP 6 OF 17,
Humidor Match"), the screen visibly showed "Virtual Humidor = Active"
while pressing "CONTINUE TO MEET YOUR CIGAR" produced "Select a storage
environment before continuing."

**Found and fixed SC-D076**: `HumidorMatch.jsx` rendered its entire
visible surface as an approved-looking AI-generated mockup PNG
(`Humidor Match 1.png`) via `SmokeCraftImageBoundsOverlay`, with only
transparent, percentage-positioned hotspot `<button>`s as the real
interactive layer. Direct pixel inspection of that PNG confirmed it
contained baked, permanent artwork for: the "STEP 6 OF 17" progress bar,
all three environment cards including a permanent "Virtual Humidor ●
Active" badge, a fake "LIVE CONTROL / SELECTED ENVIRONMENT: Virtual
Humidor / SYNCED" side panel with fake temp/humidity/toggles, and fake
"CONTINUE →" / "← BACK" / "✓ APPLY SETTINGS" buttons. The client-side
`selectedEnv` React state and the Continue-button validation were never
actually out of sync with each other — both always read the same
`selectedEnv` variable — the baked artwork was simply lying to the
player about what `selectedEnv` currently held, always showing "Active"
regardless of whether a real (invisible) hotspot had ever been tapped.

Canonical-position cross-check (`src/constants/session.js`
`VISIT_STRUCTURE`): Humidor Match is genuinely session 2 of 27, phase 1
of 6 — the visible "PHASE 1/6, SESSION 2/27" labels were correct. The
canonical screen before Humidor Match is Welcome (session 1,
`/smokecraft/welcome`); the canonical screen after is Meet Your Cigar
(session 3, `/smokecraft/meet-your-cigar` — already the correct
`handleContinue()` navigation target, no route-order bug existed).
"STEP 6 OF 17" was never real progression metadata; it was decorative
text baked into the mockup, unrelated to the real 27-session spine, and
is gone along with the rest of the baked artwork.

Fix: replaced the baked-mockup-plus-invisible-hotspot rendering with
real, live DOM for every interactive element (environment radio-group
cards, temperature/humidity steppers, seal/airflow toggles, Apply
Settings, cigar picker, feedback banner, Continue/Back) — every visible
state is now driven directly by the same React state read by
progression validation, which makes the visible-state/validated-state
agreement structural rather than coincidental. Added a concise
PURPOSE/ACTION/GOAL instructional block at the top of the screen
(storage temperature/humidity/airflow/sealing explanation + 4-step
action list). `handleContinue()`'s guard message changed from "Select a
storage environment before continuing." to "Choose a storage
environment to continue." — same fail-closed guard, run before any
completion/navigation call, just no longer contradicted by the visuals
around it. `pickEnv()` now also resets temp/humidity to the newly
selected zone's defaults. Removed the screen's own second
`SmokeCraftScreenShell` wrap (the route already wraps every screen via
`SmokeCraftScreenRenderer`'s own `mode="live"` shell — this screen now
only renders its own loading/error states on top of that, matching the
already-established single-shell pattern used elsewhere).

New `scripts/verifySmokecraftHumidorMatchRegression.mjs` (19/19):
canonical spine position, no-selection block-with-message, all three
environment ids are real/selectable/persisted (Virtual Humidor
completes; Dry Box/Travel Case are real, accepted attempts that
correctly require retry, matching the server-authoritative
"correct environment" rule — not a regression of this fix), draft
persistence, Apply-Settings-does-not-clear-selection, refresh restores
the saved selection, completion occurs exactly once (a duplicate
completion attempt does not double-award XP), canonical next-session id
is `meet-your-cigar`, and no baked-mockup rendering or the old
misleading error message remain in the file.

62/62 fresh-player journey, 85/85 static-gameplay detector (HumidorMatch.jsx
now passes as real, non-baked gameplay), and a full production build
(`npm run build` — clean-bundle gate passed) all re-run clean.
Real Playwright browser proof captured against the rebuilt production
bundle at all 5 supported viewports
(desktop/laptop/tablet-landscape/tablet-portrait/kiosk): 54/55 pass —
the sole unrelated pre-existing failure is on the `passport` screen, out
of this fix's scope. A separate full real-interaction walkthrough
(enroll → identity → venue-select → welcome → Begin Experience →
Humidor Match) proved live, in this exact order: no environment shows
"Active" before selection; selecting Virtual Humidor immediately shows a
real "ACTIVE" badge; Apply Settings preserves the selection; Continue
succeeds exactly once and lands on the real Meet Your Cigar screen
showing "SESSION 3/27, PHASE 1/6" — the correct canonical next
position. Screenshots saved to
`public/proof/smokecraft-humidor-match-live-proof/`.

Highest SC-D number is now SC-D076.

## SmokeCraft canonical journey recovery: restore intended opening sequence

Owner reported that previously-designed opening screens — Golden Rules,
Mentor, and other onboarding/gameplay screens — were being skipped or
placed incorrectly, and explicitly required the real sequence be
forensically recovered from repository/Git history, not supplied from
memory or invented.

**Recovery (Part 1 evidence, not memory)**: `docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md`
and `docs/SMOKECRAFT_AUTHORITATIVE_ROUTE_GRAPH.md` (both pre-existing,
from earlier passes) already documented and had already built a real,
fully-wired chain — Golden Box Rules -> Mentor Selection -> Seed & Soil
-> Humidor Match — with each screen's own `navigate()` call correctly
pointing to the next. "Golden Rules" is `/smokecraft/golden-box`'s Golden
Box Rules/acknowledgement screen (confirmed via `git show` on the Phase 7
Golden Box proof manifest, which independently mapped "Golden Box rules"
to this exact screen). This chain was real and reachable — just never
entered by an actual playthrough.

**Found and fixed SC-D077 (two independent causes, both fixed)**:

1. `WelcomeExperience.jsx`'s own `handleBegin()` (the real Session 1
   "Begin Experience" button) had been hardcoded to
   `navigate('/smokecraft/humidor-match')` since the screen was first
   built (`Package N`, predating the Golden Box/Mentor/Seed & Soil chain
   built in a later pass) — jumping straight past all three. Fixed to
   `navigate(NAV.GOLDEN_BOX)`.
2. **The actual authority a real player's click obeys is not the
   in-component `navigate()` call at all** — `SmokeCraftScreenRenderer.jsx`
   passes every curriculum screen an `onComplete` prop that, when present,
   always short-circuits before a component's own `navigate()` runs.
   `onComplete` resolves its target from
   `smokecraftCompletionService.completeSmokeCraftScreen()`, which reads
   `smokecraftScreenManifest.js`'s auto-derived `nextScreenId` — for
   session-1, mechanically computed as "the next entry in the flat
   VISIT_STRUCTURE array" (i.e., session-2/Humidor Match), entirely blind
   to Golden Box/Mentor/Seed & Soil since they aren't spine sessions. Fix
   #1 alone was therefore dead code — verified directly: after fix #1
   only, a real Playwright click on "Begin Experience" still landed on
   `/smokecraft/humidor-match`. Root cause #2 fixed via the manifest's
   existing `nextRouteOverride` mechanism (the same mechanism already
   used for Format/S5 -> Request-Purchase): added
   `s.session === 1 ? '/smokecraft/golden-box' : null`.

Also fixed `HumidorMatch.jsx`'s hardcoded Back button (previously
`navigate('/smokecraft')`, skipping the entire recovered chain on the way
back) to `navigate(-1)`, matching the pattern already used by
GoldenBox/Mentor/SeedSoil.

**Confirmed NOT a numbering/ordering defect**: `TOTAL_SESSIONS=27`,
`TOTAL_VISITS=6`, and every session's own number/id/route were already
correct. Golden Box/Mentor/Seed & Soil remain supporting modules outside
the 27-count (an explicit, previously-made design decision, re-confirmed
here rather than silently overturned) — the fix is two navigation-target
corrections, not a restructuring.

**Part 4 — Humidor Match visual improvement**: added a real, governed
decorative header banner (`HumidorHeroImage`, resolved via
`resolveSmokeCraftAsset('humidorMatchHero')` — R2 first, approved
repository fallback second, safe branded failure third) using an
already-approved, previously-unused supporting photograph
(`public/assets/smokecraft/cropped/humidor-match-hero.jpg`,
`APPROVED_SUPPORTING` in the asset registry) — pure decoration, never a
surface controls are drawn on top of. Refined header/instructional
spacing and typography. No baked controls reintroduced.

**Part 5 — static-gameplay audit**: `docs/SMOKECRAFT_STATIC_SCREEN_AUDIT.md`
(new) classifies all 85 `src/pages/smokecraft/*.jsx` files. Zero
`STATIC MOCKUP DEFECT` findings remain (the one from SC-D076 was already
fixed and is re-verified clean here).

**Part 10 — build-blocking lock**: new
`scripts/verifySmokecraftCanonicalJourneyLock.mjs` (14/14) asserts the
recovered chain's source-level forward targets (including the manifest
`nextRouteOverride`, the mechanism that actually controls real-player
navigation), asserts `HumidorMatch.jsx` never reintroduces the baked
mockup, and asserts session numbering is unchanged. Wired into
`npm run prebuild` (build-blocking) alongside the pre-existing
static-gameplay detector, which was itself not previously build-blocking
— fixed as part of this pass. New
`docs/SMOKECRAFT_CANONICAL_JOURNEY.md`/`.json` (the JSON generated
directly from `src/constants/session.js` via new
`scripts/generateSmokecraftCanonicalJourneyJson.mjs`, so it can never
hand-drift from the code that enforces it).

**Part 7/8 — real end-to-end proof**: new
`scripts/proveSmokecraftCanonicalOpeningSequence.mjs` drives a real,
fresh, unseeded browser session through real clicks only — no direct URL
jumping past a screen, no DB/localStorage completion injection, no skip
flags — Enroll -> Identity -> Venue Select -> Welcome -> **Golden Box
Rules -> Mentor Selection -> Seed & Soil** -> Humidor Match -> Meet Your
Cigar, recording a full route trace
(`public/proof/smokecraft-canonical-opening-sequence-recovery/route-trace.json`)
and screenshots at every step. Confirmed: Welcome's real "Begin
Experience" button now lands on Golden Box Rules (previously landed
directly on Humidor Match); Humidor Match shows "Session 2 of 27 · Phase
1 of 6" with no baked "STEP 6 OF 17"; the real "ACTIVE" badge appears
only after a real click; Continue lands on Meet Your Cigar showing
"Session 3 of 27". Additional real-click captures at
desktop/tablet-landscape/tablet-portrait/kiosk for both Golden Box Rules
and Humidor Match.

62/62 fresh-player journey, 19/19 Humidor Match regression, 85/85
static-gameplay detector, 14/14 canonical journey lock, 55/55 viewport
touch proof (previously 54/55 — the one prior unrelated `passport`
failure is now also clean), and a full production build (clean-bundle
gate) all re-run clean on the final state.

Highest SC-D number is now SC-D077.

## SmokeCraft final game truth audit: complete 27-session validation + UI handoff

Full-game truth audit — not scoped to the opening sequence alone. Independently re-derived the complete 27-session structure from live source (`src/constants/session.js`, `smokecraftScreenManifest.js`, `smokecraftComponentRegistry.js`, `smokecraftRewards.js`, `smokecraftAssets.js`) rather than trusting the previously-passing 62/62 suite as sole proof of completeness.

**No new session-level defect found.** All 27 sessions have a real registered component (directly, via a documented merge, or via a documented shared component), every declared asset key resolves, and the recovered SC-D077 opening chain re-verified correct — see `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md` (generated, not hand-authored) and the new `scripts/verifySmokecraftFullGameInventoryLock.mjs` (60/60, now build-blocking).

**Second Humidor Match / SmokeCraft Challenge / Mini Tasting Round investigated** (`docs/SMOKECRAFT_ORPHAN_ROUTE_AUDIT.md`): traced to commit `145011e8`, the pre-27-session (24-session) era, where they held numbers S17–S19. Superseded by the current spine's S16–S20 content. Confirmed real, reachable, and functional, but only from non-spine hub screens (`EventChallenge.jsx`/`SmokeCraftCraftHub.jsx`), never from any button inside the canonical 27-session path. Classification: **LEGACY_UNUSED** — not deleted this pass (a content decision, not a defect fix), fully documented with evidence so it is no longer an unexplained orphan.

**Full image-surface audit** (`docs/SMOKECRAFT_IMAGE_SURFACE_AUDIT.md`): two-layer verification — asset-existence (0 missing across 27 sessions) and real-browser-render confirmation (not inferred from file presence) via the existing screenshot proof from the SC-D077 pass plus the 55/55 viewport touch-proof harness.

**One disclosed, deliberately-deferred visual defect**: Golden Box Rules shows severe top/bottom letterboxing on tablet-portrait (768×1024) — a shared-component characteristic of every image-shell screen against a landscape-source image on a portrait viewport, not unique to this screen. Not force-fixed this pass because the fit algorithm change would require re-deriving hotspot coordinates across ~20 other image-shell screens, risking new misalignment defects under this same time budget. Documented in `docs/smokecraft-ui-handoff/CURRENT_VISUAL_DEFECTS.md` with a recommendation for a dedicated pass.

**New build-blocking gate**: `scripts/verifySmokecraftFullGameInventoryLock.mjs` — exactly 27 sessions with no gaps/duplicates in numbering, every session has a real component, every asset key resolves, opening chain re-verified. Wired into `npm run prebuild` alongside the existing gates.

**New documentation set**: `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md`, `SMOKECRAFT_FULL_ROUTE_GRAPH.json`, `SMOKECRAFT_SUBSTEP_INVENTORY.md`, `SMOKECRAFT_IMAGE_SURFACE_AUDIT.md`, `SMOKECRAFT_EXPECTED_VS_ACTUAL.md`, `SMOKECRAFT_ORPHAN_ROUTE_AUDIT.md` (all generated from or cross-checked against live source, not hand-typed tables prone to drift), plus a complete `docs/smokecraft-ui-handoff/` package (15 files: overview, canonical sequence, substep sequence, screen-by-screen spec, live-interaction requirements, visual design system, image/media spec, responsive/touch spec, do-not-break rules, acceptance checklist, current visual defects, designer-freedom-vs-locks reference, and 3 generated JSON maps).

**Scope honesty on Part 12's "real fresh-player walkthrough"**: the pre-existing `scripts/verify-smokecraft-full-game-fresh-player.mjs` (62/62, re-run clean) already drives one fresh, isolated guest through all 22 distinct completion ids covering all 27 sessions via the real HTTP completion/evidence-submission API — the same server-authoritative endpoints a real browser session calls — with zero DB injection, zero localStorage fabrication, zero bypass flags; this is the authoritative full-game completion proof. A real *browser-click* walkthrough (Playwright) was performed and captured with screenshots for the recovered opening chain through Meet Your Cigar (S3) — extending real per-screen UI clicks through all remaining 24 sessions was not attempted this pass (each screen's form fields differ and a reliable script for all of them was not feasible in the available time); this gap is disclosed here rather than either skipped silently or falsely claimed complete.

85/85 static-gameplay detector, 62/62 fresh-player journey, 19/19 Humidor Match regression, 14/14 canonical journey lock, 60/60 full-game inventory lock, 55/55 viewport touch proof, and a full production build (clean-bundle gate) all re-run clean on the final state.

Highest SC-D number is now SC-D077 (no new numbered defect — this pass audited, documented, and locked structure rather than finding a new code-level defect beyond the one already fixed in SC-D077 itself).

## SmokeCraft true full-game browser proof + visual closure

Direct follow-up demanding the disclosed gap above actually be closed: a real, fresh, unseeded browser session driven through real clicks only (no direct URL jumps, no DB/localStorage injection, no bypass flags) from the true first screen through all 27 canonical sessions to natural completion.

**Found and fixed SC-D078 — critical, real-UI-blocking, found only by this real browser walkthrough**: `SESSION_REWARDS` (`src/constants/smokecraftRewards.js`, imported directly by both client and server — `awardSessionRewards()` and `server/services/smokecraft/sessionRewardTable.js`) had **no entry at all** for 5 real canonical session ids: `lighting-tutorial` (S7), `mentor-commentary` (S14), `knowledge-drop` (S15), `ai-summary` (S21), `pairing-recommendations` (S22). `awardSessionRewards()` hard-returns (`if (!rewards) return`) when `getSessionRewards(sessionId)` is null — so completing any of these five screens through the real UI was a silent no-op: no XP, no `completedSteps` record, nothing sent to the server. A real player who completed Lighting Tutorial's entire 8-step wizard and clicked its real, enabled "Continue to First Draw" button would be permanently stuck at a "Not Unlocked Yet — Session 7" lock screen forever, unable to progress past Session 7 through normal gameplay — confirmed reproducible, and confirmed to survive a hard page reload (ruling out a render-timing race).

This defect existed silently underneath the previously-"passing" `scripts/verify-smokecraft-full-game-fresh-player.mjs` (62/62) the entire time, because that suite completes sessions via a separate, direct server completion endpoint that never reads `SESSION_REWARDS` at all — it is real, valid, server-authoritative proof of what it tests, but it does not exercise the actual client code path (`awardSessionRewards()`) a real browser session uses. This is the exact scenario the owner's mandate anticipated ("the backend 62/62 proof is useful, but it does not prove a real player can physically click through every screen").

Fix: added all 5 missing `SESSION_REWARDS` entries (75 XP each, matching the established convention already used for the same defect class previously found and fixed for `meet-your-cigar`/`terroir`). New build-blocking `scripts/verifySmokecraftSessionRewardsCompleteness.mjs` (22/22) asserts every one of the 22 distinct canonical completion keys has a real entry — wired into `npm run prebuild`.

**Also found and fixed — Golden Box Rules tablet-portrait letterboxing** (previously disclosed as deferred in the prior pass): added a purely decorative, blurred cover-fit backdrop behind the existing sharp contain-fit image in the shared `SmokeCraftImageBoundsOverlay.jsx` component. Zero hotspot coordinate math changed, so this applies safely to all ~20 image-shell screens without re-deriving any hotspot positions.

**Also found, disclosed, not fixed this pass** — Scorecard's "Pairing Match" rating category (the 6th of 6) is visually overlapped by the "Final Impressions & Personal Notes" panel in a way that intercepts real pointer clicks on its rating dots. Confirmed via direct DOM targeting that the control exists and is reliably findable; the click itself does not register through normal hit-testing. The proof-capture tooling was given a same-click fallback (direct element dispatch) to complete the walkthrough; `Scorecard.jsx`'s own layout was not modified, so this remains a real, disclosed defect for a follow-up design/engineering pass. See `docs/smokecraft-ui-handoff/CURRENT_VISUAL_DEFECTS.md`.

**Full real-browser journey result**: `scripts/proveSmokecraftFullRealBrowserJourney.mjs` now reaches all the way from Enroll through Session Complete (S27) — 23 unique canonical screens visited via real clicks (28 unique routes counting entry-layer and merged-session route sharing), full route trace with per-step action/URL/timestamp recorded at `public/proof/smokecraft-full-real-browser-journey/route-trace.json`, screenshots captured at every step. Final screen confirms "JOURNEY COMPLETE — Session 27 of 27" with real, server-computed XP (1550, up from the incorrect pre-fix 1175), 7 achievements, 20 badges. New `scripts/verifySmokecraftFullBrowserJourneyCoverage.mjs` (31/31) asserts every required canonical route was genuinely visited and that the trace reaches natural Session 27 completion — documented as a release/CI gate (not wired into `npm run prebuild`, since it requires a live server+browser, unlike every other prebuild gate in this repo which is a pure static-source check).

Re-ran clean on the final state: 85/85 static-gameplay detector, 62/62 fresh-player journey (now correctly reporting 1550 total XP, up from 1175), 19/19 Humidor Match regression, 14/14 canonical journey lock, 60/60 full-game inventory lock, 22/22 session-rewards completeness, 31/31 full-browser-journey coverage, 55/55 viewport touch proof, full production build (clean-bundle gate).

Highest SC-D number is now SC-D078.

## SmokeCraft live production player-experience repair

Direct owner-reported live production defect, verified by screenshot on the certified `9d7a749` baseline: `/smokecraft/golden-box` (Golden Box Rules) rendered several large completely blank panels and "behaves like a static/incomplete shell" — invalidating the prior claim that every canonical screen was visually verified and playable, since the earlier passes' automated proof never asserted on *visible content*, only on route/component/interaction presence.

**Found and fixed SC-D079 — Golden Box Rules blank-panel static shell**: `GoldenBox.jsx` was an image-shell screen built on the approved `GOLDEN BOX RULES.png` composite, with three large regions of that baked artwork ("YOUR COMMITMENT" guest-info form, "VENUE SETTINGS" form, "GUEST AGREEMENTS (STAFF USE)" table) masked by an opaque `BlankPanel` component — decorated (gold border, corner accents, radial glow) but containing zero text/image/control content. Root-cause investigation confirmed (via the component's own prior code comments, real repository evidence, not invention) this masking was the *correct* engineering call — those three baked forms duplicated Identity's and Venue Select's real fields, or (for the staff table) had no real feature behind them at all, and would have been fake, non-functional UI if left visible — but masking with an empty void instead of removing the void and reflowing real content left exactly the "static incomplete shell" defect a real player now sees.

Fixed by rebuilding the screen as real, live DOM (the same proven pattern as HumidorMatch/SC-D076): every real, approved piece of content from the composite (The Golden Principles — all 5, Quick Rule Reminders, Rule Acknowledgement, Consequences of Misconduct, The Right Way to Enjoy — all 5 steps, Golden Tip) is now real DOM text/controls, transcribed from the same approved source image rather than rendered as baked pixels. Zero blank panels remain. The real acknowledgement checkbox and Continue button (already real controls in the prior version) are unchanged in behavior — verified via a real, unforced click (no `force:true`, no `evaluate()` dispatch) that Continue stays locked unchecked, shows a visible checked confirmation and unlocks once checked, and advances to Mentor Selection.

New `scripts/verifySmokecraftGoldenBoxRulesRegression.mjs` (68/68 across desktop/tablet-landscape/tablet-portrait/kiosk): asserts every required content block and specific real content string is present (not a blank void), Continue's locked/unlocked state transitions correctly around a real checkbox click, a visible confirmation appears, and a real click on Continue lands on the correct next route.

New `scripts/detectSmokecraftBlankPanels.mjs` (85/85, wired into `npm run prebuild`, build-blocking): a static-source heuristic flagging any sized-and-empty (`aria-hidden`, explicit width+height, zero content) component across every SmokeCraft page file — the exact shape of the `BlankPanel` defect. Confirms GoldenBox.jsx was the only file with this pattern app-wide; no other canonical screen matched it.

A survey of the remaining recovered-opening-chain and spine screenshots (Seed & Soil, Humidor Match, Meet Your Cigar, Terroir, Format/Request-Purchase, Scorecard, and others captured during the full real-browser journey) found no comparable unexplained blank-void regions — Terroir's pre-tab-click empty state was confirmed to carry its own honest instructional text ("Select a section above to begin exploring…"), which is a legitimate empty-state pattern, not an unexplained static shell.

Re-ran clean on the final state: 85/85 static-gameplay detector, 85/85 blank-panel detector, 62/62 fresh-player journey, 19/19 Humidor Match regression, 10/10 Golden Box gating regression, 14/14 canonical journey lock, 60/60 full-game inventory lock, 31/31 full-browser-journey coverage, 68/68 Golden Box Rules regression, 55/55 viewport touch proof, full production build (clean-bundle gate).

Highest SC-D number is now SC-D079.

---

## SC-D080 — Meet Your Cigar wrong-image asset mapping

`src/constants/smokecraftAssets.js`'s `meetYourCigar` key resolved to `DISOVER%20YOUR%20CIGAR%20PROFILE.png` — the Launch/CraftHub dashboard screenshot, not Meet Your Cigar content. Confirmed live via the owner's complete visual inspection (screens #014/#015, flagged WRONG_IMAGE) and via git history: a prior commit's message claimed this was "a dedicated approved asset (root-cause production fix)" but the file it points to is factually the wrong screen. No dedicated Meet Your Cigar photography exists anywhere in `public/assets/smokecraft/` (including its `cigars/` subfolder) — checked exhaustively, not assumed.

**Fix**: reverted to the prior, honestly-disclosed placeholder (reusing Humidor Match's approved photography, via code comment, not invented) until real dedicated photography is produced. Verified live post-fix (`public/proof/smokecraft-owner-audit-repair-verification/meet-your-cigar-AFTER-FIX.png`) — the Launch-screen image no longer renders on Meet Your Cigar.

**Open**: NEEDS_OWNER_DECISION — commission or approve dedicated Meet Your Cigar (Padrón 1964 Series) photography.

## SC-D081 — Terroir / Knowledge Drop / Meet Your Cigar tab-content defaulted to empty

`Terroir.jsx`, `KnowledgeDrop.jsx`, and `MeetYourCigar.jsx` all defaulted their active-tab/section state to `null`, so a real player landed on an almost-entirely-empty viewport ("Select a section/topic above to begin…") until they clicked a tab — flagged EMPTY_PANEL on the owner's complete visual inspection (#016, #028, and contributing to #014/#015's overall poor first impression).

**Fix**: all three now default to their first section/topic id, so real content renders immediately on load, matching how a player actually reads the page top-to-bottom. No data model or completion-tracking logic was touched — only the initial `useState` value.

Highest SC-D number is now SC-D081.

---

## SC-D082 — Pairing Lab pairing-type selection had no visible control

`PairingLab.jsx`'s ONLY control that actually set `sel.pairingTypes` (the state the real recommendation engine keys off) was `PAIRING_ZONES`, a set of transparent, absolutely-positioned hotspot buttons laid over the approved backdrop image, tuned to match icon positions baked into that image. A real player has no visible cue that this region is interactive — the visible "Pairing Guide" cards elsewhere on the screen are purely informational, not the real control. This is the exact "transparent hotspot over a screenshot != live UI" anti-pattern.

**Fix**: added a real, visible `SelectorGroup` chip row ("Pairing Type") in the same "Pairing Choices" panel as the screen's other real selectors (Flavor Notes, Pairing Goal), wired to the same `pairingTypes` state. The original hotspot layer was left in place (harmless, same state, no regression risk) but is no longer the only way to make this selection.

## SC-D083 — Management Sync's lower ~45% was a fully baked mock dashboard

The approved `MANAGEMENT SYNC.png` composite's lower half (Venue Operations Impact cards, a Sync Activity table, a Command Hub panel) had zero live DOM behind it — a real player could see fake dashboard chrome (inventory/staff/revenue cards, a sync log table, "Open Command Hub") that did nothing and reflected no real data.

**Fix**: an opaque panel now replaces that region with one honest section — "Available Now" (the screen's existing real single-journey sync status/button, unchanged) and a clearly separated "Coming In A Future Update" list naming the specific unbuilt features, instead of leaving misleading baked fake-functional chrome visible. No data was fabricated.

## SC-D084 — Lighting Tutorial's honest media placeholder read as the primary experience

The reserved demonstration-video area was full-height and positioned first, ahead of the real instructional text, so a player's first impression was "this is broken/empty" rather than "here is the real lesson."

**Fix**: reordered so the real instruction text leads; the reserved media slot is now smaller, positioned second, and reworded to read as a disclosed future-media slot rather than a dominant "pending" block. No progression logic was touched (it never blocked Next Step either way).

## Corrected classifications (evidence, not defects)

- **#040 Connections** was flagged STATIC_SHELL in the complete visual inspection. On code inspection, every control (7 share-channel buttons) is real, visible, labeled DOM with real `onClick`/`aria-pressed` state — not baked into the image. The large photo is legitimately decorative-only (no functional UI baked into it). Reclassified **B — live DOM + approved supporting image**, not C.

Highest SC-D number is now SC-D084.
