# 19 — Handoff Contents Index

## Markdown files

| File | Contents |
|---|---|
| `00-READ-ME-FIRST.md` | Orientation, real-vs-aspirational maturity table |
| `01-EXECUTIVE-PRODUCT-OVERVIEW.md` | The four systems, product framing, brand tone |
| `02-PLATFORM-RESPONSIBILITY-MAP.md` | Which system owns which concern |
| `03-USER-ROLES-AND-RBAC.md` | Route-level roles + POS360 job-role matrix + Venue Humidor RBAC |
| `04-END-TO-END-CUSTOMER-STAFF-MANAGER-JOURNEY.md` | Full 5-stage journey, proven vs. unverified |
| `05-CUSTOMER-TO-POS360-HANDOFF.md` | Handoff service, manual fallback, recommended UX contract |
| `06-SCREEN-DISSOLVE-AND-TRACKING-STANDARD.md` | RippleDissolveTransition — what's real, what's a gap |
| `07-SMOKECRAFT-SCREEN-INVENTORY.md` | 75+ customer screens |
| `08-POS360-SCREEN-INVENTORY.md` | 24+ staff screens |
| `09-EAT360-SCREEN-INVENTORY.md` | 15 management screens + unbuilt stub surfaces |
| `10-COMPLETE-ROUTE-INVENTORY.md` | Consolidated route index across all systems |
| `11-ORDER-PAYMENT-FULFILLMENT-STATE-MODELS.md` | State vocabularies, proven vs. preview-tier |
| `12-INVENTORY-AUTHORITY-MODEL.md` | RBAC + the unresolved POS360/Venue Humidor inventory question |
| `13-DESIGN-SYSTEM.md` | Real design tokens from `tailwind.config.js` + `CommandAppShell.jsx` |
| `14-RESPONSIVE-AND-ACCESSIBILITY.md` | Proven behavior + real disclosed defects |
| `15-ERROR-RECOVERY-AND-EXCEPTION-STATES.md` | Honest-degradation pattern, real exception states |
| `16-INVESTOR-DEMO-PATH.md` | Reused proven demo path (SmokeCraft/Golden Box only) |
| `17-KNOWN-LIMITATIONS-AND-ACTIVE-PRODUCTION-WORK.md` | Full defect/limitation list incl. SC-D068/SC-D068b |
| `18-UIUX-DEVELOPER-IMPLEMENTATION-CHECKLIST.md` | Actionable checklist by system |
| `19-HANDOFF-CONTENTS-INDEX.md` | This file |

## Diagrams (`diagrams/`)

`customer-journey.md`, `customer-to-pos360-handoff.md`,
`pos360-to-eat-escalation.md`, `customer-status-updates.md`,
`inventory-lifecycle.md`, `payment-lifecycle.md`,
`fulfillment-lifecycle.md`, `table-tab-transfer.md`,
`passport-rewards-update.md`, `staff-manager-permissions.md`.

## Screenshots (`screenshots/`)

- `screenshots/smokecraft/` — 68 real PNGs pulled from
  `public/proof/smokecraft-holistic-fix-3/screenshots/` and
  `public/proof/smokecraft-final-gameplay-acceptance/screenshots/desktop/`.
  Covers welcome, enrollment, venue-select, intake, entry, profile,
  education, mentors, humidor, light, complete, Golden Box (build,
  status, competitions, competition detail, entry blend workspace,
  results, judge dashboard/review, mentor review, packaging studio +
  editor + versions + share + review, gold-box redirect), Venue Humidor
  (browse, checkout, order detail, cigar detail, admin dashboard, admin
  new product, admin inventory events, admin media, admin cigar edit,
  admin orders history, admin payments, admin handoff, admin order
  detail), plus the investor-demo desktop set (welcome, venue-select,
  mentor-selection, humidor-match, first-third, scorecard, rewards,
  passport, skill-tree, leaderboard, golden-box build/competitions/
  results, session-complete, session-complete-after-reload,
  rewards-live-data-check).
- `screenshots/venue-humidor/` — 5 real PNGs from the dedicated Media
  Management proof pass (empty state, uploaded, approved+primary,
  tablet landscape, handheld portrait).
- `screenshots/pos360/` and `screenshots/eat360/` — **intentionally
  empty except for a NOTE file**: no screenshot proof exists anywhere in
  `public/proof/` for POS360 or E.A.T. 360. This is stated honestly
  rather than fabricated.

## Reference material used but not copied wholesale

- `public/proof/smokecraft-final-gameplay-acceptance/*.md`
- `public/proof/smokecraft-venue-humidor-media-management/*.md`
- `public/proof/smokecraft-full-game-fresh-player-closure/*.md`
- `src/App.jsx`, `src/modules/pos360Permissions.js`,
  `src/components/transitions/RippleDissolveTransition.jsx`,
  `src/pages/staff/StaffPinScreen.jsx`,
  `src/components/staff/ManualPOS360HandoffPanel.jsx`,
  `src/components/staff/StaffStatusBadge.jsx`,
  `src/services/smokecraftHandoffService.js`,
  `src/components/pos3/shell/CommandAppShell.jsx`,
  `tailwind.config.js`

## Production Package 6 Correction addition

`20-COMPLIANCE-UI-PRODUCTION-PACKAGE-6-CORRECTION.md` — customer age-gate,
Terms/Privacy/warning acceptance, consent preference center, data-rights
requests, staff age-verification, and compliance-administration screens,
plus the real server-side checkout eligibility enforcement they connect
to (see `public/proof/smokecraft-legal-privacy-accessibility-tobacco-compliance/`
docs 34-44 for full proof).

## Shareable package

`public/handoff/SmokeCraft-POS360-EAT360-UIUX-Handoff.zip` — a zipped
copy of this entire `docs/ui-ux-handoff/smokecraft-pos360-eat360/`
directory, verified with `unzip -t` after creation.
