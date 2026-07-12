# SmokeCraft Data Privacy Guide

**Version:** MVP2 · **Audience:** Platform administrators, legal, and compliance

---

## Data Collected

SmokeCraft collects the following data from guests:

| Data Type | Storage | Retention | Notes |
|-----------|---------|-----------|-------|
| Session progress (which sessions completed) | localStorage (device) | Until browser cleared | Not synced to server in MVP2 |
| Flavor profile selections (tasting notes) | localStorage (device) | Until browser cleared | Not transmitted in MVP2 |
| Scorecard answers | Server database | Per venue retention policy | Linked to anonymous session ID |
| Leaderboard score / XP | Server database | Per venue retention policy | May be linked to Passport member ID |
| Passport stamps | Server database | Permanent (per membership) | Linked to Passport member ID |
| Purchase requests | Server database | Per venue retention policy | No payment data stored |

## Data NOT Collected

SmokeCraft does NOT collect:
- Names, email addresses, or phone numbers (unless explicitly provided by guest via Passport enrollment, which is separate)
- Payment card data (POS360 handles payment; SmokeCraft stores only the request)
- Biometric or health data
- Device identifiers beyond session-scoped storage

## Error Log Privacy

The structured error logger (R19) applies PII scrubbing at both the frontend (before transmission) and server (on receipt). The following fields are always redacted in logs:
- `name`, `email`, `phone`, `password`, `token`, `jwt`, `authorization`
- `card`, `cvv`, `ssn`, `dob`, `address`
- `passportMemberId`, `userId`, `memberId`

These fields are replaced with `[REDACTED]`. The scrubbing is applied in `smokecraftErrorLogger.js` (client) and `smokecraftErrorLogRoutes.js` (server).

## Data Minimization

- Logs contain only structural context: route, role, error code, contract name.
- No full request bodies are logged.
- Stack traces are trimmed to 8 lines.
- Log entries are retained in-memory only (last 500 entries). No disk persistence in MVP2.

## Passport Member Data

Passport member IDs are sidecar-role data. When a guest authenticates as a `passport_member`, their member ID is used to link stamps and XP. This ID is never logged by the error logger (it is in the redaction list). It is stored in the database per the Passport module's data model.

## Third-Party Data Sharing

- **POS360:** Receives only the item requested and the table/session identifier. No guest profile data is sent to POS360.
- **E.A.T.:** Receives aggregated session statistics. No individual guest data is transmitted.
- **Humidor Monitor:** A device-to-venue pairing only. No guest data is transmitted to the humidor device.

## Guest Rights

Guests may request deletion of their data by contacting the venue. The venue administrator can delete a guest's scorecard and leaderboard records via the Admin panel. localStorage data is under the guest's control and can be cleared by the guest at any time.

## Retention Policy

Default retention for server-stored SmokeCraft data: 12 months from last activity, or per the venue's data retention agreement with NOVEE OS, whichever is shorter.
