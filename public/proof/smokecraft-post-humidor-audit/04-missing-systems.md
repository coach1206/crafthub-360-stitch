# Missing Systems

1. **Real venue beverage/spirits/wine/cocktail catalog** — does not
   exist anywhere in this codebase (confirmed in both the Venue Humidor
   1B-2B-5 discovery audit and re-confirmed this pass). Pairing works
   only at the abstract-category level as a result. This was never
   claimed to exist, so it is a disclosed scope boundary, not a
   regression or hidden gap.
2. **Real payment gateway** — no live card/ACH processor anywhere in
   Venue Humidor or POS360.
3. **E.A.T. integration** — no system matching that name/acronym found
   anywhere in `server/services/` or `server/db/migrations/`. Cannot
   confirm or deny specific E.A.T. requirements beyond "not present in
   this repository."
4. **Production monitoring/alerting layer** — the data exists
   (append-only event ledgers) but no alerting service consumes it.
5. **Error-reporting provider activation** (Sentry/Datadog or
   equivalent) — referenced in the pre-existing post-investor backlog
   as not yet activated; still not activated.
6. **Customer receipt delivery via email/SMS** — only an in-app
   printable receipt exists for Venue Humidor.
7. **Real jurisdiction-based tax-rate configuration** — Venue Humidor
   checkout records a `tax_cents` field but no dedicated tax-
   configuration system was found in either Venue Humidor or POS360.

## Basis

Each item was searched for directly (grep across `server/services/`,
`server/db/migrations/`, and `package.json` dependencies) and
confirmed absent, not merely assumed absent.
