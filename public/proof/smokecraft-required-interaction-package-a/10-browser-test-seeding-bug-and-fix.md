# 10 — Browser-Test Guest-Seeding Bug and Fix

## The bug

`verify-smokecraft-required-interaction-package-a-browser.mjs` originally seeded
`localStorage['novee_guest_session']` via `page.goto(BASE)` followed by
`page.evaluate(seedGuest)`. Diagnostic script:

```js
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session')).completedSteps)
// before nav: []
```

`completedSteps` read back as an empty array immediately after the seeding `evaluate()` call —
even before any navigation to the target route occurred. Two prior hypotheses (schema-migration
mutation, `addInitScript` re-seeding on reload) were ruled out; both persisted with the bug still
present.

## Root cause

Navigating to `BASE` first mounts the real React app, and `GuestSessionContext` immediately
creates its own (empty) session via `loadSession() || createNewSession()`. The subsequent
`page.evaluate(seedGuest)` call races against the already-mounted app's own state/autosave
effects — the app's in-memory (unseeded) state can be written back to `localStorage` after our
seed, silently overwriting it, all before any navigation ever happens.

## The fix

Seed via `browser.newContext({ storageState: { origins: [{ origin, localStorage: [...] }] } })`
so `localStorage` is populated **before any page ever loads** — there is no window in which an
unseeded app can mount and race with the seed. `sessionStorage` (a static constant flag, not
subject to the same race) is set via `context.addInitScript()`.

## Verification

`before nav`, `t=300ms`, and `t=1500ms` all now read the full seeded `completedSteps` array; the
full browser suite passes 14/14, including the reload-resume step that a reseeding
`addInitScript`-only approach would have broken.
