# Holistic Fix 2E-3 — Proof Index

Starting commit: `97066b51`

## What this proof directory covers

1. **Educational completeness audit** — see `docs/smokecraft/SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md`. Per-session table of approved-asset keys, quiz-keyword presence, Golden Box references, cross-referenced against the automated regression suite's live asset-hash verification. Explicitly discloses which criteria (prose quality, per-criterion "why it matters"/flavor/quality/construction/learner-application/Golden Box relevance checklist) were **not** manually verified this pass.

2. **Double-shell investigation** — documented as an intentional decision in `src/components/smokecraft/SmokeCraftScreenRenderer.jsx` (see the comment above `RUNTIME_VERSION`). Session 1 and session-25/26 nest `mode="live"` (renderer) around their own pre-existing `mode="image-shell"` self-wrap. Confirmed via the full regression suite that this produces no visual/behavioral difference. Not removed, to avoid a second edit to the highest-blast-radius file in the operation for a purely cosmetic gain.

3. **Commerce consolidation** — see the new "Holistic Fix 2E-3 — commerce, alias, and orphan-route classification decisions" section in `docs/smokecraft/SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`. `menu`/`cart`/`checkout`/`payment-success`/`order-status` classified as a distinct, real workflow that is currently orphaned (zero live entry points — its only button component, `SmokeCraftMenuButton.jsx`, is never imported anywhere else). Decision: retain as documented direct-access, not removed (not proven obsolete, just not yet wired to an entry point).

4. **Alias consolidation** — the manifest's 14 `alias-redirect`-classified entries are formalized as the canonical alias table. A new build-blocking check in `scripts/validateSmokecraftManifest.mjs` fails if any literal `<Navigate to="/smokecraft/...">` in `App.jsx`'s SmokeCraft route tree is not represented in that table.

5. **Regression suite results this pass** (see `01-regression-results.txt` in this directory): build, both validators, asset-exclusivity, phase-session-lock, final-three-approved-assets, and full-journey-sequence-and-assets all re-confirmed green.

## What this proof directory does NOT cover (explicit gaps, not silently omitted)

- No dedicated curriculum-specific browser test script (session-1→27 forward AND a standalone session-27→1 backward walk as one dedicated artifact) was built. The existing `full-journey-sequence-and-assets` suite already walks forward with guard/resume checks but was not extended into a separate dedicated curriculum test this pass.
- No dedicated five-viewport curriculum sweep (handheld / 10" tablet / 12" tablet / 15" display / desktop) was built. The existing suite's four-viewport sweep (not five, and only landing + session-02 samples, not all 21 sessions) remains the most recent responsive evidence.
- `SMOKECRAFT_MIGRATION_QUEUE.md`, `SMOKECRAFT_SCREEN_CLASSIFICATION.md`, `SMOKECRAFT_INTERACTION_MATRIX.md`, and `SMOKECRAFT_LOCKED_BASELINE.md` were not updated this pass — only `SMOKECRAFT_GAME_MANIFEST.json` (auto-regenerated) and `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` were touched.
- A from-scratch, exhaustive orphan/direct-access/role-restricted classification across all ~108 routes was not performed — only the commerce flow and two previously-known orphans (Demo/DemoReset) were newly documented this pass.
