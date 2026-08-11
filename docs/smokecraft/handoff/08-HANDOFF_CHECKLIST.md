# SmokeCraft 360 — Handoff Checklist (Doc 8 of 10)

For whoever picks this branch up next — designer, engineer, or owner review.

## Before you touch anything

- [ ] Read doc 01 for orientation, then doc 07 for current pass/fail state
      and its honest gaps section.
- [ ] Confirm you're on `integration/smokecraft-main-candidate`, not `main` —
      this branch has never been merged.
- [ ] Do not merge, deploy, or mark anything "owner approved" as a side
      effect of reviewing this package. Those calls belong to the repo
      owner.

## To run the app locally and see the current state

- [ ] Postgres must be running and reachable at the `DATABASE_URL` the
      integration branch expects (`crafthub_integration_candidate` in every
      session that built this branch — confirm before assuming a different
      DB name is correct).
- [ ] `npm run build`, then start the server (`node server/index.js`,
      `PORT=3002` was used throughout this branch's history) — check
      `curl http://localhost:<port>/api/health` shows `"db":"postgres"`
      before navigating anywhere.
- [ ] Walk the journey starting at `/smokecraft` (Launch) — do not jump
      straight to a mid-journey URL; the session guards will bounce you back
      to Identity if prerequisites aren't met (this is correct, tested
      behavior, not a bug — see doc 07's bypass check).

## To regenerate the visual proof

- [ ] Run `node scripts/captureSmokecraftMigrationRealJourney.mjs` against a
      running local server on the integration DB.
- [ ] It writes 28 screenshots + a contact sheet to
      `docs/visual-proof/migration/`.
- [ ] Copy the resulting `SMOKECRAFT_ONE_SYSTEM_FINAL_INDEX.png` to
      `docs/visual-proof/main-integration/SMOKECRAFT_OWNER_REBUILD_FINAL_INDEX.png`
      if you want it to become the new reviewed baseline — don't overwrite
      that file silently; visually inspect the new sheet first (open it, look
      for flat dark blocks, clipped titles, hidden controls, duplicate baked
      text — the specific defect classes found and fixed in this branch's
      history).

## Known open items (not blockers to review, but not done either)

- [ ] Railway/Vercel deployment status has never been verified from any
      session working this branch — needs an environment with real
      deployment credentials.
- [ ] The VenueHumidor commerce/admin/payment subsystem
      (`src/pages/smokecraft/venueHumidor/**`) exists on disk but is not
      routed in `App.jsx` — a deliberate exclusion (untested Stripe
      dependency, out of tested scope), not an oversight. Wiring it in is a
      distinct, not-yet-scoped piece of work.
- [ ] Only the 14 owner-rebuild screens have a current, dedicated
      multi-viewport visual contact sheet. The remaining spine/supporting-
      module screens are confirmed *reachable and functional* (24-checkpoint
      canonical-journey trace) but do not have an equivalent per-screen
      visual regression sheet in this repo as of this handoff.
- [ ] The "160/160 5-viewport" and "43-screen full journey" PASS claims in
      the integration checklist/report are carried-forward summary claims;
      their underlying raw per-viewport artifacts were not found as
      standalone files at the time of this handoff (see doc 07, gap #1).

## Standing constraints (repeat from doc 01 — do not relax these without the owner's explicit say-so)

- [ ] Do not merge `integration/smokecraft-main-candidate` into `main`.
- [ ] Do not deploy.
- [ ] Do not delete `recovery/smokecraft-codex-final`.
- [ ] Do not touch unrelated POS360/E.A.T./NOVEE systems while working in
      this branch.
- [ ] Do not reintroduce the screenshot-hotspot architecture
      (`SmokeCraftAssetRoute` + invisible %-positioned hotspots over a baked
      PNG) that main's old SmokeCraft screens used — it was deliberately
      superseded, not preserved as an option.
- [ ] Do not mark anything "owner approved." That determination is the
      repository owner's alone, made outside of any session working this
      branch.

## Where to escalate a question

- Journey order / gating questions → doc 02 + `src/constants/session.js`
- "What route renders this?" → doc 03 + `src/App.jsx`
- "What file draws this screen?" → doc 04 + `smokecraftComponentRegistry.js`
- "Why is this file/table/dependency here?" → doc 05 + the three JSON reports
  in `docs/smokecraft/integration/`
- "What does it currently look like?" → doc 06 + the contact sheets
- "Is X actually verified, or just claimed?" → doc 07 — read the gaps
  section before citing any PASS as current
