# Accessibility Target

**Target: WCAG 2.2 Level AA readiness.** This is a readiness/engineering-control statement, not an audited certification claim — no professional accessibility audit was performed, and none is claimed.

Covered by this pass, pragmatically scoped to the NEW compliance screens and endpoints this package adds (age-gate confirmation, consent center, data-rights request forms), per the mandate's explicit scoping instruction to focus new-form accessibility here rather than a full platform sweep:
- Server responses carry structured `error` codes usable for accessible field-level error messages (e.g. `staff_actor_required`, `forbidden_cross_user_request`, `identity_not_verified`) rather than opaque failures.
- No dependency added for automated a11y scanning — checked `package.json`, `axe-core` is not currently a dependency; per mandate instruction not to add a heavy new dependency, this package implements pragmatic DOM/source-based checks instead (see `keyboard-screen-reader.md`).

**Known limitation**: no new front-end screens (age-gate modal, consent center UI, data-rights request forms) were built as React components in this pass — this package delivered the server-authoritative API surface those screens will call. Building the actual accessible UI components is tracked in `known-limitations.md` and is the natural next step before this readiness target can be verified against real rendered markup.
