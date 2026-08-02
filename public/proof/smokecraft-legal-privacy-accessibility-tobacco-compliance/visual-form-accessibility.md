# Visual / Form Accessibility

No new visual screens were built in this pass (see `accessibility-standard.md`), so no visual-regression or contrast testing against new UI was performed or claimed. The carried-forward mobile/tablet letterboxing and Golden Box Rules text overlap (pre-existing, noted in the mandate) were NOT touched — per the mandate's explicit instruction to repair only if a screen built in this pass has the issue, and no new visual screen was built, this defect is correctly left untouched and undisclosed as "fixed."

Form-accessibility design for the (not-yet-built) age-gate/consent/data-rights forms: every corresponding API field (`subjectType`, `subjectId`, `jurisdictionCode`, `declaredBirthdate`, etc.) returns a specific validation error when missing (`400`, named field list), which is the backend half of accessible field-level error messaging.
