# 04 — Required Interaction Proof / No-Stamp-Before-Completion Proof

## Explicit claim interaction

The previous silent auto-claim `useEffect` (`if (isEligible && claimStatus === 'idle') handleClaimStamp()`) has been removed entirely. `PassportStamp.jsx` now renders a real, focusable `<button aria-label="Claim Your Stamp" onClick={handleClaimStamp} disabled={!isEligible || claimStatus === 'claiming'}>`. The stamp is claimed only in response to a real player click (or keyboard Enter on the focused button — see doc 11).

## Stamp not awarded early

- API suite test 4/5/6: a fresh guest (zero real prerequisite completions) — `eligibility.eligible === false`, `POST /claim` → 422, `GET /status/:anything` → `claimed: false, stamp: null`.
- Browser suite: "A claim attempt while genuinely incomplete is denied server-side even bypassing the disabled UI button" — a direct `fetch()` to `/claim` while ineligible still returns 422 even though the browser UI never allows the click.

## Draft/partial-save concept — N/A

Session 23 has no draft/partial-save form (unlike Sessions 3/4/15/19, which persist multi-field checkpoint/rating drafts). The required interaction here is a single explicit claim action. This is explicitly noted (not silently skipped) in the browser suite: "N/A: Session 23 (passport-stamp) has no draft/partial-save form — the required interaction is a single explicit claim click, not a multi-field draft."
