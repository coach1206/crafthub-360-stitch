# 18 — UI/UX Developer Implementation Checklist

Use this as a working checklist when picking up development on this
platform. Each item links back to the relevant handoff doc.

## Before writing any code

- [ ] Read `00`-`03` to understand which system you're touching and its
      real vs. aspirational status.
- [ ] Confirm which palette applies (System 1 dark MD3 vs. System 2 light
      ivory/navy) — `13-DESIGN-SYSTEM.md`.
- [ ] Check `17-KNOWN-LIMITATIONS...md` for whether the screen you're
      touching already has a disclosed, unfixed issue — don't duplicate
      investigation.

## Customer-facing (SmokeCraft / Venue Humidor) work

- [ ] Reuse `SmokeCraftScreenRenderer`/`SmokeCraftSessionGuard` patterns
      for any new curriculum session — don't hand-roll a new guard.
- [ ] Any server-graded interaction must submit to a dedicated,
      answer-evaluating endpoint, not just the generic completion call —
      see `smokecraftRequiredInteractions.js` for which sessions already
      do this correctly (session 11/22 pairing, session 14 mentor).
- [ ] Preserve the responsive aspect-ratio-box + `onError`-hide pattern
      for any new image.
- [ ] Do not silently "fix" the app-wide letterboxing pattern as a side
      effect — flag it separately if you think it should change.
- [ ] Do fix the Golden Box Rules mobile text-overlap and empty-tablet-box
      defect if you touch that screen (`14-RESPONSIVE...md`).

## Staff-facing (POS360) work

- [ ] Confirm whether `HumidorControl`/`InventoryControl` reconcile with
      Venue Humidor Admin's inventory model before building new inventory
      UI — real open question, `12-INVENTORY-AUTHORITY-MODEL.md`.
- [ ] Any new POS360 role-gated action should extend
      `pos360Permissions.js`'s existing action/role vocabulary rather than
      inventing a new one — but remember this layer is UI-only; pair any
      security-relevant new action with a real backend permission check,
      don't rely on the client-side matrix alone.
- [ ] Reuse `StaffStatusBadge.jsx`'s existing state vocabulary
      (`*_preview`, `not_persisted`, etc.) for any new preview/fallback
      state rather than inventing new copy/colors.
- [ ] If building the manager-approval action screen for
      `manager_approval_required` (a real, currently-missing piece), place
      it logically in either POS360 (execution-adjacent) or E.A.T. 360
      (oversight-adjacent) per `02-PLATFORM-RESPONSIBILITY-MAP.md`'s
      boundary rules — recommend E.A.T. 360 since approval is an
      oversight action, but confirm with product before building.
- [ ] Reuse `CommandAppShell.jsx`'s five-zone grid for any new POS360
      screen rather than hand-rolling layout — this is explicitly why the
      shell exists.
- [ ] If extending the customer→POS360 handoff, use
      `RippleDissolveTransition` for the transition moment (add a new
      `target` value if needed) rather than a new transition component —
      `06-SCREEN-DISSOLVE-AND-TRACKING-STANDARD.md`.

## Management-facing (E.A.T. 360) work

- [ ] E.A.T. 360 has no fine-grained job-role matrix like POS360's —
      if you need manager-vs-admin-vs-owner differentiation inside an
      `/eat/*` screen, that's new work; don't assume it exists.
- [ ] Do not build against the `ModulePlaceholder` stub routes
      (NOVEE Vault, Remote Software Control, etc.) as if they were real
      screens — they declare their own future `phases`; treat those as
      the actual backlog, not this document's job to invent.
- [ ] `/eat/reorders` should read from the same inventory-depletion
      signal source as any future POS360/Venue Humidor reorder feature —
      confirm before building a second, parallel pipeline.

## Cross-cutting

- [ ] Every new mutation should write an append-only audit event
      (actor/venue/resource/action/timestamp/correlation-id) — reuse the
      proven `venue_cigar_media_events` shape, don't invent a new one.
- [ ] Every new error path should map to a fixed, safe error-code
      vocabulary — never surface a raw DB/stack-trace string to the UI.
- [ ] Every new form control needs a real accessible name (label/
      aria-label) — no exceptions.
- [ ] Minimum 44×44px touch target on staff/kiosk-facing controls.
- [ ] If adding any payment-adjacent UI, coordinate with the concurrent
      payment-gateway integration effort rather than duplicating it — do
      not modify payment logic as part of a UI/UX task.

## Before shipping any change touched by this checklist

- [ ] Update the relevant screen/route inventory file (`07`/`08`/`09`/`10`)
      if you added or removed a route.
- [ ] Update `17-KNOWN-LIMITATIONS...md` if you fixed a listed item or
      found a new one — keep the "honest disclosure" convention alive.
