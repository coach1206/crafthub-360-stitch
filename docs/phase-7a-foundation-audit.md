# Phase 7A — Foundation Audit

Phase 7A is foundation-only: design tokens, premium CSS primitives, reusable
premium components, and the audits below. No live screen (NOVEE login,
Passport dashboard, SmokeCraft dashboard) is redesigned in this phase —
that work is scoped to Phase 7B.

## 1. Design tokens & CSS foundation (done)

- `tailwind.config.js` — added `passport-*` and `novee-*` color tokens,
  additive only, inserted after the existing `accent-blue*` block.
- `src/styles.css` — added a `premium-passport-*` / `premium-novee-*` /
  `premium-smokecraft-*` / `premium-*` component layer at the end of the
  file. None of these touch or override any existing selector.
- `src/components/premium/PremiumPanel.jsx` — new, generic, theme-aware
  components (`PremiumPanel`, `PremiumShell`, `PremiumSidebar`,
  `PremiumGoldRule`, `PremiumDivider`, `PremiumPill`, `PremiumButton`).
  Not imported by any live screen yet.

## 2. Visual audit

Comparison of current live screens against the reference pack (6 images
already in `public/design-references/phase-7/`, plus 11 images supplied
inline in chat and described below since they cannot be saved as files in
this environment).

| Live screen | Current state | Reference direction | Gap |
|---|---|---|---|
| `AdminLogin.jsx` (NOVEE manager/admin PIN screen) | Inline-styled dark cigar-lounge palette (`GOLD #C9A84C`, `DARK #060402`), `PinPad` component, no sidebar/status chrome | Two reference variants: warm gold cigar-lounge PIN pad with crest, and a cooler navy/cyberpunk variant with system-status sidebar + fingerprint auth | Current screen is closer to the warm variant already; missing system-status sidebar, encryption/security badges, biometric-style CTA |
| Passport dashboard (`PassportHome.jsx`, `PassportConnection.jsx`, `PassportConnections.jsx`) | Mixed inline styles, green/gold accents, no unified navy-leather shell | Reference: navy leather sidebar, ivory passport-paper content cards, gold trim, journey progress bar (Scan In → Build Profile → Meet People → Earn Stamps), 5-tier passport color system | No leather-shell chrome, no unified journey progress bar, tier color system not reflected in UI |
| SmokeCraft dashboard (`SmokeCraft.jsx`, `Leaderboard.jsx`, `GoldenBox.jsx`) | Black/gold gamified elements exist (Golden Box CTA, leaderboard) | Reference: black/gold gamified leaderboard with rank/XP, E.A.T. intelligence strip (lounge temp/humidity/humidor count), mentor-selection CTA | Core gamification exists; missing the E.A.T. live-data strip on the dashboard |
| `Enroll.jsx` (SmokeCraft intake) | Existing multi-step enrollment form | Reference: "Private Identity" / "Lounge Persona" / "Smoke Preference DNA" sectioned ritual form with portrait upload, flavor pills | Section framing/copy is more ritual-themed in reference; current form is functional but plainer |
| `SeedSoil.jsx`, `HumidorMatch.jsx` | Functional pairing/match screens exist | Reference: growing-region cards, "Soil: Tonight's Setting" multi-category selector, match-score breakdown table, three recommendation cards | Broadly aligned in purpose; reference adds more granular scoring/breakdown UI |
| `CraftHub.jsx` | Module grid exists | Reference: "Every system, one command hub" — 8-card ecosystem grid (CraftHub 360, SmokeCraft 360, PourCraft 360, WineCraft 360, BeerCraft 360, 360 Passport Connections, POS 3 [Staff], E.A.T. Hub [Staff]) with explicit staff-access labeling on staff modules | Current grid does not visually distinguish staff-only modules; reference marks them clearly |
| NOVEE OS command screens (`Home.jsx` / `ultra-command-center` placeholder) | Placeholder/early-stage | Reference: dark navy grid investor-deck styling, sense→analyze→adapt→optimize cycle, use-case grid | Out of scope for 7A (no redesign); flagged for 7B/later command-center work |

No code changes were made to any of the rows above — this table is the
audit output only, per "do not fully redesign one screen yet."

## 3. Guest / staff visibility audit

Reviewed every route in `src/App.jsx`. All staff/manager/admin/founder/
developer/mentor-only screens are wrapped in `ProtectedRoute` with either
`allowedRoles` or `requiredPermission`, and all are `demoBlocked` except
the two explicitly intended to remain visible in demo mode
(`venue-demo`, `pilot-onboarding`... values reviewed individually):

- `/novee-home`, `/ultra-command-center`, `/novee-vault`,
  `/remote-software-control`, `/admin`, `/founder`, `/founder-demo`,
  `/investor-demo` — admin/founder/developer gated, `demoBlocked`.
- `/venue-mirror`, `/kiosk-setup`, `/install-help`, `/venue-test`,
  `/venue-demo`, `/pilot-onboarding`, `/system-overview` — manager+ gated,
  `demoBlocked`.
- `/pos`, `/pos/table/:tableId`, `/pos3/*` — `access_pos3_staff`
  permission gated, `demoBlocked`.
- `/eat`, `/eat-legacy`, `/eat/*` — `access_eat_command` permission gated,
  `demoBlocked`.
- `/mentor-console` — `access_mentor_console` permission gated.
- `/dev-diagnostics` — `view_diagnostics` permission gated, `demoBlocked`.
- `/device-status` — staff+ gated, `demoBlocked`.

Guest-accessible routes (`/smokecraft/*`, `/passport/*`, `/crafthub`,
`/home`, `/signin`, `/dayone360*`, `/leaderboard`, `/pourcraft`,
`/beercraft`, `/winecraft`) contain no staff-only imports or components.
No staff panel (`SyncStatusPanel`, `SyncConflictReviewPanel`,
`SyncAuditTimelinePanel`, POS3/EAT pages, Admin/Founder/Mentor consoles)
is imported by any guest-route page module.

**Result: no staff/admin panel leaks into a guest route.** No changes
required.

## 4. Button functionality audit

Scanned every `<button>` element across `src/pages/smokecraft/*.jsx`,
`src/pages/passport/*.jsx`, and `src/pages/PassportConnection.jsx` for
missing click/touch/navigation handlers. Most flagged candidates turned
out to have `onClick`/`onTouchEnd` handlers elsewhere in the same JSX
block (false positives from a naive scan) and are functional. The
following pre-existing buttons have **no attached handler** and are
decorative-only as of this audit:

| Location | Button | Notes |
|---|---|---|
| `src/pages/smokecraft/Blend.jsx:270` | "+" add-blend-component swatch | No `onClick`; visually a slot-add affordance |
| `src/pages/smokecraft/Blend.jsx:335` | "add_circle" blend slot | No `onClick` |
| `src/pages/smokecraft/Available.jsx:235` | wine-pairing icon button | No `onClick` |
| `src/pages/smokecraft/FlavorDNA.jsx:179` | "Grand Lounge" badge button | No `onClick`/navigation; looks like a link to `/leaderboard` but isn't wired |
| `src/pages/smokecraft/Art.jsx:68` | cigar-anatomy zone row | No `onClick`; `active` state appears intended to be settable by row selection but isn't wired |
| `src/pages/passport/PassportDirectory.jsx:216` | "View Profile" / "Save" / "Intro" / "Connect" member-card actions | Touch-scale animation only, no `onClick`/navigation |

`src/pages/passport/PassportEvents.jsx:93` ("SOLD OUT") is intentionally
`disabled` and is not a functionality gap.

These are pre-existing gaps, not introduced in Phase 7A. Per the
foundation-only scope, they are **documented here, not fixed**, since
wiring them correctly requires understanding each screen's intended
behavior — that belongs to the Phase 7B screen-level redesign of
SmokeCraft / Passport / Passport Connections (Blend.jsx, Available.jsx,
FlavorDNA.jsx, Art.jsx are SmokeCraft; PassportDirectory.jsx is in the
7B Passport scope). No new decorative-only buttons were introduced by
any Phase 7A change.

## 5. Light staff-panel polish

Reviewed `SyncStatusPanel.jsx`, `SyncConflictReviewPanel.jsx`, and
`SyncAuditTimelinePanel.jsx` (Phase 6 staff sync panels) for safe,
additive-only premium polish using the new `premium-*` tokens/classes.
Skipped for this phase: these panels carry live Phase 6 sync/reconciliation
state and styling hooks (status colors keyed to conflict/retry state)
that are easy to visually regress without screen-specific review, and the
user's instruction was "if safe" — given there is no Phase 7A requirement
to touch them and risk of subtle Phase 6 regression outweighs cosmetic
benefit at the foundation stage, no changes were made. Revisit once a
specific screen-level pass is scoped (Phase 7B or later).
