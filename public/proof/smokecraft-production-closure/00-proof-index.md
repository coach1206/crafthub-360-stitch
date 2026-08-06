# SmokeCraft Production Closure — 55-view touch proof & safe haptics

Starting HEAD: `d0340434` (5-viewport touch browser proof, 33/55 passing).

## Scope of this pass

This pass addresses Parts 1–2 of the requested "SmokeCraft 360 Final
Production Closure" mandate (touch-target repair + safe haptics) with
real, verifiable fixes and re-runnable proof. **Parts 3–12 of that
mandate (full canonical-journey re-verification browser run, GitHub
image inventory/classification, authoritative asset registry, R2
adapter/sync/diagnostics, readiness-page extension, and the full
30+-command test matrix) were NOT attempted in this pass** — see
"Explicitly out of scope" below for why, rather than claim completion
that cannot be backed by real evidence.

## What was fixed (SC-D067)

1. **Touch targets.** Six screens' interactive controls were below the
   44×44 CSS-px floor: `VenueSelect.jsx` filter pills,
   `WelcomeExperience.jsx` and `SmokeCraftPassport.jsx` image-surface
   hotspots, `SmokeCraft.jsx`'s `SecondaryHotspot`, `GoldenBox.jsx`
   hotspots. All now carry a `minHeight: 44` floor (or
   `max(44px, N%)` where the original size was percentage-based).
2. **Safe haptics.** `SessionComplete.jsx` called `triggerHaptic('success')`
   at mount time (no user gesture), which Chrome's vibration policy
   silently blocks and logs a console warning for. `src/utils/haptics.js`
   now gates every `navigator.vibrate()` call behind a real, previously
   observed user gesture (pointerdown/keydown/click), a document
   visibility check, and returns a real boolean — never throws, never
   fires on mount, never blocks gameplay.

## Verification run in this pass

- `node scripts/verifySmokecraftSafeHaptics.mjs` — 5/5 (see
  `01-safe-haptics-results.txt`)
- `node scripts/detectSmokecraftStaticGameplay.mjs` — 85/85 pass (no
  regression from the touch-target edits) — see
  `02-static-gameplay-results.txt`
- `npm run build` — see `03-build-log.txt`

## Explicitly NOT covered by this pass

- The full 55-case browser re-capture (Part 12) was not re-run in this
  pass — no live browser/Playwright harness was available in this
  session to re-drive all 5 viewports × 11 screens against a running
  server and regenerate `browser-proof.json`. The CSS fixes above
  directly target every touch-target failure and both haptic-warning
  cases recorded in the last real capture
  (`public/proof/smokecraft-viewport-touch-proof/browser-proof.json`,
  33/55), but "55/55" is not claimed here without a fresh real capture.
- Parts 4–9 (GitHub image inventory/classification, authoritative
  asset registry, Cloudflare R2 adapter/sync/diagnostics) were not
  built this pass. `STORAGE_PROVIDER=local` and no
  `CLOUDFLARE_R2_*` credentials are present in this environment's
  `.env` — real upload/HEAD/read/delete against R2 is not possible
  here, and the mandate explicitly forbids claiming R2 completion
  without that live proof.
- Part 10 (readiness-page failure-code extension) and Part 11 (full
  30+-command test matrix) were not built/run this pass.

These are honestly reported as not done, not fabricated as passing.

## Update — real browser re-capture + real 27-session journey (this pass)

Superseding the "not attempted" note above: both were run for real in this
pass, against a genuinely production-mode build.

**Real bug found and fixed in the process**: `npm run build` was silently
producing a NON-production bundle (5.4MB main chunk including the dev-only
`DevRoleSwitcher` toolbar, verified present and interactive in the shipped
`dist/`) — `vite build` was not resolving to production mode from a plain
shell invocation in this environment. Rebuilding with
`NODE_ENV=production npx vite build --mode production` produces a correct
3.1MB bundle with zero dev-only code (confirmed: `grep -c "DEV MODE ONLY"
dist/assets/*.js` → 0). **This means the original 33/55 and this pass's
first two re-capture attempts (3/55, then 2/55) were partly measuring a
bundle defect that will not exist in a correctly-invoked production
deploy** — Railway's own `npm run build` invocation needs verifying it
resolves to production mode the same way (see final report).

**Real 27-session journey** (Part 2): `scripts/verify-smokecraft-full-game-fresh-player.mjs`
walked one fresh, isolated guest identity through all 27 sessions (22
distinct completion ids) via the real completion API, then the full
Golden Box lifecycle, then a cross-player isolation check — **62/62
passed**, 0 failed. No manual DB writes for progression, no localStorage
manipulation, no route skipping, no client-supplied XP/completion value
trusted. Output: `public/proof/smokecraft-full-game-fresh-player-closure/`.

**Real 55-case browser re-capture** (Part 1/12), against the corrected
production build, with a real progressed guest identity (seeded via
`scripts/seedSmokecraftDemoGuestCookie.mjs`, which walks the same real
completion API as the 27-session script, then hands the resulting
server-issued guest-session cookie to
`scripts/captureSmokecraftViewportTouchProof.mjs` for real Playwright
navigation/screenshot/measurement — not a bypass, not synthetic data):

**52/55 passing** (up from 33/55 at `d0340434`), regenerated at
`public/proof/smokecraft-viewport-touch-proof/browser-proof.json`.

Additional real defects found and fixed in this pass, beyond the six
screens covered by SC-D067's first commit:
- A shared `[aria-label="Back"]` hotspot rendered across most
  image-surface screens was under the 44px floor at several viewports
  (82×28 down to 70×25) — global CSS floor added in `src/styles.css`
  since the exact rendering component could not be pinned down inside
  this pass's remaining budget (see "Known gaps" below).
- `SmokeCraft.jsx`'s `PrimaryHotspot`/`StaticHotspot` (the landing
  screen's Start/Begin controls) had no `minHeight` floor — fixed.
- `GoldenBox.jsx`'s acknowledgment checkbox measured 16–20px — its real
  touch target is the enclosing `<label>` (native HTML behavior: a tap
  anywhere in the label toggles the checkbox), so the capture script now
  measures the label for checkbox/radio inputs instead of flagging a
  false positive.

**3 remaining failures, not fixed in this pass:**
1. `venue-select--desktop`: 3 console "Failed to load resource: 404"
   messages. Does not reproduce in an isolated single-page run — appears
   to be a test-harness artifact (a stray in-flight request from a prior
   screen in the same shared browser context, not a real broken image
   reference), but this is not proven, only suspected; flagging honestly
   rather than dismissing it.
2. `admin-readiness--tablet-landscape` / `--tablet-portrait`: overflow
   check fails only inside the full 55-case sequential run, never in an
   isolated direct-navigation or tap-simulation reproduction attempt.
   Root cause not found in this pass's remaining budget.
3. `passport--tablet-landscape` intermittently shows 2 console
   errors/http failures across repeated runs (flaky — passed in 2 of 3
   re-runs in this pass).

None of these three block the "Ready" bar and are not touch-target
regressions of any fix made in this pass — they are pre-existing or
harness-fidelity issues newly surfaced by actually re-running the proof
for real. Honestly reported as open, not silently dropped.

## Final closure update — real 55/55, permanent build lock, R2 groundwork

**Browser proof: 55/55**, real, in the committed `browser-proof.json` and
`run-summary.json`. Three root-caused fixes (favicon 404s, a
measurement-ordering bug in the capture script itself, a checkbox
touch-target false positive) — see the System Defect Register's SC-D070
entry for full detail. Re-run 5 times total across this pass: 4/5 at
55/55, 1/5 at 54/55 on a real but separate, network-dependent external-
image-URL issue in `connectionsData.js` (flagged, not fixed — see below).

**Build mode is now permanently locked**, not dependent on a human typing
the right flags: `npm run build` → `scripts/buildProduction.mjs`
(`NODE_ENV=production` + `vite build --mode production`, programmatic,
cross-platform) → `scripts/verifyProductionBundleIsClean.mjs` (fails the
build if any dev-only marker or abnormal bundle size is detected).
Dockerfile and `nixpacks.toml` both resolve through this same script via
`npm run build`.

**R2**: real groundwork added (asset inventory + registry generator,
dry-run-verified sync command, adapter extended with HEAD/put-at-key,
a real readiness diagnostic wired end-to-end) — not "complete". No live
R2 upload/HEAD/read/delete was performed; this sandbox has no
credentials (`STORAGE_PROVIDER=local`), and Railway's production
credential state is unverified from here — not claimed absent, just
unverified. See `public/proof/smokecraft-asset-registry/` for the real
generated registry, inventory report, and dry-run sync report.

## Final media and stability closure update

- External image defect (SmokeCraft's real, rendered `portraits` map):
  fixed — 9 googleusercontent.com URLs replaced with one local approved
  branded silhouette asset. `verifySmokecraftNoExternalImageUrls.mjs`
  (3/3) now build-blocks any regression in SC_ASSETS, the `portraits`
  map, or `connectionsData.js`.
- `visitComplete`: confirmed never actually broken — a scan-path bug in
  both asset-inventory tools, fixed generically in both.
- 55/55 across 5 consecutive full sequential browser-proof runs.
  `passport--tablet-landscape` (the prior flaky case) independently
  re-run 10/10 clean.
- Asset resolver built (`src/services/smokecraft/assetResolver.js`) and
  wired into its first real consumer (`PassportConnections.jsx`). Full
  repo-wide adoption across every image-surface component not completed
  this pass.
- R2 registry: 81/81 ACTIVE_APPROVED resolve cleanly in dry-run. No live
  R2 upload/HEAD/read/delete performed — no credentials in this sandbox;
  Railway production credential status remains unverified from here.
