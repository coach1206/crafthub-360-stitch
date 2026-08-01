# 10 — Known Limitations

Documented honestly, not silently omitted, per this pass's own mandate
and consistent with the prior package's own precedent.

1. **Session 25 (Rewards) XP-breakdown rows still don't independently sum
   to the correct total.** Carried forward from the Full Game
   Fresh-Player Closure package's own known-limitations doc. Re-confirmed
   in this pass: the headline XP total (`1175` for this pass's demo
   player) is correct and server-verified (matches
   `GET /api/smokecraft/player-state` exactly — see
   `05-live-data-honesty.md`); only the itemized "XP BREAKDOWN" rows
   underneath it (Completed-Session XP, Passport XP, Pairing XP, Mentor
   XP) show `0 XP` each despite a non-zero real total. **Confirmed still
   non-blocking** — no investor-facing total/rank/completion figure is
   wrong, only a secondary breakdown display. Visible in
   `screenshots/desktop/07-rewards.png`.

2. **Visual/UX pass is representative, not exhaustive**, per the
   mandate's own explicit pragmatic scope. 14 representative screens (24
   screenshots across 3 viewports) were captured rather than the full
   27-screen x 5-viewport matrix — see `04-screen-proof-index.md` for the
   exact, disclosed reduction and rationale.

3. **Mobile/tablet presentation is a fixed, letterboxed "device card,"
   not a full-bleed responsive reflow**, and a real text-overlap +
   empty-content-box issue was found one screen deeper (Golden Box Rules)
   than the originally-scoped representative set — see
   `06-responsive-tablet-notes.md`. Disclosed as a real finding for a
   follow-up pass rather than attempted as a rushed, unreviewed app-wide
   CSS change in this pass's remaining time budget.

4. **`data-testid` coverage is inconsistent across screens** — some
   screens have them on every interactive control, others require
   role/text-based locators. Noted in `07-accessibility-notes.md`;
   affects test ergonomics more than end-user usability, not fixed here.

5. **Client-side session-number navigation gating relies on a local-only
   completedSteps cache with no server-state hydration path** (confirmed
   by direct source read of `GuestSessionContext.jsx` and
   `SmokeCraftSessionGuard.jsx` during this pass). A real sequential
   player never hits this, because their local cache and the server
   complete in lockstep with every real click. It only matters for a
   test/demo methodology (like this pass's) that builds server state fast
   via direct API calls and then needs to *view* deep-journey screens
   without replaying every click — which the app's own sanctioned Demo
   Mode control (`enterDemoMode()`) already solves cleanly and was used
   for exactly that purpose in this pass (see `02-investor-demo-path.md`).
   Not treated as a defect: it is real, pre-existing, intentional-looking
   architecture, and reopening it (adding full server-state hydration
   into the local navigation cache) is out of this pass's "small,
   targeted fixes only" scope.

6. **7-phase vs. 6-phase discrepancy** (carried forward, unchanged from
   the prior package): the task mandate references phases; the one real,
   canonical `VISIT_STRUCTURE` registry remains 6 phases. Not silently
   reconciled.

7. **One pre-existing, unrelated build-time esbuild warning** ("Duplicate
   key 'border' in object literal") persists, same as previously
   documented — a lint-level warning, not a build failure, outside this
   pass's scope.
