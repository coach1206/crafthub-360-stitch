# 17 — Known Limitations and Active Production Work

All items below are real, sourced from proof packages or direct code
read — none are invented for this document.

## Highest-tracked defect IDs (carried forward, not touched by this pass)

- **SC-D068** — Golden Box results screen showed a contradictory "not
  released" banner over real, finalized results. Fixed in the Final
  Gameplay Acceptance pass — see
  `public/proof/smokecraft-final-gameplay-acceptance/03-visual-acceptance-review.md`
  and `11-final-report.md`.
- **SC-D068b** — Golden Box content routes' rate limiter had no dev/test
  exemption (unlike every sibling Golden Box router). Also fixed in that
  same pass.
- No `SC-D069` has been assigned as of the most recent packages read
  (`smokecraft-full-game-fresh-player-closure`,
  `smokecraft-venue-humidor-media-management`) — both explicitly state no
  qualifying new pre-existing defect was found and left unfixed.

## Real, disclosed, currently-unfixed issues

1. **Mobile/tablet letterboxing** (SmokeCraft core) — fixed
   desktop-proportioned "device card" inside real viewports rather than
   full-bleed reflow. Consistent, non-crashing, but a real UX limitation.
   See `14-RESPONSIVE-AND-ACCESSIBILITY.md`.
2. **Golden Box Rules screen text overlap + empty content boxes** — real
   text collision at 390px mobile width; two empty black boxes at 834px
   tablet width. Found, not fixed, top candidate for next
   visual-acceptance pass. See `14-RESPONSIVE-AND-ACCESSIBILITY.md`.
3. **Session 25 Rewards XP-breakdown rows show 0 XP each** despite a
   correct, server-verified headline total. Non-blocking (no
   investor-facing total/rank/completion figure is wrong), but a real,
   disclosed display bug in the itemized breakdown.
4. **7-phase vs. 6-phase discrepancy** — task mandates across this
   project's history have referenced "7 phases"; the one real, canonical
   `VISIT_STRUCTURE` registry remains 6 phases. Not reconciled.
5. **`data-testid` coverage is inconsistent** across screens — some have
   full coverage, others require role/text-based locators. Affects test
   ergonomics more than end-user UX.
6. **Storage provider is local-disk dev fallback**, not production
   storage (Venue Humidor media). `STORAGE_PROVIDER_STATUS =
   'NOT_CONFIGURED'`. Provider-adapter interface is swap-ready but not
   production-ready as shipped.
7. **Responsive image variants share one underlying file** — metadata
   buckets are correct, but no real resize/transform pipeline exists
   (`sharp`/`multer`/provider-transform audited absent).
8. **Master catalog** proven at the service layer only, not through the
   HTTP upload endpoint (no licensed manufacturer imagery available in
   sandbox to seed it through the API).
9. **Manufacturer/distributor URL import's download path** not exercised
   against a real remote host (allowlist/SSRF guard, rights-reference
   requirement, and CSV dry-run are all proven live; the fetch-and-store
   step itself was not, for lack of an authorized host in-sandbox).
10. **1MB Express JSON body-parser limit sits below the 5MB
    image-validator limit** for base64-in-JSON uploads — oversized files
    over ~750KB raw are rejected by the wrong layer (`413` instead of the
    intended validator message). Still produces correct customer-facing
    rejection behavior, wrong error message source.
11. **Admin media screen is intentionally minimal** — no drag-to-reorder
    gallery UI (reorder implemented/tested at API level only), no
    CSV-import UI (API level only), no master-catalog browse/assign UI.
    Disclosed, scoped-down breadth cuts, not realness cuts.
12. **Rejection-reason input uses native browser `prompt()`**, not a
    styled in-page modal. Functionally accessible, visually inconsistent.

## Real, disclosed staff/POS360-side limitations

13. **POS360's job-role permission matrix
    (`pos360Permissions.js`) is explicitly UI-only** — no backend record
    of hospitality job roles (server/bartender/kitchen/host) exists; the
    module's own comment states this is "a UI-level guardrail, not real
    access control." A production hardening pass needs a real
    backend-authorized staff-identity layer.
14. **Staff PIN login has a local-preview fallback** (`StaffPinScreen.jsx`)
    that accepts a fixed demo PIN (`1234`) when the backend is
    unreachable — clearly labeled in the UI, but a real security-relevant
    behavior a developer must not accidentally ship enabled in production
    without the intended backend gate present.
15. **Customer-to-POS360 order bridge has a documented local-fallback
    path** (`local_fallback`/`not_persisted`) and a manual-entry fallback
    UI — real, working as UI, but means POS sync is not guaranteed live
    today; no proof package confirms the real bridge endpoint's live
    behavior.

## Aspirational / not-yet-built surfaces (E.A.T./founder tier)

16. NOVEE OS Ultra Command Center, NOVEE Vault, Remote Software Control,
    and Venue Mirror Command Hub are all `ModulePlaceholder` stubs — real
    routes/gates exist, no built screens. See
    `09-EAT360-SCREEN-INVENTORY.md`.
17. No dedicated manager-approval UI was conclusively located for the
    `manager_approval_required` staff-handoff state — a real functional
    gap between the state existing and a screen to act on it.

## Active production work by other agents (do not touch)

A concurrent agent may be working on a **real payment-gateway
integration** in this same repo/branch. This documentation pass did not
read, modify, or make claims about payment-gateway internals beyond what
is already disclosed in existing proof packages (checkout/payments
screens exist; payment logic itself is out of scope for this handoff).
