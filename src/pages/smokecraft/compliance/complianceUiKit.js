/**
 * Shared style tokens + tiny EN/ES dictionary for the Production Package 6
 * Correction compliance UI surfaces (age-gate, policy/warning acceptance,
 * consent center, data-rights, staff verification, compliance admin).
 * Legal-text strings are always prefixed with the counsel-review draft
 * label — never presented as final/approved language.
 */
export const GOLD = '#E9C176'
export const NAVY = '#0b0f18'
export const CREAM = '#e5e2e1'
export const BORDER = 'rgba(233,193,118,0.22)'
export const GLASS = 'rgba(8,10,16,0.9)'
export const DANGER = '#ff9b9b'
export const OK = '#7fd0a3'
export const WARN = '#f0c060'

export const page = { position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }
export const wrap = { padding: 'clamp(16px,3vw,32px)', maxWidth: 760, margin: '0 auto' }
export const card = { background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }
export const h1Style = { color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }
export const h2Style = { fontSize: 15, color: GOLD, margin: '0 0 10px' }
export const backBtn = { minHeight: 44, minWidth: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit', fontSize: 14 }
export const primaryBtn = (enabled) => ({
  minHeight: 44, padding: '12px 20px', borderRadius: 20, border: `1.5px solid ${enabled ? OK : BORDER}`,
  background: 'transparent', color: enabled ? OK : 'rgba(229,226,225,0.35)', cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 15,
})
export const secondaryBtn = { minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }
export const inputStyle = { minHeight: 44, width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }
export const labelStyle = { display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.75)', marginBottom: 4 }
export const draftBanner = { background: 'rgba(240,192,96,0.12)', border: `1px solid ${WARN}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: WARN, marginBottom: 12, letterSpacing: 0.3 }
export const errorSummary = { background: 'rgba(255,155,155,0.1)', border: `1px solid ${DANGER}`, borderRadius: 8, padding: 12, marginBottom: 16 }
export const statusBadge = (kind) => {
  const color = kind === 'ok' ? OK : kind === 'warn' ? WARN : kind === 'danger' ? DANGER : 'rgba(229,226,225,0.6)'
  return { display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 12, border: `1px solid ${color}`, color, marginBottom: 8 }
}
export const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }

export const DICT = {
  en: {
    draftNotice: 'DRAFT — PENDING QUALIFIED LEGAL COUNSEL REVIEW. Not final or legally approved language.',
    ageGateTitle: 'Age Verification', ageGateIntro: 'SmokeCraft 360 tobacco purchases require verified proof you meet the legal minimum age for your jurisdiction.',
    dob: 'Date of birth', jurisdiction: 'Your jurisdiction', submit: 'Submit', retry: 'Try again', support: 'Contact support',
    pending: 'Pending review', approved: 'Verified', denied: 'Verification denied', expired: 'Verification expired',
    selfAttest: 'Self-attestation', staffAssist: 'Staff-assisted (in person)', providerNote: '(Placeholder shape only — not a live third-party identity provider in this environment.)',
    privacyNote: 'We only use your date of birth to compute eligibility. No government ID is collected or stored by this flow.',
    termsTitle: 'Terms & Conditions', privacyTitle: 'Privacy Policy', warningTitle: 'Tobacco Health Warning',
    accept: 'Accept', decline: 'Decline', version: 'Version', effective: 'Effective', accepted: 'Accepted',
    consentTitle: 'Consent Preferences', necessary: 'Strictly necessary (always on)', preferences: 'Preferences', analytics: 'Analytics', marketing: 'Marketing',
    save: 'Save preferences', withdraw: 'Withdraw all consent', history: 'Consent history',
    dataRightsTitle: 'Your Data Rights', access: 'Access my data', exportData: 'Export my data', deletion: 'Delete my account', requestStatus: 'Request status',
    staffVerifyTitle: 'Staff Age Verification', approveBtn: 'Approve', denyBtn: 'Deny', reason: 'Reason', legalNotice: 'Verifying age is a legal responsibility, not optional.',
    adminTitle: 'Compliance Administration',
    langToggle: 'Español',
  },
  es: {
    draftNotice: 'BORRADOR — PENDIENTE DE REVISION POR ABOGADO CALIFICADO. No es un texto legal final ni aprobado.',
    ageGateTitle: 'Verificacion de Edad', ageGateIntro: 'Las compras de tabaco en SmokeCraft 360 requieren prueba verificada de que cumple la edad minima legal en su jurisdiccion.',
    dob: 'Fecha de nacimiento', jurisdiction: 'Su jurisdiccion', submit: 'Enviar', retry: 'Intentar de nuevo', support: 'Contactar soporte',
    pending: 'Pendiente de revision', approved: 'Verificado', denied: 'Verificacion denegada', expired: 'Verificacion vencida',
    selfAttest: 'Autoafirmacion', staffAssist: 'Asistido por personal (en persona)', providerNote: '(Solo estructura de marcador de posicion — no es un proveedor de identidad externo en vivo en este entorno.)',
    privacyNote: 'Solo usamos su fecha de nacimiento para calcular elegibilidad. Este flujo no recopila ni almacena identificacion gubernamental.',
    termsTitle: 'Terminos y Condiciones', privacyTitle: 'Politica de Privacidad', warningTitle: 'Advertencia de Salud sobre Tabaco',
    accept: 'Aceptar', decline: 'Rechazar', version: 'Version', effective: 'Vigente desde', accepted: 'Aceptado',
    consentTitle: 'Preferencias de Consentimiento', necessary: 'Estrictamente necesario (siempre activo)', preferences: 'Preferencias', analytics: 'Analitica', marketing: 'Marketing',
    save: 'Guardar preferencias', withdraw: 'Retirar todo el consentimiento', history: 'Historial de consentimiento',
    dataRightsTitle: 'Sus Derechos de Datos', access: 'Acceder a mis datos', exportData: 'Exportar mis datos', deletion: 'Eliminar mi cuenta', requestStatus: 'Estado de la solicitud',
    staffVerifyTitle: 'Verificacion de Edad por Personal', approveBtn: 'Aprobar', denyBtn: 'Denegar', reason: 'Motivo', legalNotice: 'Verificar la edad es una responsabilidad legal, no opcional.',
    adminTitle: 'Administracion de Cumplimiento',
    langToggle: 'English',
  },
}

export function useLocale() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('sc_compliance_locale') : null
  return stored === 'es' ? 'es' : 'en'
}
export function setLocalePref(locale) {
  if (typeof localStorage !== 'undefined') localStorage.setItem('sc_compliance_locale', locale)
}

export const CHECKOUT_DENIAL_COPY = {
  en: {
    'age-verification-required': { title: 'Age verification required', body: 'You must complete age verification before checkout.', cta: 'Verify my age' },
    'age-verification-expired': { title: 'Age verification expired', body: 'Your prior age verification has expired and must be renewed.', cta: 'Re-verify my age' },
    'jurisdiction-unsupported': { title: 'Not available in your jurisdiction', body: 'Tobacco sales are not currently supported for this venue’s jurisdiction.', cta: 'Contact support' },
    'terms-acceptance-required': { title: 'Terms acceptance required', body: 'You must accept the current Terms & Conditions before checkout.', cta: 'Review Terms' },
    'privacy-acknowledgement-required': { title: 'Privacy acknowledgement required', body: 'You must acknowledge the current Privacy Policy before checkout.', cta: 'Review Privacy Policy' },
    'warning-acknowledgement-required': { title: 'Health warning acknowledgement required', body: 'You must acknowledge the tobacco health warning before checkout.', cta: 'Review Warning' },
    'fulfillment-method-prohibited': { title: 'Fulfillment method not allowed', body: 'This fulfillment method is not permitted in this jurisdiction.', cta: 'Choose another option' },
    'shipping-prohibited': { title: 'Shipping not available', body: 'Shipping tobacco products is not enabled for this jurisdiction.', cta: 'Choose pickup instead' },
    'staff-verification-required': { title: 'Staff verification required', body: 'A staff member must verify your identity in person before this order can proceed.', cta: 'Find a staff member' },
  },
  es: {
    'age-verification-required': { title: 'Se requiere verificacion de edad', body: 'Debe completar la verificacion de edad antes de pagar.', cta: 'Verificar mi edad' },
    'age-verification-expired': { title: 'Verificacion de edad vencida', body: 'Su verificacion anterior vencio y debe renovarse.', cta: 'Volver a verificar' },
    'jurisdiction-unsupported': { title: 'No disponible en su jurisdiccion', body: 'La venta de tabaco no esta actualmente admitida para la jurisdiccion de este local.', cta: 'Contactar soporte' },
    'terms-acceptance-required': { title: 'Se requiere aceptar los Terminos', body: 'Debe aceptar los Terminos y Condiciones vigentes antes de pagar.', cta: 'Revisar Terminos' },
    'privacy-acknowledgement-required': { title: 'Se requiere reconocer la Privacidad', body: 'Debe reconocer la Politica de Privacidad vigente antes de pagar.', cta: 'Revisar Privacidad' },
    'warning-acknowledgement-required': { title: 'Se requiere reconocer la advertencia', body: 'Debe reconocer la advertencia de salud sobre el tabaco antes de pagar.', cta: 'Revisar Advertencia' },
    'fulfillment-method-prohibited': { title: 'Metodo de entrega no permitido', body: 'Este metodo de entrega no esta permitido en esta jurisdiccion.', cta: 'Elegir otra opcion' },
    'shipping-prohibited': { title: 'Envio no disponible', body: 'El envio de productos de tabaco no esta habilitado para esta jurisdiccion.', cta: 'Elegir recogida' },
    'staff-verification-required': { title: 'Se requiere verificacion de personal', body: 'Un miembro del personal debe verificar su identidad en persona antes de continuar.', cta: 'Buscar personal' },
  },
}
