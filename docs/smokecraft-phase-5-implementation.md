# SmokeCraft Phase 5 — Gold Box Rules

## Coverage note: how Phase 5 connects to the rest of the protocol

- **Phase 0 (Entry Gate)** — unaffected; Phase 5 is reached only after entry gate completion, no changes here.
- **Phase 1 (Profile Capture)** — the new Age & Venue Compliance rule text references `session.profile`'s age confirmation captured at enrollment, rather than inventing a new age-check field.
- **Phase 2 (Cigar Education)** — unaffected.
- **Phase 3 (Seed & Soil)** — unaffected.
- **Phase 4 (Mentor Selection)** — unaffected; the existing journey map step linking to Mentor selection is untouched.
- **Phase 6 (Humidor Match)** — Start Session still navigates to `/smokecraft/humidor-match`, exactly as before.
- **Phase 7–10 (Cut/Toast/Light, Thirds)** — unaffected; the "Completed Session" rule text describes these steps honestly without changing their implementation.
- **Phase 11 (Scorecard/Ranking/Badges)** — `smokecraftScoring.js`'s `categoryGoldBoxRulesAccepted()` (50 pts) and `badgeGoldBoxFinisher()` both read `session.smokeCraft.goldenBox.accepted` directly; this field is **left untouched** by Phase 5's changes, so existing scoring/badge behavior is unaffected. The new "View Scoring" panel displays the real `SCORE_CATEGORIES`/`MAX_TOTAL_SCORE` from this same module.
- **Phase 12 (Passport Stamp)** — unaffected; no Phase 5 fields are consumed there yet.
- **Phase 13 (Passport Connections)** — unaffected.

## What was added

- `src/utils/smokecraftGoldBoxRules.js` — new pure rules-content module: `SCORING_OVERVIEW`, `BADGE_OVERVIEW`, `PASSPORT_STAMP_OVERVIEW`, `COMPLETED_SESSION_DEFINITION`, `EVENT_CHALLENGE_RULES`, `LOUNGE_ETIQUETTE_RULES`, `NO_FAKE_SCORING_RULE`, `AGE_COMPLIANCE_RULE`, `VENUE_COMPLIANCE_RULE`, `PURCHASE_RULES`, `BACKEND_PENDING_NOTE`, and `GOLD_BOX_RULE_VERSION`. The scoring/badge content is derived from the real `SCORE_CATEGORIES`/`MAX_TOTAL_SCORE` exported by `smokecraftScoring.js`, not invented.
- `src/pages/smokecraft/GoldenBox.jsx` — added a rulebook section (No Fake Scoring, Age & Venue Compliance, Lounge Etiquette, Event Challenge Rules, Purchase & POS Rules, Completed-Session definition, Backend/POS status), a collapsible "View Scoring & Badges" panel, and replaced the single "Accept the Challenge" button with three distinct actions: **Accept Rules**, **View Scoring**, **Start Session**.
- `src/context/GuestSessionContext.jsx` — `setGoldenBoxAccepted()` now additionally records `session.smokeCraft.goldBoxRules.{goldBoxAccepted, goldBoxAcceptedAt, goldBoxRuleVersion}` alongside the pre-existing, unmodified `session.smokeCraft.goldenBox.{accepted, acceptedAt}`. Two new setters: `setGoldBoxViewedScoring()` (sets `goldBoxRules.goldBoxViewedScoring`) and `setGoldBoxSessionStarted()` (sets `goldBoxRules.goldBoxSessionStartedAt`).
- `docs/smokecraft-protocol-audit.md` — Phase 5 section rewritten from "Partial" to "Strengthened".

## Accept Rules / View Scoring / Start Session behavior

- **Accept Rules** — disabled once clicked (idempotent). Awards 25 XP + "Golden Invitation" badge, calls `completeStep('golden-box')`, and records acceptance (both the pre-existing `goldenBox.accepted` field and the new `goldBoxRules.goldBoxAccepted`/`goldBoxAcceptedAt`/`goldBoxRuleVersion` fields). Shows an "Accepted [time]" confirmation once done.
- **View Scoring** — toggles an expandable panel listing every real scoring category and its point value (sourced from `smokecraftScoring.js`), the running max total score, a badge overview, and a Passport Stamp overview. Records `goldBoxRules.goldBoxViewedScoring = true` on open. No gating — can be opened any time.
- **Start Session** — visually disabled (greyed, `cursor: not-allowed`) until rules are accepted. If clicked before acceptance, shows the exact required message: **"Accept the Gold Box Rules before starting your session."** Once rules are accepted, clicking it records `goldBoxRules.goldBoxSessionStartedAt` and navigates to `/smokecraft/humidor-match`, exactly where the prior single-button flow used to go.

## State persistence

```js
session.smokeCraft.goldBoxRules = {
  goldBoxAccepted: true,
  goldBoxAcceptedAt: <timestamp>,
  goldBoxViewedScoring: true,
  goldBoxSessionStartedAt: <timestamp>,
  goldBoxRuleVersion: '1.0',
}
```

This is purely additive — `session.smokeCraft.goldenBox.accepted`/`acceptedAt` (read by Phase 11's `categoryGoldBoxRulesAccepted()` and `badgeGoldBoxFinisher()`) is left in place and unmodified, so existing scoring/badge wiring for Gold Box continues to work without any change to `smokecraftScoring.js`.

## Demo Mode safety

All new state lives in local guest session state only (`useGuestSession`/`update()`), the same in-memory/localStorage-backed session used throughout SmokeCraft. No backend write occurs. The Age & Venue Compliance rule text explicitly states this app does not perform legal age verification or enforce venue rules — it only records the guest's profile-time confirmation for session purposes. POS3 and E.A.T. are not called anywhere in this change.

## Backend/POS pending status

The rulebook's "Backend & POS Status" card states plainly: Accept Rules / View Scoring / Start Session are recorded locally only; cross-device sync, staff notifications, and POS ticket creation referenced in the Purchase & POS Rules are Backend Pending. No payment is processed and no order is finalized from Phase 5.

## Scope

No POS3, E.A.T., CraftHub, Admin, or Founder system code was modified. `GoldenBoxStatus.jsx` (the separate XP-tier reward-box claim screen at `/smokecraft/golden-box/status`) is a distinct feature not named in the audit's Phase 5 Route/File line and was left untouched.
