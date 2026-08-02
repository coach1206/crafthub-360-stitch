# Known Limitations (Honest Disclosure)

- **No new front-end UI was built in this pass.** Age-gate confirmation modal, Consent Center screen, and data-rights request forms exist only as tested, real backend API endpoints (`/api/compliance/*`). Building the accessible React UI for these is the natural next step and is NOT claimed done here.
- **Checkout code is not yet wired to call `evaluatePurchaseEligibility()`.** The function is real, tested, and exported for reuse, but the existing Venue Humidor / customer checkout controllers (Package 2) were not modified in this pass to call it before allowing a tobacco line item. This is a real gap — flag for immediate follow-up before any live tobacco sale.
- **Retention enforcement is configuration only**, not automated per-table deletion jobs across every listed data category — this was an explicit mandate scoping decision (full automation deemed excessive scope for this pass).
- **Shipping/PACT Act destination validation** is jurisdiction-level only (see `counsel-review-items.md` #7), not full address-level validation.
- **E.A.T. known defect (111/130)** carried forward unfixed, as instructed — see `eat-known-defect.md`.
- **Pre-existing visual defects** (mobile/tablet letterboxing, Golden Box Rules text overlap) were not touched, correctly, since no new screen in this pass exhibited them.
- **No live third-party age-verification provider** — adapter shape only, as the mandate required.
- Accessibility testing in this pass is source/API-level only; no Playwright keyboard/screen-reader run against real rendered compliance UI was performed because that UI doesn't exist yet (see `accessibility-standard.md`).
