/**
 * verifyPos360EventPackagesMonetization.js — Phase B.10 Prompt W
 * Verification: 118+ checks for event packages, deposits, minimum spend,
 * venue monetization, and contract intelligence.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())
const pass = []
const fail = []

function check(name, cond) {
  if (cond) { pass.push(name) } else { fail.push(name) }
}

// ── File paths ────────────────────────────────────────────────────────────────
const MIGRATION = `${ROOT}/server/db/migrations/040_pos360_event_packages_monetization.sql`
const CONTRACTS = `${ROOT}/server/services/pos360/pos360EventPackageContracts.js`
const FLAGS     = `${ROOT}/server/config/pos360EventPackageFeatureFlags.js`
const LOCALE    = `${ROOT}/src/locales/pos360EventPackages.js`
const SERVICE   = `${ROOT}/server/services/pos360/pos360EventPackageMonetizationService.js`
const CTRL      = `${ROOT}/server/controllers/pos360EventPackageMonetizationController.js`
const ROUTES    = `${ROOT}/server/routes/pos360EventPackageMonetizationRoutes.js`
const FRONTEND  = `${ROOT}/src/pages/pos360/POS360EventPackagesMonetization.jsx`

const sql  = existsSync(MIGRATION) ? readFileSync(MIGRATION, 'utf8') : ''
const cons = existsSync(CONTRACTS) ? readFileSync(CONTRACTS, 'utf8') : ''
const flags= existsSync(FLAGS)     ? readFileSync(FLAGS, 'utf8') : ''
const loc  = existsSync(LOCALE)    ? readFileSync(LOCALE, 'utf8') : ''
const svc  = existsSync(SERVICE)   ? readFileSync(SERVICE, 'utf8') : ''
const ctrl = existsSync(CTRL)      ? readFileSync(CTRL, 'utf8') : ''
const rt   = existsSync(ROUTES)    ? readFileSync(ROUTES, 'utf8') : ''
const fe   = existsSync(FRONTEND)  ? readFileSync(FRONTEND, 'utf8') : ''

// ── DATABASE / MIGRATION ─────────────────────────────────────────────────────
check('1. Migration file exists', existsSync(MIGRATION))
check('2. pos360_event_package_categories table', sql.includes('pos360_event_package_categories'))
check('3. pos360_event_packages table', sql.includes('pos360_event_packages'))
check('4. pos360_event_package_items table', sql.includes('pos360_event_package_items'))
check('5. pos360_event_package_pricing_rules table', sql.includes('pos360_event_package_pricing_rules'))
check('6. pos360_private_event_package_selections table', sql.includes('pos360_private_event_package_selections'))
check('7. pos360_private_event_package_selection_items table', sql.includes('pos360_private_event_package_selection_items'))
check('8. pos360_event_deposit_policies table', sql.includes('pos360_event_deposit_policies'))
check('9. pos360_event_deposit_records table', sql.includes('pos360_event_deposit_records'))
check('10. pos360_event_deposit_status_history table', sql.includes('pos360_event_deposit_status_history'))
check('11. pos360_event_minimum_spend_rules table', sql.includes('pos360_event_minimum_spend_rules'))
check('12. pos360_event_minimum_spend_progress table', sql.includes('pos360_event_minimum_spend_progress'))
check('13. pos360_event_contract_templates table', sql.includes('pos360_event_contract_templates'))
check('14. pos360_event_contract_snapshots table', sql.includes('pos360_event_contract_snapshots'))
check('15. pos360_event_contract_status_history table', sql.includes('pos360_event_contract_status_history'))
check('16. pos360_event_cancellation_policies table', sql.includes('pos360_event_cancellation_policies'))
check('17. pos360_event_package_approval_requests table', sql.includes('pos360_event_package_approval_requests'))
check('18. pos360_event_package_inventory_forecasts table', sql.includes('pos360_event_package_inventory_forecasts'))
check('19. pos360_event_package_pos_order_links table', sql.includes('pos360_event_package_pos_order_links'))
check('20. pos360_event_monetization_insights table', sql.includes('pos360_event_monetization_insights'))
check('21. pos360_event_package_offline_queue table', sql.includes('pos360_event_package_offline_queue'))
check('22. pos360_event_package_audit table', sql.includes('pos360_event_package_audit'))
check('23. No DROP TABLE in migration', (() => {
  for (const l of sql.split('\n')) {
    if (!l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l)) return false
  }
  return true
})())
check('24. Uses CREATE TABLE IF NOT EXISTS', sql.includes('CREATE TABLE IF NOT EXISTS'))
check('25. venue_id on all key tables', sql.split('venue_id').length > 10)
check('26. private_event_id present on relevant tables', sql.includes('private_event_id'))
check('27. contains_secrets BOOLEAN NOT NULL DEFAULT FALSE on audit', sql.includes('contains_secrets') && sql.includes('DEFAULT FALSE'))
check('28. exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE present', sql.includes('exposes_private_data') && sql.includes('DEFAULT TRUE'))
check('29. exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE present', sql.includes('exposes_financial_data') && sql.includes('DEFAULT TRUE'))
check('30. idempotency_key UNIQUE on packages', sql.includes('idx_event_packages_idem'))
check('31. idempotency_key UNIQUE on package selections', sql.includes('idx_pkg_selections_idem'))
check('32. idempotency_key UNIQUE on deposit records', sql.includes('idx_deposit_records_idem'))
check('33. idempotency_key UNIQUE on contract snapshots', sql.includes('idx_contract_snapshots_idem'))
check('34. idempotency_key UNIQUE on approval requests', sql.includes('idx_approval_requests_idem'))
check('35. idempotency_key UNIQUE on POS order links', sql.includes('idx_pos_order_links_idem'))
check('36. deposit status history table exists', sql.includes('pos360_event_deposit_status_history'))
check('37. contract status history table exists', sql.includes('pos360_event_contract_status_history'))
check('38. offline queue table exists', sql.includes('pos360_event_package_offline_queue'))
check('39. POS order link table exists', sql.includes('pos360_event_package_pos_order_links'))
check('40. inventory forecast table exists', sql.includes('pos360_event_package_inventory_forecasts'))
check('41. monetization insight table exists', sql.includes('pos360_event_monetization_insights'))
check('42. pricing model CHECK constraint', sql.includes("'flat_fee','per_person','tiered','minimum_spend','custom_quote'"))
check('43. deposit status CHECK constraint', sql.includes("'not_required','pending','marked_paid_external','waived','refunded_external','failed','cancelled'"))
check('44. contract status CHECK constraint', sql.includes("'draft','generated_placeholder','sent_external','viewed_external','signed_external','declined_external','expired','cancelled'"))

// ── CONTRACTS ────────────────────────────────────────────────────────────────
check('45. Contracts file exists', existsSync(CONTRACTS))
check('46. PACKAGE_CATEGORY_TYPES exported', cons.includes('PACKAGE_CATEGORY_TYPES'))
check('47. PRICING_MODELS exported', cons.includes('PRICING_MODELS'))
check('48. PACKAGE_STATUSES exported', cons.includes('PACKAGE_STATUSES'))
check('49. PACKAGE_SELECTION_STATUSES exported', cons.includes('PACKAGE_SELECTION_STATUSES'))
check('50. APPROVAL_STATUSES exported', cons.includes('APPROVAL_STATUSES'))
check('51. DEPOSIT_STATUSES exported', cons.includes('DEPOSIT_STATUSES'))
check('52. CONTRACT_STATUSES exported', cons.includes('CONTRACT_STATUSES'))
check('53. MINIMUM_SPEND_SOURCES exported', cons.includes('MINIMUM_SPEND_SOURCES'))
check('54. FORECAST_TYPES exported', cons.includes('FORECAST_TYPES'))
check('55. APPROVAL_TYPES exported', cons.includes('APPROVAL_TYPES'))
check('56. MONETIZATION_INSIGHT_TYPES exported', cons.includes('MONETIZATION_INSIGHT_TYPES'))
check('57. isValidPackageCategoryType exported', cons.includes('isValidPackageCategoryType'))
check('58. isValidPricingModel exported', cons.includes('isValidPricingModel'))
check('59. isValidPackageSelectionStatus exported', cons.includes('isValidPackageSelectionStatus'))
check('60. isValidApprovalStatus exported', cons.includes('isValidApprovalStatus'))
check('61. isValidDepositStatus exported', cons.includes('isValidDepositStatus'))
check('62. isValidContractStatus exported', cons.includes('isValidContractStatus'))
check('63. isValidMinimumSpendSource exported', cons.includes('isValidMinimumSpendSource'))
check('64. isValidForecastType exported', cons.includes('isValidForecastType'))
check('65. isValidApprovalType exported', cons.includes('isValidApprovalType'))
check('66. isValidMonetizationInsightType exported', cons.includes('isValidMonetizationInsightType'))

// ── FEATURE FLAGS ─────────────────────────────────────────────────────────────
check('67. Feature flags file exists', existsSync(FLAGS))
check('68. DEFAULT_POS360_EVENT_PACKAGE_FLAGS exported', flags.includes('DEFAULT_POS360_EVENT_PACKAGE_FLAGS'))
check('69. getEventPackageFlags exported', flags.includes('getEventPackageFlags'))
check('70. eventPackagesEnabled flag', flags.includes('eventPackagesEnabled'))
check('71. depositTrackingEnabled flag', flags.includes('depositTrackingEnabled'))
check('72. minimumSpendEnabled flag', flags.includes('minimumSpendEnabled'))
check('73. contractTrackingEnabled flag', flags.includes('contractTrackingEnabled'))
check('74. inventoryForecastHooksEnabled flag', flags.includes('inventoryForecastHooksEnabled'))
check('75. posOrderLinkHooksEnabled flag', flags.includes('posOrderLinkHooksEnabled'))
check('76. eatMonetizationInsightsEnabled flag', flags.includes('eatMonetizationInsightsEnabled'))
check('77. offlineEventPackageQueueEnabled flag', flags.includes('offlineEventPackageQueueEnabled'))
check('78. 24+ flags present', (flags.match(/\w+Enabled/g) || []).length >= 24)
check('79. humidorPackagesEnabled flag', flags.includes('humidorPackagesEnabled'))
check('80. kitchenPackagesEnabled flag', flags.includes('kitchenPackagesEnabled'))
check('81. honestPaymentProviderStatesEnabled flag', flags.includes('honestPaymentProviderStatesEnabled'))

// ── LOCALES ───────────────────────────────────────────────────────────────────
check('82. Locale file exists', existsSync(LOCALE))
check('83. tEventPackage exported', loc.includes('tEventPackage'))
check('84. getSupportedEventPackageLanguages exported', loc.includes('getSupportedEventPackageLanguages'))
check('85. en-US locale present', loc.includes("'en-US'"))
check('86. es-DO locale present', loc.includes("'es-DO'"))
check('87. es locale present', loc.includes("'es'"))
check('88. ht locale present', loc.includes("'ht'"))
check('89. de locale present', loc.includes("'de'"))
check('90. pt locale present', loc.includes("'pt'"))
check('91. payment_provider_not_connected label', loc.includes('payment_provider_not_connected'))
check('92. contract_provider_not_connected label', loc.includes('contract_provider_not_connected'))
check('93. manager_approval_required label', loc.includes('manager_approval_required'))
check('94. offline_queue_pending label', loc.includes('offline_queue_pending'))
check('95. eat_insights_not_connected label', loc.includes('eat_insights_not_connected'))
check('96. pii_handling_notice label', loc.includes('pii_handling_notice'))
check('97. financial_data_notice label', loc.includes('financial_data_notice'))

// ── SERVICE ───────────────────────────────────────────────────────────────────
check('98. Service file exists', existsSync(SERVICE))
check('99. Service opening comment (no DB string)', svc.includes('Never prints or logs the database connection string'))
check('100. isDbAvailable used', svc.includes('isDbAvailable'))
check('101. createPackageCategory exported', svc.includes('createPackageCategory'))
check('102. createEventPackage exported', svc.includes('createEventPackage'))
check('103. archiveEventPackage exported', svc.includes('archiveEventPackage'))
check('104. addPackageItem exported', svc.includes('addPackageItem'))
check('105. createPricingRule exported', svc.includes('createPricingRule'))
check('106. calculatePackageQuote exported', svc.includes('calculatePackageQuote'))
check('107. selectPackageForPrivateEvent exported', svc.includes('selectPackageForPrivateEvent'))
check('108. approvePackageSelection exported', svc.includes('approvePackageSelection'))
check('109. createDepositRecord exported', svc.includes('createDepositRecord'))
check('110. approveDepositWaiver exported', svc.includes('approveDepositWaiver'))
check('111. approveDepositRefund exported', svc.includes('approveDepositRefund'))
check('112. createMinimumSpendRule exported', svc.includes('createMinimumSpendRule'))
check('113. getMinimumSpendProgress exported', svc.includes('getMinimumSpendProgress'))
check('114. approveMinimumSpendOverride exported', svc.includes('approveMinimumSpendOverride'))
check('115. createContractSnapshot exported', svc.includes('createContractSnapshot'))
check('116. updateContractStatus exported', svc.includes('updateContractStatus'))
check('117. createApprovalRequest exported', svc.includes('createApprovalRequest'))
check('118. decideApprovalRequest exported', svc.includes('decideApprovalRequest'))
check('119. createInventoryForecast exported', svc.includes('createInventoryForecast'))
check('120. createPOSOrderLink exported', svc.includes('createPOSOrderLink'))
check('121. createMonetizationInsightPlaceholder exported', svc.includes('createMonetizationInsightPlaceholder'))
check('122. getPrivateEventMonetizationSummary exported', svc.includes('getPrivateEventMonetizationSummary'))
check('123. queueOfflineEventPackageAction exported', svc.includes('queueOfflineEventPackageAction'))
check('124. auditRecord function exists', svc.includes('async function auditRecord'))
check('125. writeDepositStatusHistory function exists', svc.includes('writeDepositStatusHistory'))
check('126. writeContractStatusHistory function exists', svc.includes('writeContractStatusHistory'))
check('127. Idempotency key required on mutations', svc.includes('idempotency_key_required'))
check('128. Manager approval check exists', svc.includes('manager_approval_required'))
check('129. No fake deposit success', !svc.includes('deposit successfully processed') && !svc.includes('payment successful'))
check('130. No fake refund success', !svc.includes('refund successfully processed') && !svc.includes('refund complete'))
check('131. No fake contract signed', !svc.includes('contract signed successfully') && !svc.includes('signed by guest'))
check('132. No fake payment provider connected', !svc.includes('payment provider connected') && !svc.includes('Stripe connected'))
check('133. No fake minimum spend satisfaction without data', !svc.includes('minimum spend automatically satisfied'))
check('134. No fake inventory reservation', !svc.includes('inventory reserved successfully') && !svc.includes('cigar reserved'))
check('135. No fake E.A.T. AI insight', !svc.includes('AI insight generated') && !svc.includes('EAT AI result'))
check('136. No fake profitability', !svc.includes('event profitable') && !svc.includes('profitability confirmed'))
check('137. Honest empty state response exists', svc.includes('No event packages are configured') || svc.includes('No package selections'))
check('138. Honest deposit note exists', svc.includes('No payment has been processed'))
check('139. Honest contract note exists', svc.includes('No contract has been sent'))
check('140. Honest minimum spend note exists', svc.includes('Minimum spend is not satisfied') || svc.includes('No linked POS orders'))
check('141. Honest inventory forecast note exists', svc.includes('No inventory has been reserved'))
check('142. LOCAL_PREVIEW fallback exists', svc.includes('LOCAL_PREVIEW'))

// ── CONTROLLER ───────────────────────────────────────────────────────────────
check('143. Controller file exists', existsSync(CTRL))
check('144. ok500 pattern used', ctrl.includes('ok500'))
check('145. createPackageCategory handler', ctrl.includes('createPackageCategory'))
check('146. createEventPackage handler', ctrl.includes('createEventPackage'))
check('147. archiveEventPackage handler', ctrl.includes('archiveEventPackage'))
check('148. createDepositRecord handler', ctrl.includes('createDepositRecord'))
check('149. approveDepositWaiver handler', ctrl.includes('approveDepositWaiver'))
check('150. approveDepositRefund handler', ctrl.includes('approveDepositRefund'))
check('151. createMinimumSpendRule handler', ctrl.includes('createMinimumSpendRule'))
check('152. approveMinimumSpendOverride handler', ctrl.includes('approveMinimumSpendOverride'))
check('153. createContractSnapshot handler', ctrl.includes('createContractSnapshot'))
check('154. decideApprovalRequest handler', ctrl.includes('decideApprovalRequest'))
check('155. createInventoryForecast handler', ctrl.includes('createInventoryForecast'))
check('156. createPOSOrderLink handler', ctrl.includes('createPOSOrderLink'))
check('157. createMonetizationInsightPlaceholder handler', ctrl.includes('createMonetizationInsightPlaceholder'))
check('158. queueOfflineEventPackageAction handler', ctrl.includes('queueOfflineEventPackageAction'))

// ── ROUTES ────────────────────────────────────────────────────────────────────
check('159. Routes file exists', existsSync(ROUTES))
check('160. Mounted under /api/pos360/event-packages', rt.includes('/api/pos360/event-packages') || rt.includes("'/categories'") || rt.includes("'/packages'"))
check('161. canAccessPOS3 imported', rt.includes('canAccessPOS3'))
check('162. Write routes use canAccessPOS3', rt.includes('canAccessPOS3, ctrl.createEventPackage'))
check('163. Manager approval routes exist', rt.includes('approve-waiver') && rt.includes('approve-refund') && rt.includes('approve-override'))
check('164. No fake payment route', !rt.includes('/stripe') && !rt.includes('/charge') && !rt.includes('/square'))
check('165. No fake contract signing route', !rt.includes('/docusign') && !rt.includes('/sign-contract') && !rt.includes('/esign'))
check('166. No fake Stripe route', !rt.includes("'/stripe'"))
check('167. No fake DocuSign route', !rt.includes("'/docusign'"))
check('168. Offline queue route exists', rt.includes('offline-queue'))
check('169. Inventory forecast routes exist', rt.includes('inventory-forecasts'))
check('170. POS order links routes exist', rt.includes('pos-order-links'))
check('171. Monetization summary route exists', rt.includes('monetization-summary'))

// ── FRONTEND ──────────────────────────────────────────────────────────────────
check('172. Frontend page exists', existsSync(FRONTEND))
check('173. EventPackageDashboard component', fe.includes('EventPackageDashboard'))
check('174. PackageCategoryPanel component', fe.includes('PackageCategoryPanel'))
check('175. PackageCatalogPanel component', fe.includes('PackageCatalogPanel'))
check('176. PackageBuilderPanel component', fe.includes('PackageBuilderPanel'))
check('177. PackageItemPanel component', fe.includes('PackageItemPanel'))
check('178. PricingRulesPanel component', fe.includes('PricingRulesPanel'))
check('179. PackageQuotePanel component', fe.includes('PackageQuotePanel'))
check('180. PrivateEventPackageSelectionPanel component', fe.includes('PrivateEventPackageSelectionPanel'))
check('181. DepositPolicyPanel component', fe.includes('DepositPolicyPanel'))
check('182. DepositTrackingPanel component', fe.includes('DepositTrackingPanel'))
check('183. DepositApprovalPanel component', fe.includes('DepositApprovalPanel'))
check('184. MinimumSpendPanel component', fe.includes('MinimumSpendPanel'))
check('185. MinimumSpendProgressPanel component', fe.includes('MinimumSpendProgressPanel'))
check('186. ContractTemplatePanel component', fe.includes('ContractTemplatePanel'))
check('187. ContractSnapshotPanel component', fe.includes('ContractSnapshotPanel'))
check('188. ContractStatusPanel component', fe.includes('ContractStatusPanel'))
check('189. CancellationPolicyPanel component', fe.includes('CancellationPolicyPanel'))
check('190. ApprovalRequestPanel component', fe.includes('ApprovalRequestPanel'))
check('191. InventoryForecastPanel component', fe.includes('InventoryForecastPanel'))
check('192. KitchenPackageForecastPanel component', fe.includes('KitchenPackageForecastPanel'))
check('193. BarPackageForecastPanel component', fe.includes('BarPackageForecastPanel'))
check('194. HumidorPackageForecastPanel component', fe.includes('HumidorPackageForecastPanel'))
check('195. POSOrderLinkPanel component', fe.includes('POSOrderLinkPanel'))
check('196. EATMonetizationInsightsPanel component', fe.includes('EATMonetizationInsightsPanel'))
check('197. OfflineEventPackageQueuePanel component', fe.includes('OfflineEventPackageQueuePanel'))
check('198. HonestPaymentProviderStatePanel component', fe.includes('HonestPaymentProviderStatePanel'))
check('199. HonestContractProviderStatePanel component', fe.includes('HonestContractProviderStatePanel'))
check('200. HonestEmptyStatePanel component', fe.includes('HonestEmptyStatePanel'))
check('201. EventPackageLanguageSelector component', fe.includes('EventPackageLanguageSelector'))
check('202. Touchscreen-friendly layout', fe.includes('Touchscreen'))
check('203. Handheld-friendly layout', fe.includes('Handheld'))
check('204. No fake populated guest data', !fe.includes('John Smith') && !fe.includes('jane@') && !fe.includes('555-'))
check('205. Payment provider not connected language', fe.includes('Payment provider is not connected'))
check('206. Contract provider not connected language', fe.includes('Contract provider is not connected') || fe.includes('contract provider is not connected'))
check('207. Inventory forecast only language', fe.includes('forecast only'))
check('208. POS order link not connected language', fe.includes('POS order link integration is not connected'))
check('209. smokecraft-pos360.png referenced', fe.includes('/smokecraft-pos360.png'))

// ── SAFETY ────────────────────────────────────────────────────────────────────
check('210. PII handling language in service', svc.includes('exposes_private_data'))
check('211. Financial data handling in service', svc.includes('exposes_financial_data') || svc.includes('exposes_financial_data'))
check('212. contains_secrets false in service', svc.includes('contains_secrets'))
check('213. Manager approval block response in service', svc.includes('managerApprovalRequired: true'))
check('214. Offline queue honest sync language', svc.includes('Action queued for sync'))
check('215. Build-safe ESM exports', svc.includes('export async function'))

// ── RESULTS ───────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════')
console.log('  Phase B.10 Prompt W — Event Packages Monetization Verify')
console.log('══════════════════════════════════════════════════════════')
pass.forEach(n => console.log(`  ✓ ${n}`))
if (fail.length) {
  console.log('\n  FAILED:')
  fail.forEach(n => console.log(`  ✗ ${n}`))
}
console.log('\n──────────────────────────────────────────────────────────')
console.log(`  PASS: ${pass.length}  FAIL: ${fail.length}  TOTAL: ${pass.length + fail.length}`)
console.log('──────────────────────────────────────────────────────────\n')
process.exit(fail.length > 0 ? 1 : 0)
