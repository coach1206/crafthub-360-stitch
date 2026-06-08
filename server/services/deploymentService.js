/**
 * Deployment Service — Phase 11
 * Runs environment and readiness checks for NOVEE OS deployment.
 * Safe to call in all environments — never crashes the server.
 */

import { isDbAvailable } from '../db/connection.js'
import { isElevenLabsConfigured } from './voiceService.js'

const isDev  = process.env.NODE_ENV !== 'production'
const isProd = process.env.NODE_ENV === 'production'

// ── Individual checks ─────────────────────────────────────────────────────────

function chk(key, status, message, metadata = {}) {
  return { key, status, message, metadata, checkedAt: new Date().toISOString() }
}

export function checkBackendHealth() {
  return chk('backend_health', 'pass', 'Backend process is running')
}

export function checkDatabase() {
  const ok = isDbAvailable()
  return chk(
    'database_connected',
    ok ? 'pass' : 'warn',
    ok ? 'PostgreSQL connected' : 'Database unavailable — running in prototype mode',
    { prototype: !ok }
  )
}

export function checkJwtSecret() {
  const secret = process.env.JWT_SECRET || ''
  const isDefault = secret === 'dev-jwt-secret-INSECURE-DO-NOT-USE-IN-PRODUCTION' || !secret
  if (isProd && isDefault) {
    return chk('jwt_secret', 'fail', 'JWT_SECRET is not set or uses the insecure default in production')
  }
  if (isDev && isDefault) {
    return chk('jwt_secret', 'warn', 'JWT_SECRET uses dev default — fine for development only')
  }
  return chk('jwt_secret', 'pass', 'JWT_SECRET is configured')
}

export function checkFounderChallenge() {
  const secret = process.env.FOUNDER_CHALLENGE_SECRET
  if (isProd && !secret) {
    return chk('founder_challenge', 'fail', 'FOUNDER_CHALLENGE_SECRET not set in production')
  }
  if (!secret) {
    return chk('founder_challenge', 'warn', 'FOUNDER_CHALLENGE_SECRET not set — founder login disabled')
  }
  return chk('founder_challenge', 'pass', 'Founder challenge secret configured')
}

export function checkCorsOrigin() {
  const origin = process.env.CORS_ORIGIN
  if (isProd && (!origin || origin === '*' || origin === 'true')) {
    return chk('cors_origin', 'warn', 'CORS_ORIGIN is a wildcard in production — restrict for security')
  }
  return chk('cors_origin', 'pass', `CORS_ORIGIN: ${origin || '(permissive — acceptable in dev)'}`)
}

export function checkVoice() {
  const ok = isElevenLabsConfigured()
  return chk(
    'voice_status',
    'pass',
    ok ? 'ElevenLabs configured — high-fidelity mentor voice active'
       : 'No ElevenLabs key — Web Speech API (prototype voice) active',
    { provider: ok ? 'elevenlabs' : 'webspeech', elevenlabs: ok }
  )
}

export function checkPos3Prototype() {
  return chk('pos3_prototype', 'pass', 'POS 3 prototype provider always available (no credentials needed)')
}

export function checkEnvVars() {
  const required   = ['DATABASE_URL', 'JWT_SECRET']
  const optional   = ['FOUNDER_CHALLENGE_SECRET', 'ELEVENLABS_API_KEY', 'CORS_ORIGIN']
  const missing    = required.filter(k => !process.env[k])
  const missingOpt = optional.filter(k => !process.env[k])

  if (isProd && missing.length > 0) {
    return chk('env_vars', 'fail', `Missing required env vars in production: ${missing.join(', ')}`,
      { missing, missingOptional: missingOpt })
  }
  if (missing.length > 0) {
    return chk('env_vars', 'warn', `Missing vars (ok in dev): ${missing.join(', ')}`,
      { missing, missingOptional: missingOpt })
  }
  return chk('env_vars', 'pass', 'All required environment variables present',
    { missingOptional: missingOpt })
}

// ── Aggregator ────────────────────────────────────────────────────────────────

export function runAllChecks() {
  const checks = [
    checkBackendHealth(),
    checkDatabase(),
    checkJwtSecret(),
    checkFounderChallenge(),
    checkCorsOrigin(),
    checkVoice(),
    checkPos3Prototype(),
    checkEnvVars(),
  ]

  const summary = {
    pass:  checks.filter(c => c.status === 'pass').length,
    warn:  checks.filter(c => c.status === 'warn').length,
    fail:  checks.filter(c => c.status === 'fail').length,
    total: checks.length,
  }

  const overallStatus = summary.fail > 0 ? 'fail'
                      : summary.warn > 0 ? 'warn'
                      : 'pass'

  return { checks, summary, overallStatus, environment: process.env.NODE_ENV || 'development' }
}
