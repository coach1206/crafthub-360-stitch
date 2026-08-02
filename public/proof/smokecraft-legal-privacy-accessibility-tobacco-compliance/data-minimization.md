# Data Minimization Review

Confirmed against the real schema (grep across `server/db/migrations/*.sql`):
- **No full card details stored.** Payment tables (Package 2, migration 115) store Stripe payment-intent/charge references only; no PAN/CVV columns exist anywhere in the schema.
- **No government-ID image storage.** `age_verification_records` (this package) stores only method/result/declared birthdate/provider reference — no image/blob column.
- **No plaintext secrets.** Auth uses bcrypt-hashed PINs (`authService.hashPin`/`verifyPin`, reused from earlier phases); this package's `structuredLogger.mjs` actively redacts secret-shaped values from every log line (verified in Package 5 work, unchanged here).
- **No excessive location history.** `age_verification_records.ip_hash` is a salted hash column, never raw IP; no location/geolocation table was added by this package.
- **No unrelated demographic data.** `age_verification_records` collects only what's needed for the age-eligibility decision (declared birthdate OR boolean attestation) — no race/gender/income/etc. fields exist.
