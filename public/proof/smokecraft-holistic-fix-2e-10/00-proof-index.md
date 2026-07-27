# Holistic Fix 2E-10 — Proof Index

Starting commit: `ce5d5ba7`

## What this proof directory covers

Deep state-change / persistence / duplicate-firing / disabled-state
verification for 5 representative curriculum-control implementations,
chosen to cover the behavior patterns that recur across the 276 controls
discovered in Holistic Fix 2E-9:

1. **Selection/toggle (image-shell hotspot zone)** — HumidorMatch (Session 2).
   Real click sets `aria-pressed=true`; clicking again toggles it back off.
2. **Rating-toggle with client persistence** — FirstThird (Session 8).
   Real click sets `aria-pressed=true`; survives a full page reload via
   journey-context localStorage.
3. **Expand/collapse (role="tab" section)** — Terroir (Session 4). Clicking
   a section reveals real additional content (not decorative) — the exact
   screen that broke the Holistic Fix 2E-6 centralized-injection attempt,
   confirmed unaffected by this pass's testing.
4. **Continue/completion button `done`-flag duplicate-fire guard** —
   HumidorMatch (Session 2). Confirmed via source read (`if (done) return`
   in `handleContinue()`) AND a live rapid-double-click test: two
   synchronous click events on the same pre-navigation element produce
   exactly one navigation, not two.
5. **Honest empty/disabled state (no fabrication)** — MentorCommentary
   (Session 14, no mentor selected). Confirmed "No Mentor Selected" is
   shown honestly with no fabricated mentor quote.

**Result**: 8/8 passing, re-confirmed on a final clean run
(`03-control-state-persistence-results.json`).

### Two test bugs found and fixed during this pass (disclosed, not hidden)

1. **Terroir section-click test initially failed** — used
   `getByRole('button', ...)` but the actual element has `role="tab"`
   (an explicit ARIA override). Fixed the test selector; re-ran to confirm
   the real behavior (which was always correct).
2. **Continue double-click test initially failed** — `Promise.all([click(),
   click()])` from the Node side let the first click's navigation complete
   before the second resolved, so the second landed on the NEXT page's own
   Continue button (a real, separate click), producing an apparent
   "double-advance" that was actually a test race condition, not a product
   bug. Fixed by dispatching both click events synchronously inside a
   single `page.evaluate()` call on the same pre-navigation element; the
   corrected test confirms the real `done`-flag guard works.

Both are recorded here as real findings from this pass's process, not
silently corrected without disclosure.

## Engine-level duplicate-protection gap (disclosed, not fixed)

See `SMOKECRAFT_INTERACTION_MATRIX.md`'s new section: the client-side
`done`-flag guard prevents a duplicate navigate/onComplete call from the
SAME page load, but no server-side idempotency-key protection was found
for XP/badge/stamp awards against genuinely independent requests (two
tabs, a retried network call). Recorded as a real gap for the later
gameplay-engine package, not fabricated as already handled.

## What this proof directory does NOT cover

- Individual state-change/persistence/duplicate-firing verification for
  the other 271 discovered controls beyond these 5 representative
  implementations.
- Engine-level (server-side) duplicate-protection implementation — only
  investigated and disclosed as a gap, not built.
- A from-scratch classification of every one of the 276 controls into the
  mandate's 12 behavior categories — the interaction matrix documents the
  5 deep-tested implementations plus the full raw discovery inventory, not
  a per-control category label for all 276.
