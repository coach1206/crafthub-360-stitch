/**
 * POS360 Offline Sync — Localization (Phase B.6)
 * Supported: en-US, es-DO, es, ht, de, pt
 * English (en-US) is the fallback for all missing keys.
 * Note: Non-English strings are localization-ready keys; professional translation pending.
 */

export const SUPPORTED_LANGUAGES = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
export const DEFAULT_LANGUAGE     = 'en-US'

const translations = {
  'en-US': {
    // Offline mode
    offline_mode:               'Offline Mode',
    offline_active:             'You are offline. Actions are queued.',
    online_restored:            'Connection restored. Syncing now.',
    no_queued_actions:          'No offline actions are queued for this device.',
    queue_count:                '{count} actions queued',
    sync_now:                   'Sync Now',
    retry_sync:                 'Retry Sync',
    manual_sync:                'Manual Sync',
    sync_paused:                'Sync paused.',
    sync_pending:               'Sync pending.',
    sync_in_progress:           'Syncing…',
    sync_completed:             'Sync completed.',
    sync_failed:                'Sync failed.',
    sync_failed_body:           'Some actions could not be replayed.',
    no_fake_sync:               'Sync status reflects real network state.',

    // Conflict
    conflict_detected:          'Conflict detected.',
    no_conflicts:               'No sync conflicts require review.',
    conflict_resolution:        'Conflict Resolution',
    server_wins:                'Server version accepted.',
    device_wins:                'Device version accepted.',
    latest_wins:                'Latest timestamp accepted.',
    manager_review_required:    'Manager review required.',
    merge_if_safe:              'Merged safely.',
    reject_if_risky:            'Rejected — high-risk action.',
    dead_letter:                'Moved to dead-letter queue.',

    // Replay
    replay_failed:              'Replay failed. This action requires review.',
    replay_success:             'Action replayed successfully.',
    duplicate_blocked:          'Duplicate action blocked.',
    rollback_triggered:         'Sync rollback triggered.',

    // Dead letter
    dead_letter_queue:          'Dead-Letter Queue',
    no_dead_letters:            'No actions in the dead-letter queue.',
    dead_letter_escalated:      'Action escalated to manager.',
    dead_letter_archived:       'Action archived.',

    // Device health
    device_health:              'Device Health',
    sync_health_score:          'Sync Health Score',
    clock_drift_detected:       'Clock drift detected. Server time may differ.',
    device_offline:             'Device is offline.',
    device_online:              'Device is online.',
    local_fallback_active:      'Running in local/demo mode.',

    // Manager review
    manager_review_queue:       'Manager Review Queue',
    approve_replay:             'Approve',
    deny_replay:                'Deny',
    force_server_wins:          'Force Server Wins',
    force_device_wins:          'Force Device Wins',
    move_to_dead_letter:        'Move to Dead Letter',

    // E.A.T.
    eat_alerts:                 'E.A.T. Sync Alerts',
    eat_not_connected:          'E.A.T. sync alerts are not connected yet.',
    eat_alert_acknowledged:     'Alert acknowledged.',

    // Emergency
    emergency_mode:             'Emergency Mode',
    emergency_sync_priority:    'Emergency actions sync with priority.',

    // Language
    language_selector:          'Language',
    language_saved:             'Language preference saved.',
  },

  'es-DO': {
    offline_mode:               'Modo sin conexión',
    offline_active:             'Está sin conexión. Las acciones están en cola.',
    online_restored:            'Conexión restaurada. Sincronizando ahora.',
    no_queued_actions:          'No hay acciones en cola para este dispositivo.',
    queue_count:                '{count} acciones en cola',
    sync_now:                   'Sincronizar ahora',
    retry_sync:                 'Reintentar sincronización',
    manual_sync:                'Sincronización manual',
    sync_paused:                'Sincronización pausada.',
    sync_pending:               'Sincronización pendiente.',
    sync_in_progress:           'Sincronizando…',
    sync_completed:             'Sincronización completada.',
    sync_failed:                'Sincronización fallida.',
    sync_failed_body:           'Algunas acciones no se pudieron reproducir.',
    conflict_detected:          'Conflicto detectado.',
    no_conflicts:               'No hay conflictos de sincronización que revisar.',
    replay_failed:              'Reproducción fallida. Esta acción requiere revisión.',
    duplicate_blocked:          'Acción duplicada bloqueada.',
    dead_letter_queue:          'Cola de cartas muertas',
    no_dead_letters:            'No hay acciones en la cola de cartas muertas.',
    device_health:              'Salud del dispositivo',
    manager_review_queue:       'Cola de revisión del gerente',
    eat_alerts:                 'Alertas de sincronización E.A.T.',
    eat_not_connected:          'Las alertas de sincronización E.A.T. aún no están conectadas.',
    emergency_mode:             'Modo de emergencia',
    language_selector:          'Idioma',
    language_saved:             'Preferencia de idioma guardada.',
  },

  'es': {
    offline_mode:               'Modo sin conexión',
    offline_active:             'Está sin conexión. Las acciones están en cola.',
    online_restored:            'Conexión restaurada. Sincronizando.',
    no_queued_actions:          'No hay acciones en cola para este dispositivo.',
    queue_count:                '{count} acciones en cola',
    sync_now:                   'Sincronizar ahora',
    retry_sync:                 'Reintentar',
    sync_completed:             'Sincronización completada.',
    sync_failed:                'Error de sincronización.',
    conflict_detected:          'Conflicto detectado.',
    no_conflicts:               'Sin conflictos de sincronización.',
    replay_failed:              'Reproducción fallida. Revisión requerida.',
    dead_letter_queue:          'Cola de mensajes fallidos',
    eat_not_connected:          'Alertas E.A.T. no conectadas.',
    emergency_mode:             'Modo de emergencia',
    language_selector:          'Idioma',
  },

  'ht': {
    offline_mode:               'Mòd san koneksyon',
    offline_active:             'Ou pa konekte. Aksyon yo nan tou.',
    online_restored:            'Koneksyon retabli. Senkronizasyon kounye a.',
    no_queued_actions:          'Pa gen aksyon nan tou pou aparèy sa a.',
    queue_count:                '{count} aksyon nan tou',
    sync_now:                   'Senkronize kounye a',
    retry_sync:                 'Eseye ankò',
    sync_completed:             'Senkronizasyon fini.',
    sync_failed:                'Senkronizasyon echwe.',
    conflict_detected:          'Konfli detekte.',
    no_conflicts:               'Pa gen konfli pou revize.',
    replay_failed:              'Rejwe echwe. Revizyon nesesè.',
    dead_letter_queue:          'Fil mesaj mouri',
    eat_not_connected:          'Alèt E.A.T. pa konekte.',
    emergency_mode:             'Mòd dijans',
    language_selector:          'Lang',
  },

  'de': {
    offline_mode:               'Offline-Modus',
    offline_active:             'Sie sind offline. Aktionen werden eingereiht.',
    online_restored:            'Verbindung wiederhergestellt. Synchronisierung läuft.',
    no_queued_actions:          'Keine offline Aktionen für dieses Gerät.',
    queue_count:                '{count} Aktionen in der Warteschlange',
    sync_now:                   'Jetzt synchronisieren',
    retry_sync:                 'Erneut versuchen',
    sync_completed:             'Synchronisierung abgeschlossen.',
    sync_failed:                'Synchronisierung fehlgeschlagen.',
    conflict_detected:          'Konflikt erkannt.',
    no_conflicts:               'Keine Synchronisierungskonflikte.',
    replay_failed:              'Wiedergabe fehlgeschlagen. Überprüfung erforderlich.',
    dead_letter_queue:          'Tote-Brief-Warteschlange',
    eat_not_connected:          'E.A.T.-Benachrichtigungen nicht verbunden.',
    emergency_mode:             'Notfallmodus',
    language_selector:          'Sprache',
  },

  'pt': {
    offline_mode:               'Modo offline',
    offline_active:             'Você está offline. Ações estão na fila.',
    online_restored:            'Conexão restaurada. Sincronizando agora.',
    no_queued_actions:          'Nenhuma ação na fila para este dispositivo.',
    queue_count:                '{count} ações na fila',
    sync_now:                   'Sincronizar agora',
    retry_sync:                 'Tentar novamente',
    sync_completed:             'Sincronização concluída.',
    sync_failed:                'Falha na sincronização.',
    conflict_detected:          'Conflito detectado.',
    no_conflicts:               'Sem conflitos de sincronização.',
    replay_failed:              'Reprodução falhou. Revisão necessária.',
    dead_letter_queue:          'Fila de cartas mortas',
    eat_not_connected:          'Alertas E.A.T. não conectados.',
    emergency_mode:             'Modo de emergência',
    language_selector:          'Idioma',
  },
}

export function t(key, lang = DEFAULT_LANGUAGE, vars = {}) {
  const dict  = translations[lang] ?? translations[DEFAULT_LANGUAGE]
  const fallback = translations[DEFAULT_LANGUAGE]
  let str = dict[key] ?? fallback[key] ?? key
  // Variable substitution: {count} etc.
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v))
  }
  return str
}

export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES.map(code => ({
    code,
    label: translations[code]?.language_selector ?? code,
  }))
}

export default translations
