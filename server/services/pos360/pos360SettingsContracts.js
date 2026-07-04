// pos360SettingsContracts.js — Phase B.14 Prompt AA
// POS360 System Settings, Venue Configuration & Admin Console contracts.

export const VENUE_TYPES = ['restaurant','lounge','cigar_lounge','bar','club','hotel','event_space','hybrid','other']
export const MEASUREMENT_UNITS = ['imperial','metric','mixed']

export const OPERATING_RULE_GROUPS = ['orders','payments','tips','reservations','tables','private_events','loyalty','inventory','staff','reports','eat','smokecraft','custom']

export const FINANCIAL_POLICY_GROUPS = ['tax','service_charge','gratuity','refunds','voids','comps','house_account','deposits','minimum_spend','accounting','custom']

export const COMPLIANCE_GROUPS = ['privacy','pii','financial_data','audit_retention','consent','exports','accessibility','regional','custom']

export const WHITE_LABEL_STATUSES = ['draft','configured_placeholder','active_placeholder','deployed_external','disabled']

export const CUSTOM_DOMAIN_STATUSES = ['not_configured','configured_placeholder','connected_external','error','disabled']

export const THEME_TOKEN_GROUPS = ['colors','typography','spacing','logo','receipt','dashboard','module_names','custom']

export const MODULE_KEYS = ['customers','loyalty','reservations','event_packages','payments','staff','reports','inventory','eat','smokecraft','pos_overlay','settings','custom']

export const MODULE_STATUSES = ['available','enabled','disabled','hidden','unavailable','deprecated']

export const OVERRIDE_STATUSES = ['draft','active','disabled','pending_approval','rejected']

export const PROVIDER_TYPES = ['payments','payroll','bi','reservations','sms','email','printer','kitchen_display','accounting','inventory_vendor','external_pos','eat','smokecraft','custom']

export const INTEGRATION_STATUSES = ['not_connected','configured_placeholder','connected_external','disabled','error']

export const READINESS_TYPES = ['configuration','credentials','webhook','data_sync','permissions','compliance','custom']

export const READINESS_STATUSES = ['not_checked','ready_placeholder','ready_external','failed','unavailable']

export const CHANGE_STATUSES = ['draft','pending_approval','applied','rejected','cancelled']

export const PROTECTED_SETTING_TYPES = ['financial_policy','tax_setting','refund_void_policy','module_toggle','white_label_identity','data_retention','provider_status','compliance_setting','custom']

export const APPROVAL_STATUSES = ['pending','approved','rejected','cancelled']

export const ROLLBACK_STATUSES = ['requested','approved','applied','rejected','cancelled']

export const SETTINGS_EXPORT_TYPES = ['json','csv','pdf_placeholder','print_ready','external_backup','custom']

export const SETTINGS_EXPORT_STATUSES = ['requested','generated_placeholder','ready_placeholder','sent_external','failed_external','unavailable']

export const isValidVenueType = v => VENUE_TYPES.includes(v)
export const isValidMeasurementUnit = v => MEASUREMENT_UNITS.includes(v)
export const isValidOperatingRuleGroup = v => OPERATING_RULE_GROUPS.includes(v)
export const isValidFinancialPolicyGroup = v => FINANCIAL_POLICY_GROUPS.includes(v)
export const isValidComplianceGroup = v => COMPLIANCE_GROUPS.includes(v)
export const isValidWhiteLabelStatus = v => WHITE_LABEL_STATUSES.includes(v)
export const isValidCustomDomainStatus = v => CUSTOM_DOMAIN_STATUSES.includes(v)
export const isValidThemeTokenGroup = v => THEME_TOKEN_GROUPS.includes(v)
export const isValidModuleKey = v => MODULE_KEYS.includes(v)
export const isValidModuleStatus = v => MODULE_STATUSES.includes(v)
export const isValidOverrideStatus = v => OVERRIDE_STATUSES.includes(v)
export const isValidProviderType = v => PROVIDER_TYPES.includes(v)
export const isValidIntegrationStatus = v => INTEGRATION_STATUSES.includes(v)
export const isValidReadinessType = v => READINESS_TYPES.includes(v)
export const isValidReadinessStatus = v => READINESS_STATUSES.includes(v)
export const isValidChangeStatus = v => CHANGE_STATUSES.includes(v)
export const isValidProtectedSettingType = v => PROTECTED_SETTING_TYPES.includes(v)
export const isValidApprovalStatus = v => APPROVAL_STATUSES.includes(v)
export const isValidRollbackStatus = v => ROLLBACK_STATUSES.includes(v)
export const isValidSettingsExportType = v => SETTINGS_EXPORT_TYPES.includes(v)
export const isValidSettingsExportStatus = v => SETTINGS_EXPORT_STATUSES.includes(v)
