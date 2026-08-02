# Consent Preference Center

**Route:** `/smokecraft/compliance/consent`
**File:** `src/pages/smokecraft/compliance/ConsentCenter.jsx`

## Real backend wiring

- `GET /api/compliance/whoami` for identity, then
  `GET /api/compliance/consent?subjectType=&subjectId=` to load current
  state.
- `POST /api/compliance/consent` — `{subjectType, subjectId, preferences,
  analytics, marketing, consentVersion}`.
- `POST /api/compliance/consent/withdraw` — real, always-available,
  first-class withdrawal action (not buried), sets a fresh
  `consent_records` row with all nonessential categories `false` and
  `source: 'withdrawal'`.

## No dark patterns

"Strictly necessary" is shown checked and disabled with an explanation
(`t.necessary`), never toggleable. Preferences/analytics/marketing
checkboxes render **unchecked by default** on first load (state
initializes `false`; only set `true` if the server's existing consent
record says so) — matches the server's own non-preselection rule
(`complianceController.setConsent`: `preferences === true` explicit
check, never defaults nonessential fields to `true`).

## Verified server-side (unchanged Package 6 core + this pass's regression)

```
── 11. Consent grant / withdrawal ──
  PASS  Consent can be granted with explicit, non-preselected categories
  PASS  Current consent read reflects the grant
  PASS  Consent withdrawal succeeds
  PASS  Withdrawal is reflected as the current consent state
```

## Accessibility

Each category is a `<label>`-associated checkbox with `minHeight: 44`,
save/withdraw actions are real `<button type="button">` elements (no
`div onclick`), save confirmation uses `role="status"`, and errors use
`role="alert"`. No marketing-automation system is activated anywhere in
this code path — `marketing` is stored only, never wired to any
send/campaign trigger.
