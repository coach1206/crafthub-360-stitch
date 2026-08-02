# CONSOLIDATED COUNSEL-REVIEW CHECKLIST

Everything below requires real lawyer review before SmokeCraft 360 tobacco commerce can launch. Nothing on this list has been legally validated by this engineering pass.

1. Terms and Conditions draft (`policy_versions`, `policy_type='terms'`) — full review, governing-law jurisdiction to be specified.
2. Privacy Policy draft (`policy_type='privacy'`) — full review.
3. Tobacco warning language (`policy_type='tobacco_warning'`, EN + ES) — placeholder text, not jurisdiction-verified.
4. Cookie/localStorage policy draft (`policy_type='cookie_policy'`).
5. Per-state US jurisdiction configuration (`compliance_jurisdictions`) — only `US-DEFAULT` federal-minimum placeholder exists; every state SmokeCraft actually launches in needs its own reviewed row (age, shipping-ban status per PACT Act, flavor restrictions, local licensing).
6. Dominican Republic / Caribbean expansion jurisdiction (`DR`, currently disabled) — full separate legal review required before any activation, including minimum age (18 placeholder is unverified) and tobacco-sale legality.
7. Shipping/PACT Act compliance — before `shipping_allowed` is ever flipped `true` for any jurisdiction, destination-address validation logic beyond this pass's jurisdiction-level boolean must be reviewed and likely extended.
8. Quantity limits per jurisdiction — currently `NULL` (not configured) for every jurisdiction; counsel to confirm required limits before launch.
9. Rewards/Passport program — confirm no unintended cash-equivalent-value / sweepstakes characterization.
10. Golden Box — confirm submission/prize terms, and separately review if any prize carries monetary value (possible sweepstakes/contest law implications).
11. Retention schedule (`retention_policies`) — all rows are operational defaults pending counsel approval, especially payment/tax retention windows which vary by state.
12. Accessibility — WCAG 2.2 AA is a readiness target, not an audited certification; a real professional accessibility audit is recommended before claiming AA compliance publicly.
13. Age-verification provider — `provider_adapter` method is a shape only; before launch, counsel + vendor security review is needed for whichever real third-party age-verification provider is selected.
14. Translated (Spanish) legal text — translation itself has not been legally reviewed for accuracy/equivalence.
