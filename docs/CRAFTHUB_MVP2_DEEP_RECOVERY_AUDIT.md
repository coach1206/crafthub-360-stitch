# CraftHub MVP2 — Deep Recovery Audit

Supersedes/extends `docs/CRAFTHUB_MVP2_APPROVED_VERSION_AUDIT.md` with an
exhaustive multi-branch, full-history, non-filename-limited search. Does not
overwrite the prior document's findings — both are preserved.

## Phase 2 — Git source enumeration

| Source | Count |
|---|---|
| Local branches | 3 (`main`, `claude/beautiful-thompson-r3mm5m`, `recovery/smokecraft-codex-final` [current]) |
| Remote branches | 20 (`origin/main` + 19 `origin/claude/*`/`origin/hotfix/*`) |
| Tags | 0 |
| Stashes | 0 |
| Recovery archive locations | 1 (`recovery-archives/UNTRACKED_WORK_ARCHIVE_POS360_EAT_NOVEE.tar.gz`, 57 entries, no CraftHub content — confirmed via `tar -tzf` full listing) |
| Commits (all branches, message contains "crafthub", case-insensitive) | 67 |
| Commits touching any CraftHub-named file (all branches) | 100+ distinct paths across history (full list captured during audit; see Phase 3/5 tables for the ones that are visual/component candidates) |

No inaccessible source encountered — all local git objects, all remote-tracking refs already fetched into this clone, and the one recovery archive were fully readable.

### `src/pages/CraftHub.jsx` across every branch — byte-identical

Computed via `git cat-file -p <branch>:src/pages/CraftHub.jsx | md5sum` for
all 20 remote branches plus the current commit (`aa0b9cf8`, pre-this-package):

```
094e7e35d5b1933d45299702277a833b   ← identical on all 20 remote branches
094e7e35d5b1933d45299702277a833b   ← current commit aa0b9cf8
```

**Every branch in this repository — including `main` — carries the exact
same `CraftHub.jsx` file, byte for byte.** There is no branch anywhere with
a different implementation of this component.

## Phase 3 — Component/content search beyond filename matching

Searched all generic hub/dashboard/launcher filenames
(`Home.jsx`, `Landing.jsx`, `Hub.jsx`, `Dashboard.jsx`, `CommandCenter.jsx`,
`ExperienceHub.jsx`, `ModuleHub.jsx`, `Launcher.jsx`, `Portal.jsx`,
`Ecosystem.jsx`, etc.) across current tree and full history. Only two
existing repo components carry CraftHub-adjacent names beyond
`CraftHub.jsx` itself:

| Candidate | Path | Route | Verdict |
|---|---|---|---|
| `CraftHubDashboard.jsx` | `src/pages/crafthub/CraftHubDashboard.jsx` | `/crafthub/dashboard` | **Not a candidate** — internal NOVEE OS platform-governance admin tool (tabs: Feature Flags, API Keys, Audit, Platform Health, Tenant/Billing/Security Governance), not the guest-facing launcher |
| `CraftHubOnboardingWizard.jsx` | `src/pages/crafthub/CraftHubOnboardingWizard.jsx` | `/crafthub/onboarding` | **Not a candidate** — venue onboarding wizard, distinct route, same admin surface |

### New finding this pass: `stitch_export/stitch_remix_of_crafthub_360_ecosystem_design/`

A large (200+ screen) Stitch design-export bundle present in the current
working tree (introduced by commits `d850afda`/`2bd17535`, never deleted).
Contains two CraftHub source-code candidates:

- `src_pages_crafthub.jsx_1.txt`
- `src_pages_crafthub.jsx_2.txt`

Both inspected directly. Both are near-identical ~45-line standalone mockup
components using `framer-motion` + `lucide-react` + a bare `onNavigate` prop
callback — **not** written against this application's actual architecture
(no `react-router`, no `GuestSessionContext`/journey context, no Staff
Handoff, no DayOne360, no Passport Connections, only 4 of the current
implementation's 5 module tiles). These are earlier-stage Stitch design
scaffolds for a *different, unintegrated* prototype shell, not a more
complete or newer version of the current `/crafthub` route — the current
`CraftHub.jsx` already has strictly more approved functionality (Passport
Connections, Staff Handoff, DayOne360) than either of these files. Rejected
as restoration candidates.

## Phase 4 — Route/alias forensics

Current `App.jsx` route table (all CraftHub-adjacent entries):

| Route | Component | Active | Notes |
|---|---|---|---|
| `/crafthub` | `CraftHub.jsx` | Yes | The route in question |
| `/crafthub/dashboard` | `CraftHubDashboard.jsx` | Yes | Admin governance, not a candidate (see Phase 3) |
| `/crafthub/onboarding` | `CraftHubOnboardingWizard.jsx` | Yes | Admin governance, not a candidate |
| `/craft-hub` | → redirect to `/crafthub` | Yes | Alias only |
| `/craft-modules` | → redirect to `/crafthub` | Yes | Alias only |
| `/dashboard` | → redirect to `/crafthub` | Yes | Alias only |
| `/eat/command-hub` | `EATCommandHub.jsx` | Yes | Different product surface (E.A.T.), not CraftHub |

No alias or hidden route resolves to a different CraftHub implementation.
`/crafthub` does not point to an outdated component while a newer one sits
elsewhere under another URL — confirmed by the redirect table above and the
branch-identical-hash check in Phase 2.

## Phase 5 — Visual asset forensics (the material new finding)

Full-history filename search (not limited to "CraftHub" in the name) found
two additional full-screen visual candidates missed by the prior
(`CRAFTHUB_MVP2_APPROVED_VERSION_AUDIT.md`) pass, which had only checked the
one candidate already named in `docs/mvp2-visual-image-registry.md`
(`CRAFT HUB EXPLAIND.png`):

| File | Path | Dimensions | Present in |
|---|---|---|---|
| `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | `public/assets/smokecraft-reference/approved/` **and** `public/assets/smokecraft-reference/rejected/` (identical bytes, `md5 e7db2d7a...`, in both folders simultaneously) | 1672×941 | Both approved/ and rejected/ — contradictory folder placement |
| `Crafthub 360 landing page.png` | `public/assets/smokecraft-reference/approved/` only | 1672×941 | approved/ only |

Both were opened and visually inspected (not just filename-matched):

- **`CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`** — a light cream/marble,
  gold-accent composition: header (Back to NOVEE OS / Home / CRAFTHUB 360 /
  DayOne360 Travel / Demo Mode / 360 Passport Connections), hero ("CRAFTHUB
  360 — VENUE TABLE EXPERIENCE — Guest craft experiences, Passport
  networking, staff handoff, and venue service flow"), 5 photo cards
  (SmokeCraft 360, PourCraft 360, WineCraft 360, BeerCraft 360, 360 Passport
  Connections), bottom nav (Enter CraftHub / Staff Handoff / 360 Passport
  Connections / DayOne360 Travel).
- **`Crafthub 360 landing page.png`** — a dark navy/gold ornate composition
  with a "LIVE VENUE TICKER" scrolling bar, the same header/hero/module-card
  text verbatim, a Staff Handoff + DayOne360 Travel banner row, **and a
  "VENUE SIGNALS" grid containing `Active Tables: 12`, `Staff Handoffs: 3`,
  `POS / Inventory: Nominal`, `E.A.T. Alerts: 1`, `Kitchen: On Track`, `Bar:
  Stocked`, `Humidor: 62°F / 70%`, `Events: 2 Tonight`** — the exact same
  fabricated values that were hardcoded into `CraftHub.jsx`'s `SIGNALS`
  array and removed in the prior package of this correction.

This confirms `CraftHub.jsx`'s content (module list, header/footer button
labels, hero copy, and — until this correction — the fabricated venue
metrics) was originally authored by transcribing this exact mockup's text,
not invented independently. **These are not evidence of a newer, unbuilt
CraftHub version — they are the design source `CraftHub.jsx` was already
built from**, confirming the current implementation, not contradicting it.

### Why these were not already logged as `/crafthub` candidates

Both files are explicitly classified in two pre-existing, dedicated audit
documents from earlier in this project's history — found and read during
this pass:

- `docs/SMOKECRAFT_COMPLETE_APPROVED_ASSET_INVENTORY.md` (§7, Duplicate/
  overlap assets): *"`Crafthub 360 landing page.png`, `smokecraft/
  crafthub-landing.png` — CraftHub entry (not a SmokeCraft route)"* and
  *"`CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` (present in both raw and
  approved) — POS/venue-table feature, not SmokeCraft educational
  journey"*.
- `docs/SMOKECRAFT_360_IMAGE_RECONCILIATION.md` (§11/§14): classifies
  `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` as an **orphaned candidate for
  SmokeCraft's own internal Entry-layer "Select Venue or Lounge" (E3)
  screen** — i.e. a possible background for `/smokecraft/venue-select`, a
  completely different route — explicitly noting *"needs visual
  confirmation"* and *"this document did not perform pixel-level visual
  inspection"* (now performed, in this pass: confirmed it is a
  CraftHub-launcher composition, not a venue-picker background, so even
  that candidate use is not a fit).

Neither document ever proposed either image as a `/crafthub` replacement.
The approved/rejected duplicate placement of `CRAFTHUB 360. VENUE TABLE
EXPERIENCE.png` is therefore most plausibly a filing artifact from an
earlier asset-sorting pass (the file was evaluated for a *different*
purpose — E3 venue-picker background — and the approved/rejected split
reflects that unrelated evaluation, not a `/crafthub`-specific approval
decision), not a signal that a `/crafthub` visual redesign was approved and
never implemented.

### Contact sheet

`public/proof/crafthub-mvp2-version-recovery/contact-sheet.png` — both
full-screen candidates side by side with filename/path/dimensions/verdict
labels, plus the current live `/crafthub` screenshot for comparison.

## Phase 6 — Comparison table

| Candidate | Current/historical | Route ever mapped | Module layout | Fabricated data | Live React source | Matches current `CraftHub.jsx` content | Verdict |
|---|---|---|---|---|---|---|---|
| `src/pages/CraftHub.jsx` (current) | Current, only implementation on all 20 branches | `/crafthub` (active) | 5 cards + 2 banner tiles | None (removed this package) | Yes | — | **In use** |
| `CRAFT HUB EXPLAIND.png` | Historical, already rejected (`c3be8543`) | Never | N/A (different product — NOVEE OS/EEIE explainer) | Unknown | No | No | Rejected (prior audit) |
| `crafthub-landing.png` | Historical | `BootConsole.jsx` boot-stage only | N/A (boot animation) | No | Yes (as boot stage, not a route) | No | Not a `/crafthub` candidate |
| `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | Historical mockup | Considered for SmokeCraft E3 only, never `/crafthub` | 5 cards, same labels as current | No visible fabricated data in this variant | No | Yes — same content, different visual style (light/marble vs. current dark/photo-grid) | Design-source reference, not a route candidate |
| `Crafthub 360 landing page.png` | Historical mockup | Never mapped to any route | 5 cards + 2 banners + Venue Signals ticker | **Yes** — the exact fabricated metrics just removed from `CraftHub.jsx` | No | Yes — same content, current `CraftHub.jsx` was transcribed from this text | Confirms current implementation is faithful to source; fabricated-metrics removal was correct |
| `src_pages_crafthub.jsx_1.txt` / `_2.txt` (Stitch export) | Historical prototype scaffold | Never | 4 cards (missing Passport/Staff Handoff/DayOne360) | No | Yes, but unintegrated (`onNavigate` prop, no router/context wiring) | No — less complete than current | Rejected — less functional than current |

## Phase 7 — Outcome

**OUTCOME C — NO NEWER VERSION FOUND AFTER EXHAUSTIVE SEARCH**

- `src/pages/CraftHub.jsx` is confirmed byte-identical across all 3 local
  and 20 remote branches — there is no alternate source implementation
  anywhere in this repository's git history.
- Two additional full-screen visual candidates were found this pass beyond
  the prior audit's single candidate. Both were opened and visually
  inspected. Neither was ever approved or mapped for `/crafthub` in this
  project's own prior asset-classification documents — one is explicitly
  logged as a candidate for a *different* SmokeCraft screen (E3 Venue
  Selection), the other is unmapped to any route. Both confirm, rather than
  contradict, that the current `CraftHub.jsx` implementation faithfully
  transcribes this same design source's text/module list/button labels —
  including, until this correction, the same fabricated venue-signal
  metrics baked into the mockup.
- The fabricated-metrics removal performed in the prior package of this
  correction remains valid and correct regardless of this deeper search.
- **The requested "newer/current MVP2 CraftHub visual version" cannot be
  restored from anything in this repository, its git history, or its
  recovery archive** — restoring or redesigning `/crafthub` to match either
  newly-found mockup would require an explicit, separate user decision
  (since neither was ever approved for this route) plus, if the ornate
  navy/gold "ticker" composition (`Crafthub 360 landing page.png`) is the
  intended direction, a live-React rebuild of its dynamic zones (venue
  ticker, "Venue Signals" data) from a real data source — not a restoration
  of pre-existing code, since none exists.

## Superseded by a subsequent upload

This OUTCOME C conclusion was accurate at the time it was written — no
approved `/crafthub` visual existed anywhere in this repository's git
history at that point. Immediately after, a new, distinct image
(`public/assets/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`, SHA256
`ceb58ced...`, different from either candidate found in this audit) was
uploaded directly to `recovery/smokecraft-codex-final` by the repository
owner (commit `54d678da`, author `COACH1206`). This is a new, first-party
approval signal that did not exist during this search and could not have
been found by it. The implementation built from it is documented in
`docs/CRAFTHUB_MVP2_APPROVED_ASSET_IMPLEMENTATION.md`. This document's
search methodology and findings remain accurate and are preserved as-is —
they simply describe a state that has since changed.
