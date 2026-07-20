# CraftHub MVP2 — Approved Version Audit

## Search performed

Searched: `public/assets/`, `public/assets/crafthub*`, `attached_assets/`,
`src/assets/`, `src/pages/`, `src/components/`, `public/proof/`, `docs/`,
full `git log --oneline --all -i --grep="crafthub"` (40+ matches reviewed),
`git log --oneline --follow -- src/pages/CraftHub.jsx` (full file history),
and `docs/mvp2-visual-image-registry.md` (existing asset-mapping registry
for this exact question).

## Finding: no separate approved/current MVP2 CraftHub implementation exists

A prior audit in this repository already answered this exact question.
Commit `c3be8543` ("Document CraftHub no-usable-reference audit finding")
updated `docs/mvp2-visual-image-registry.md` with this explicit conclusion:

> `none usable | /crafthub | src/pages/CraftHub.jsx | ... | blocked — no
> usable full-page reference yet. CRAFT HUB EXPLAIND.png was inspected and
> rejected 2026-06-27: it is a NOVEE OS / EEIE marketing explainer
> (mood/energy dashboard, EEIE feature list), not the actual CraftHub.jsx
> tile-grid venue hub UI. crafthub-landing.png remains assigned to the
> BootConsole.jsx "crafthub" boot-stage asset ... and must not be reused for
> /crafthub.`

Both image candidates that exist in the repository under a "CraftHub" name
were independently investigated and explicitly rejected as usable
references for the `/crafthub` route:

| Candidate | Path | Verdict |
|---|---|---|
| `CRAFT HUB EXPLAIND.png` | attached assets | Rejected — different product (NOVEE OS/EEIE marketing explainer), not the CraftHub.jsx tile-grid UI |
| `crafthub-landing.png` | `public/design-references/mvp2/crafthub/` | Assigned to `BootConsole.jsx` boot-stage animation only — explicitly flagged "must not be reused for /crafthub" |

## `src/pages/crafthub/CraftHubDashboard.jsx` and `CraftHubOnboardingWizard.jsx`

Investigated as possible candidates (more recently committed, Jul 5, vs.
`CraftHub.jsx`'s Jun 22). Confirmed **not** candidates: both are routed at
`/crafthub/dashboard` and `/crafthub/onboarding` (distinct routes, unrelated
to `/crafthub` itself) and are internal **NOVEE OS platform-governance**
tools (tabs: Feature Flags, API Keys, Audit, Platform Health, Tenant
Governance) — an admin/founder surface, not the guest-facing venue launcher
this task concerns. Confirmed via file content: `MODULES` array models
platform module registry entries like `novee_os_tenant_governance`,
`novee_os_billing_governance`, not the guest CraftHub tile grid.

## Conclusion

`src/pages/CraftHub.jsx` **is** the current, and only, approved MVP2
CraftHub implementation for `/crafthub`. Git history confirms it is also the
most recently modified version of this exact route (`d623fd61`, "CraftHub
shell: replace fake WineCraft/PourCraft/BeerCraft content with honest Coming
Soon" — the newest commit touching this file). There is no historical,
approved, or in-progress replacement to restore.

## Actual defect found (evidence-based, not the "old version" framing)

`CraftHub.jsx` contained a hardcoded `SIGNALS` array rendered as a "Venue
Signals" grid:

```js
const SIGNALS = [
  { label: "Active Tables", value: "12" },
  { label: "Staff Handoffs", value: "3" },
  { label: "POS / Inventory", value: "Nominal" },
  { label: "E.A.T. Alerts", value: "1" },
  { label: "Kitchen", value: "On Track" },
  { label: "Bar", value: "Stocked" },
  { label: "Humidor", value: "62°F / 70%" },
  { label: "Events", value: "2 Tonight" },
]
```

Every value is a hardcoded literal with no backing data source anywhere in
the component (no `useEffect`, no API call, no context read touches this
array). This is a direct violation of this task's own explicit rules ("No
fabricated metrics," "No fake venue signals," "No fake activity values,"
"Remove fabricated operational metrics") — independent of whether the
surrounding page composition is "old" or "current." See
`docs/CRAFTHUB_MVP2_RESTORATION_REPORT.md` for the fix.

## Confidence level

High. This conclusion rests on a prior, dedicated, same-repository audit
that already searched the same locations for the same purpose and reached
an explicit written verdict, cross-checked in this pass against full git
history and the two only other CraftHub-named page components in the
codebase.
