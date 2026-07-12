# SmokeCraft Troubleshooting Guide

**Version:** MVP2 · **Audience:** Staff, managers, and platform administrators

---

## Guest Cannot Advance Past a Session

**Symptom:** Guest taps the primary action button but nothing happens; the button is dimmed.

**Cause:** A required gate is not satisfied:
- **Golden Box:** Guest must tap the checkbox to acknowledge the reveal.
- **First Third / Second Third:** Guest must select at least one tasting note before the Continue button becomes active.
- **Scorecard:** All scoring fields must be completed.

**Fix:** Ask the guest to review the screen for an unchecked requirement and complete it.

---

## "Session Locked" Screen Appears

**Symptom:** Guest sees a lock screen when navigating to a session.

**Cause:** The guest has not completed the prerequisite session or visit.

**Fix:**
- If the guest has completed the prerequisite but still sees a lock, have them refresh the page. Progress is stored in localStorage.
- If the issue persists, check if they are on a different device. Session progress is device-local in MVP2.

---

## Leaderboard Shows Stale Data

**Symptom:** A guest completed their session but does not appear on the leaderboard.

**Cause:** Leaderboard updates may be delayed by up to 60 seconds.

**Fix:** Wait 60 seconds and refresh the leaderboard. If the guest still does not appear, check the error log for a `contract_rejected` or `api_error` entry related to leaderboard submission.

---

## Integration Status Shows "Not configured"

**Symptom:** POS360, E.A.T., or Humidor shows "Not configured" in the admin panel.

**Cause:** The integration has not been set up with credentials.

**Fix:** See the Integration Configuration Guide (doc 06) for setup steps.

---

## Error Log Shows `contract_rejected`

**Symptom:** Error log entries with category `contract_rejected`.

**Cause:** A data payload sent to or from SmokeCraft failed contract validation. Common causes:
- Missing required fields in a guest session payload
- Unexpected null values from an integration response

**Fix:**
1. Note the `contractName` and `field` from the log entry.
2. Check the integration sending that data type.
3. If this is a guest session field, check the SmokeCraft screen that populates it for missing state.

---

## Demo Mode Does Not Reset

**Symptom:** After tapping "Reset Demo", demo session data still appears.

**Cause:** The reset only clears demo-mode sessions. If a real guest session was started before demo mode was enabled, real data is not affected.

**Fix:** Confirm the session was started in demo mode (session storage key `novee_demo_mode=1`). If it was a real session, the data is intentionally preserved.

---

## Rate Limit Errors (429)

**Symptom:** Error log shows `rate_limit` category entries; API calls fail with 429.

**Cause:** A client is sending too many requests. General limit: 300 per 15 minutes. Auth limit: 20 per 15 minutes.

**Fix:**
- For a single guest device: unlikely to hit rate limits under normal use. Check for a runaway retry loop in the browser console.
- For a shared venue device: rate limits apply per IP. Check if multiple guests are sharing the same network egress IP.
- In development: rate limiting is disabled (`NODE_ENV !== 'production'`).

---

## Passports Stamps Not Appearing

**Symptom:** Guest completed a visit but no stamp appears in their passport.

**Cause:** Passport stamps require the Passport module to be enabled (`smokecraft.passport.enabled = true`).

**Fix:** Check the feature flag admin panel. If the flag is disabled, enable it (requires admin or founder role) and ask the guest to complete the session again or manually award the stamp via the admin panel.
