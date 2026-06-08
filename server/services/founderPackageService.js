/**
 * Founder Package Service — Phase 13
 * Builds the exportable pilot package and system overview data.
 * No credentials, no secrets, no founder controls exposed.
 */

export function buildPilotPackage() {
  return {
    systemName: 'NOVEE OS',
    version:    'Phase 13 — Founder Demo / Pilot Package',
    exportedAt:  new Date().toISOString(),
    disclaimer:  'Prototype system. No live payments. No live POS credentials unless configured. ' +
                 'Venue must follow local tobacco and alcohol laws. Staff controls all service decisions.',

    modules: [
      { name: 'CraftHub 360',            status: 'production-ready', description: 'Central hub routing guests to craft module experiences' },
      { name: 'SmokeCraft 360',           status: 'production-ready', description: 'Premium cigar education journey with mentor voice, flavor profiling, and Passport stamp' },
      { name: '360 Passport Connection',  status: 'production-ready', description: 'Guest relationship data layer — stamps, streaks, leaderboard, session history' },
      { name: 'POS 3',                    status: 'prototype',        description: 'Staff-facing order feed, table status, recommendation previews from guest sessions' },
      { name: 'E.A.T. Command',           status: 'prototype',        description: 'Manager intelligence panel — Environment, Asset, Transaction feeds' },
      { name: 'Mentor Voice',             status: 'production-ready', description: 'ElevenLabs AI voice + Web Speech fallback for mentor guidance' },
      { name: 'Kiosk / Tablet Mode',      status: 'production-ready', description: 'Route-locked kiosk deployment, staff unlock, boot hardening' },
      { name: 'Venue Testing System',     status: 'production-ready', description: 'Phase 12 structured pilot testing, observer notes, readiness score' },
    ],

    pilotTiers: [
      { tier: 'Founder Demo',               commitment: 'None',   hardware: '1 tablet',  duration: '1–2 hours',  description: 'Founder-led demo, no data commitment' },
      { tier: 'Single Tablet Pilot',         commitment: 'Low',    hardware: '1 tablet',  duration: '2–4 weeks',  description: 'Full guest journey, SmokeCraft + Passport' },
      { tier: 'Kiosk Experience Pilot',      commitment: 'Medium', hardware: '1 kiosk',   duration: '4–6 weeks',  description: 'Dedicated kiosk, full kiosk mode' },
      { tier: 'Staff + POS 3 Pilot',         commitment: 'Medium', hardware: '2+ devices',duration: '4–8 weeks',  description: 'Staff + manager devices, POS 3 + E.A.T.' },
      { tier: 'Full Venue Intelligence Pilot',commitment: 'High',  hardware: '3+ devices',duration: '8–12 weeks', description: 'All modules, full data capture, analytics' },
    ],

    requiredHardware: [
      'iPad (10th gen or newer recommended) or Android tablet 10"+',
      'Landscape orientation stand or kiosk enclosure',
      'Stable Wi-Fi (minimum 5 Mbps per device)',
      'Optional: dedicated kiosk display with touch overlay',
    ],

    requiredEnvironment: [
      'Node.js 18+ backend server (or Replit hosting)',
      'PostgreSQL 14+ (or Replit DB)',
      'HTTPS required for PWA install and microphone access',
      'Network access to ElevenLabs API (optional — Web Speech fallback included)',
    ],

    setupSteps: [
      'Deploy NOVEE OS backend to hosting provider',
      'Configure required environment variables (database URL, auth secrets — see deployment guide)',
      'Run database migrations (001–009)',
      'Seed prototype users (npm run seed)',
      'Configure device via /kiosk-setup (manager login)',
      'Run venue test session via /venue-test to establish readiness score',
      'Review VENUE_TEST_CHECKLIST.md and achieve score ≥75 before guest-facing use',
    ],

    staffTrainingSteps: [
      'Staff PIN login walkthrough (STAFF_TRAINING_SCRIPT.md)',
      'POS 3 active orders orientation',
      'Table status and recommendation preview',
      'Kiosk staff unlock procedure',
      'What staff should not access or change',
    ],

    venueTestingSteps: [
      'Manager logs in and navigates to /venue-test',
      'Creates venue test with appropriate test type',
      'Observer runs participants through GUEST_TEST_SCRIPT.md',
      'Observer logs notes and issues in real-time',
      'Session ends, readiness score reviewed',
      'Issues resolved before expanding pilot',
    ],

    prototypeDisclosures: [
      'All POS 3 order data is simulated unless a live provider is configured',
      'E.A.T. Command analytics are prototype data',
      'ElevenLabs voice uses Web Speech fallback unless API key is configured',
      'Passport stamps and leaderboard data are session-local in prototype mode',
      'No live payments at any tier unless explicitly configured',
      'Pricing is placeholder — contact the NOVEE OS team for commercial terms',
    ],

    risks: [
      'Tablet battery life during extended kiosk sessions — use tethered power',
      'Wi-Fi instability — offline mode available for guest journey continuity',
      'Staff familiarity with PIN login — covered in staff training script',
      'Audio in loud environments — mute / read mode available',
    ],

    nextSteps: [
      'Complete PILOT_PACKAGE_CHECKLIST.md',
      'Submit venue information via /pilot-onboarding',
      'Schedule venue test session',
      'Review PILOT_OBSERVER_SCRIPT.md',
      'Contact NOVEE OS team to confirm pilot terms',
    ],
  }
}
