# 02 — Shared Component Architecture

## What was added this pass

- **`src/utils/haptics.js`** (existing, extended, not replaced) — `triggerHaptic()` remains the one canonical haptic call every SmokeCraft screen already uses (51 files, unchanged call signature). It now additionally respects `prefers-reduced-motion` and the account-level `hapticsEnabled` preference already persisted on `GuestSessionContext` (`novee_guest_session.preferences.hapticsEnabled`), read directly from `localStorage` since `triggerHaptic` is called from plain event handlers throughout the codebase, not only inside React components with hook access.
- **`src/components/smokecraft/SmokeCraftTactileCard.jsx`** (new) — one shared, reusable selectable-card primitive supporting every state the mandate requires (pointer-down/up/cancel, click, keyboard Enter/Space, visible focus, pressed state, selected state, disabled state, loading state, optional haptic, accessible role/label, 72×72px minimum touch target). Available for future screens and future incremental retrofits of existing ones.

## Why existing per-screen implementations were not ripped out and replaced

The interaction audit (`01-INTERACTION-AUDIT.md`) found most of the 27 session screens already implement real, working, previously-tested selectable interactions (`role="tab"`/`aria-selected` patterns, `aria-pressed` buttons) built across several prior completion passes in this operation. Retrofitting all of them onto a brand-new shared component in a single pass would mean rewriting ~15 already-functional, already-regression-tested screens — a large blast radius for a purely internal-consistency improvement, with real risk of introducing a regression the existing dedicated suites (Phase 9, Golden Box, etc.) would then have to re-catch. Per this operation's established "smallest safe fix" principle, the shared component is introduced as real, working, adoptable infrastructure rather than forced onto working code within this pass's time budget.

## Recommendation for a follow-up pass

A dedicated, narrowly-scoped follow-up pass should: (1) retrofit the 5 disclosed low-interactivity screens (Welcome, Lighting Tutorial, Mentor Commentary, AI Summary, Pairing Recommendations) with real `SmokeCraftTactileCard`-based educational hotspots, and (2) incrementally migrate existing `aria-pressed`/`role="tab"` screens to the shared component where doing so provides genuine value (consistency, less duplicated CSS) without regressing tested behavior.
