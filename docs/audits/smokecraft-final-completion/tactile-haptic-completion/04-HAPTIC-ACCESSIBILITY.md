# 04 — Haptic and Accessibility

## Haptic behavior (real, this pass)

- Pattern set: light (30ms), medium (60ms), heavy (80ms, newly added — previously fell through to `light` silently since `'heavy'` wasn't a defined key, used by `PassportStamp.jsx`), success (short 3-step pulse), warning (distinct 3-step pulse). All brief, non-aggressive — no continuous or repeating patterns exist anywhere in the pattern set.
- Never blocks the interaction it accompanies — every call site treats `triggerHaptic()` as fire-and-forget; confirmed by source read across all 51 consumers (none `await` it or branch on a return value, since it returns `undefined`).
- Never fires on passive page load — confirmed by source read: every `triggerHaptic()` call site is inside an event handler (`onClick`/`onPointerDown`/etc.), never inside a bare `useEffect` with no user-gesture guard.
- Suppressed under `prefers-reduced-motion: reduce` (new this pass).
- Suppressed when the account-level `hapticsEnabled` preference is `false` (new this pass) — reads the same field `GuestSessionContext`'s `updateProfile`/preference setter already writes, so no second preference store was created.
- Fails silently on unsupported platforms (unchanged, pre-existing `try/catch` around `navigator.vibrate`).

## Accessibility

- `SmokeCraftTactileCard` requires a `label` prop and forwards it as `aria-label` — no generic "Button"/"Hotspot" labels are possible through this component (there is no default value; omitting `label` renders `aria-label={undefined}`, which is intentionally not a safe fallback, forcing every call site to supply a real one).
- Keyboard: `Enter` and `Space` both activate (matches native `<button>` semantics, explicit `preventDefault` on Space to avoid a page-scroll side effect).
- Focus: visible gold focus ring on `onFocus`, cleared on `onBlur` back to the pressed/selected/idle visual state.
- `aria-pressed` reflects `selected` (a real toggle-button semantic, appropriate for "this choice is currently selected" cards).
- `aria-disabled`/`aria-busy` reflect `disabled`/`loading`.
- Minimum touch target: `minWidth: 72, minHeight: 72` (the mandate's preferred minimum, not merely the 48px absolute floor).

## What was not independently re-verified this pass

Contrast ratios, reduced-motion visual (not just haptic) behavior, and screen-reader announcement ordering for the pre-existing per-screen `role="tab"` implementations were not re-audited from scratch — those screens were built and accessibility-reviewed in earlier completion passes (Phase 5/6/9) and are unchanged by this pass.
