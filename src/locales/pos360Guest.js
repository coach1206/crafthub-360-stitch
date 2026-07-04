/**
 * pos360Guest.js — Phase B.8 localization for Customer, Loyalty & Guest Intelligence
 * Supports: en-US, es-DO, es, ht, de, pt
 */

const STRINGS = {
  'en-US': {
    no_loyalty_profile:       'No loyalty profile is connected for this guest.',
    no_rewards_available:     'No rewards are available for this guest.',
    eat_not_connected:        'E.A.T. guest insights are not connected yet.',
    smokecraft_not_connected: 'SmokeCraft guest intelligence is not connected yet.',
    guest_not_found:          'Guest profile not found.',
    merge_requires_manager:   'Customer merge requires manager approval.',
    adjustment_requires_manager: 'Points adjustment requires manager approval.',
    reversal_requires_manager:'Reward reversal requires manager approval.',
    points_earned:            'Points earned: {points}.',
    points_redeemed:          'Points redeemed: {points}.',
    tier_upgraded:            'Tier upgraded to {tier}.',
    consent_recorded:         'Consent preference recorded.',
    privacy_export_queued:    'Privacy data export has been queued.',
    privacy_delete_queued:    'Privacy data deletion has been queued.',
    offline_queued:           'Guest action queued for offline sync.',
    fraud_flagged:            'Loyalty account flagged for fraud review.',
  },
  'es-DO': {
    no_loyalty_profile:       'No hay perfil de lealtad conectado para este huésped.',
    no_rewards_available:     'No hay recompensas disponibles para este huésped.',
    eat_not_connected:        'Los insights de E.A.T. no están conectados aún.',
    smokecraft_not_connected: 'La inteligencia SmokeCraft no está conectada aún.',
    guest_not_found:          'Perfil de huésped no encontrado.',
    merge_requires_manager:   'La fusión de clientes requiere aprobación del gerente.',
    adjustment_requires_manager: 'El ajuste de puntos requiere aprobación del gerente.',
    reversal_requires_manager:'La reversión de recompensa requiere aprobación del gerente.',
    points_earned:            'Puntos ganados: {points}.',
    points_redeemed:          'Puntos canjeados: {points}.',
    tier_upgraded:            'Nivel ascendido a {tier}.',
    consent_recorded:         'Preferencia de consentimiento registrada.',
    privacy_export_queued:    'La exportación de datos de privacidad ha sido encolada.',
    privacy_delete_queued:    'La eliminación de datos de privacidad ha sido encolada.',
    offline_queued:           'Acción de huésped encolada para sincronización offline.',
    fraud_flagged:            'Cuenta de lealtad marcada para revisión por fraude.',
  },
  'es': {
    no_loyalty_profile:       'No hay perfil de fidelidad conectado para este huésped.',
    no_rewards_available:     'No hay recompensas disponibles para este huésped.',
    eat_not_connected:        'Los insights de E.A.T. no están conectados todavía.',
    smokecraft_not_connected: 'La inteligencia SmokeCraft no está conectada todavía.',
    guest_not_found:          'Perfil de huésped no encontrado.',
    merge_requires_manager:   'La fusión de clientes requiere aprobación del gerente.',
    adjustment_requires_manager: 'El ajuste de puntos requiere aprobación del gerente.',
    reversal_requires_manager:'La reversión de recompensa requiere aprobación del gerente.',
    points_earned:            'Puntos ganados: {points}.',
    points_redeemed:          'Puntos canjeados: {points}.',
    tier_upgraded:            'Nivel ascendido a {tier}.',
    consent_recorded:         'Preferencia de consentimiento registrada.',
    privacy_export_queued:    'La exportación de datos se ha encolado.',
    privacy_delete_queued:    'La eliminación de datos se ha encolado.',
    offline_queued:           'Acción del huésped encolada para sincronización sin conexión.',
    fraud_flagged:            'Cuenta de fidelidad marcada para revisión de fraude.',
  },
  'ht': {
    no_loyalty_profile:       'Pa gen pwofil lwayote konekte pou envite sa a.',
    no_rewards_available:     'Pa gen rekonpans disponib pou envite sa a.',
    eat_not_connected:        'Enfòmasyon E.A.T. pa konekte toujou.',
    smokecraft_not_connected: 'Entèlijans SmokeCraft pa konekte toujou.',
    guest_not_found:          'Pwofil envite pa jwenn.',
    merge_requires_manager:   'Fizyon kliyan bezwen apwobasyon manadjè.',
    adjustment_requires_manager: 'Ajisteman pwen bezwen apwobasyon manadjè.',
    reversal_requires_manager:'Anilasyon rekonpans bezwen apwobasyon manadjè.',
    points_earned:            'Pwen yo te fè: {points}.',
    points_redeemed:          'Pwen yo te reklame: {points}.',
    tier_upgraded:            'Nivo avanse nan {tier}.',
    consent_recorded:         'Preferans konsantman anrejistre.',
    privacy_export_queued:    'Ekspòtasyon done prive ajoute nan fil attant.',
    privacy_delete_queued:    'Efasman done prive ajoute nan fil attant.',
    offline_queued:           'Aksyon envite nan fil pou senkronizasyon offline.',
    fraud_flagged:            'Kont lwayote make pou revizyon fwod.',
  },
  'de': {
    no_loyalty_profile:       'Für diesen Gast ist kein Treueprofil verbunden.',
    no_rewards_available:     'Für diesen Gast sind keine Prämien verfügbar.',
    eat_not_connected:        'E.A.T.-Gasteinblicke sind noch nicht verbunden.',
    smokecraft_not_connected: 'SmokeCraft-Gastintelligenz ist noch nicht verbunden.',
    guest_not_found:          'Gastprofil nicht gefunden.',
    merge_requires_manager:   'Kundenzusammenführung erfordert Manager-Genehmigung.',
    adjustment_requires_manager: 'Punkteanpassung erfordert Manager-Genehmigung.',
    reversal_requires_manager:'Prämienrücknahme erfordert Manager-Genehmigung.',
    points_earned:            'Punkte gesammelt: {points}.',
    points_redeemed:          'Punkte eingelöst: {points}.',
    tier_upgraded:            'Stufe auf {tier} aufgestiegen.',
    consent_recorded:         'Einwilligungspräferenz gespeichert.',
    privacy_export_queued:    'Datenschutzexport wurde in die Warteschlange gestellt.',
    privacy_delete_queued:    'Datenlöschung wurde in die Warteschlange gestellt.',
    offline_queued:           'Gastaktion für Offline-Synchronisierung gespeichert.',
    fraud_flagged:            'Treuekonto für Betrugsprüfung markiert.',
  },
  'pt': {
    no_loyalty_profile:       'Nenhum perfil de fidelidade está conectado para este hóspede.',
    no_rewards_available:     'Nenhuma recompensa está disponível para este hóspede.',
    eat_not_connected:        'Os insights de E.A.T. ainda não estão conectados.',
    smokecraft_not_connected: 'A inteligência SmokeCraft ainda não está conectada.',
    guest_not_found:          'Perfil do hóspede não encontrado.',
    merge_requires_manager:   'Mesclagem de cliente requer aprovação do gerente.',
    adjustment_requires_manager: 'Ajuste de pontos requer aprovação do gerente.',
    reversal_requires_manager:'Reversão de recompensa requer aprovação do gerente.',
    points_earned:            'Pontos ganhos: {points}.',
    points_redeemed:          'Pontos resgatados: {points}.',
    tier_upgraded:            'Nível atualizado para {tier}.',
    consent_recorded:         'Preferência de consentimento registrada.',
    privacy_export_queued:    'Exportação de dados de privacidade foi enfileirada.',
    privacy_delete_queued:    'Exclusão de dados de privacidade foi enfileirada.',
    offline_queued:           'Ação do hóspede enfileirada para sincronização offline.',
    fraud_flagged:            'Conta de fidelidade marcada para revisão de fraude.',
  },
}

export function t(key, lang = 'en-US', vars = {}) {
  const dict = STRINGS[lang] || STRINGS['en-US']
  let str = dict[key] ?? STRINGS['en-US'][key] ?? key
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v))
  }
  return str
}

export function getSupportedGuestLanguages() {
  return Object.keys(STRINGS)
}
