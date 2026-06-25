import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getVisitProgress } from '../../constants/session.js'

// Each action names the consent field that must be granted before it can run.
// `consentField: null` means the action never leaves the device (a private
// bookmark), so no sharing consent applies to it.
const ACTIONS = [
  { id:'share-stamp',    icon:'share',           label:'Share Your Passport Stamp',     desc:'Send your SmokeCraft 360 certification to guests at the table.',        consentField:'allowShareStamp' },
  { id:'exchange-card',  icon:'contact_page',    label:'Exchange Contact Card',          desc:'Share your digital lounge card with fellow members.',                  consentField:'allowShareContact' },
  { id:'connect-guest',  icon:'person_add',      label:'Connect With Another Guest',     desc:'Add a guest from tonight\'s session to your 360 network.',             consentField:'allowShareName' },
  { id:'scan-qr',        icon:'qr_code_scanner', label:'Use Networking QR Code',         desc:'Let another guest scan your 360 Passport QR to connect.',               consentField:'allowShareStamp' },
  { id:'join-leaderboard',icon:'leaderboard',    label:'Join the Grand Lounge Ranking',  desc:'Enter your session score into tonight\'s leaderboard.',                 consentField:'allowShareSmokeCraftLevel' },
  { id:'follow-venue',   icon:'store',           label:'Follow This Venue',              desc:'Stay connected to this lounge for future events and releases.',        consentField:'allowVenueFollowUp' },
  { id:'mentor-rec',     icon:'recommend',       label:'Save Mentor Recommendation',     desc:'Bookmark your mentor\'s cigar and pairing suggestions (private, on this device only).', consentField:null },
  { id:'cigar-circle',   icon:'groups',          label:'Join the Cigar Circle',          desc:'Connect with the private member circle from tonight\'s session.',      consentField:'allowShareEventStamp' },
  { id:'tasting-note',   icon:'edit_note',       label:'Send a Tasting Note',            desc:'Share a flavor note from tonight with another guest.',                 consentField:'allowShareFavoriteCigarStyle' },
]

const CONSENT_FIELDS = [
  { id:'allowShareStamp',             label:'Share my Passport stamp' },
  { id:'allowShareName',              label:'Share my name' },
  { id:'allowShareContact',           label:'Share my contact card' },
  { id:'allowShareBusinessLinks',     label:'Share my business links' },
  { id:'allowShareSmokeCraftLevel',   label:'Share my SmokeCraft level / score' },
  { id:'allowShareFavoriteCigarStyle',label:'Share my favorite cigar style' },
  { id:'allowShareEventStamp',        label:'Share my event stamp' },
  { id:'allowVenueFollowUp',          label:'Allow this venue to follow up with me' },
]

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const NETWORKING_STATUS_LABELS = {
  not_started:        'Not started',
  consent_required:   'Consent required',
  ready_to_share:      'Ready to share',
  shared_locally:      'Shared locally (demo only)',
  connection_pending:  'Connection pending',
  backend_pending:     'Connection not shared yet',
}

/** Read-only display row used by the Passport Connections summary — shows
 * "Not recorded yet" instead of breaking when a Phase 0-12 field is absent. */
function DetailRow({ label, value, pendingNote }) {
  return (
    <div>
      <dt className="font-label-sm text-label-sm text-on-surface-variant/60 uppercase tracking-widest mb-1" style={{ fontSize: 10 }}>{label}</dt>
      <dd className="font-body-md text-on-surface" style={{ opacity: value ? 1 : 0.45 }}>
        {value || (pendingNote || 'Not recorded yet')}
      </dd>
    </div>
  )
}

/** Per-action status copy — never claims a send/connection that didn't happen. */
function actionStatus(action, consent, recorded) {
  const entry = recorded.find(c => c.actionId === action.id)
  if (entry?.status === 'shared_locally') return 'shared_locally'
  if (!action.consentField) return 'ready_to_share'
  return consent?.[action.consentField] ? 'ready_to_share' : 'consent_required'
}

const STATUS_COPY = {
  not_started:        { label: 'Not started',            color: 'rgba(255,255,255,0.3)' },
  consent_required:    { label: 'Consent required',        color: 'rgba(233,193,118,0.55)' },
  ready_to_share:      { label: 'Ready — tap to share',     color: 'rgba(233,193,118,0.85)' },
  shared_locally:      { label: 'Shared locally (demo)',    color: '#7fd97f' },
}

export default function Connections() {
  const navigate = useNavigate()
  const { session, completeStep, addXP, setNetworkingConsent, recordPassportConnectionAction } = useGuestSession()
  const [proceeded, setProceeded] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)

  const consent = session.smokeCraft?.networkingConsent || {}
  const recorded = session.smokeCraft?.passportConnections || []

  // Phase 13 reads the Phase 12 stamp payload — it already aggregates the
  // full Phase 0-12 journey, so nothing here is re-derived or renamed.
  const latestStamp = (session.smokecraftStamps || []).find(s => s.id === 'passport-stamp') || null
  const networkingStatus = session.smokeCraft?.networkingStatus || 'not_started'

  function toggleConsent(fieldId) {
    triggerHaptic('light')
    setNetworkingConsent({ [fieldId]: !consent[fieldId] })
  }

  function runAction(action) {
    const status = actionStatus(action, consent, recorded)
    if (status === 'consent_required') {
      triggerHaptic('light')
      setConsentOpen(true)
      return
    }
    if (status === 'shared_locally') return // already recorded — no duplicate award
    triggerHaptic('medium')
    // Honest local-only outcome: nothing is actually sent anywhere. No real
    // backend route exists yet for Phase 13 (see docs/backend-readiness-map.md).
    recordPassportConnectionAction(action.id, 'shared_locally')
    addXP(10) // local/demo networking points — not backend-verified
  }

  function handleContinue() {
    if (proceeded) return
    setProceeded(true)
    triggerHaptic('medium')
    completeStep('connections')
    addXP(50)
    navigate('/smokecraft/management-sync')
  }

  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/connections-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/passport-stamp')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <div className="smokecraft-progress-label flex items-center gap-3">
            <span>Round {stepProgress.round} of 3</span>
            <span>Visit {stepProgress.visit} of {stepProgress.totalVisits}</span>
            <span>Session {stepProgress.session} of {stepProgress.totalSessions}</span>
          </div>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:`${(stepProgress.session/24)*100}%` }} /></div>
          <span>360 Connections</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>360 Passport Connections</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:560 }}>Complete any connections you want to make before leaving the lounge. Each action deepens your membership and grows your 360 network.</p>

        {/* Privacy / consent notice — required before any sharing action is enabled */}
        <div className="mb-8 rounded-2xl border px-6 py-5" style={{ borderColor:'rgba(233,193,118,0.3)', background:'rgba(233,193,118,0.06)' }}>
          <div className="flex items-start gap-3 mb-3">
            <span className="material-symbols-outlined text-primary" style={{ fontSize:20 }}>lock</span>
            <p className="font-body-md text-on-surface font-semibold">
              Your SmokeCraft Passport details are only shared when you choose to share them.
            </p>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4" style={{ maxWidth:560 }}>
            Nothing below is sent anywhere automatically. Networking is local/demo only today —
            no SMS or email is sent. Choose what you're willing to share, then tap an action to mark
            it shared on this device.
          </p>
          <button
            type="button"
            onClick={() => setConsentOpen(o => !o)}
            className="font-label-md text-label-md text-primary uppercase tracking-widest underline"
          >
            {consentOpen ? 'Hide sharing preferences' : 'Manage sharing preferences'}
          </button>
          {consentOpen && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONSENT_FIELDS.map(f => (
                <label key={f.id} className="flex items-center gap-3 cursor-pointer select-none">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center"
                    style={{ borderColor: consent[f.id] ? '#e9c176' : 'rgba(255,255,255,0.25)', background: consent[f.id] ? '#e9c176' : 'transparent' }}
                    onClick={() => toggleConsent(f.id)}
                  >
                    {consent[f.id] && <span className="material-symbols-outlined" style={{ fontSize:13, color:'#131314', ...FILL1 }}>check</span>}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant" onClick={() => toggleConsent(f.id)}>{f.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Phase 13 — Passport Connections summary, built from the Phase 12 stamp
            payload (which itself aggregates the preserved Phase 0-11 fields).
            Nothing here is fabricated; every row falls back to "Not recorded yet". */}
        <section className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-6">
          <p className="font-label-sm text-label-sm text-primary/70 uppercase tracking-widest mb-5">Your SmokeCraft 360 Journey</p>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Cigar Identity</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="Cigar" value={latestStamp?.cigarName} />
            <DetailRow label="Country / Origin" value={latestStamp?.cigarCountry} />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Mentor</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="Mentor(s)" value={latestStamp?.mentorNames?.length ? latestStamp.mentorNames.join(', ') : null} />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Tasting Profile</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="First Third Notes" value={latestStamp?.firstThirdNotes} />
            <DetailRow label="Second Third Notes" value={latestStamp?.secondThirdNotes} />
            <DetailRow label="Final Third Notes" value={latestStamp?.finalThirdNotes} />
            <DetailRow label="Pairing Reaction" value={latestStamp?.pairingReaction} />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Strength / Body Profile</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="Strength Progression" value={latestStamp?.strengthProgression} />
            <DetailRow label="Body Progression" value={latestStamp?.bodyProgression} />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Final Outcome</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="Final Rating" value={latestStamp?.finalRating != null ? `${latestStamp.finalRating} / 5` : null} />
            <DetailRow label="Would Smoke Again" value={latestStamp?.wouldSmokeAgain} />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Score, Ranking & Badges</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="Score" value={latestStamp?.score != null ? `${latestStamp.score}${latestStamp.maxScore != null ? ` / ${latestStamp.maxScore}` : ''} pts` : null} />
            <DetailRow label="Ranking" value={latestStamp?.rankingLevel} />
            <DetailRow label="Badge" value={latestStamp?.badgeEarned} />
            <DetailRow label="All Badges" value={latestStamp?.badgesEarned?.length ? latestStamp.badgesEarned.join(', ') : null} />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Passport Stamp Summary</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6" style={{ fontSize: 14 }}>
            <DetailRow label="Venue" value={latestStamp?.venue} />
            <DetailRow label="Event" value={latestStamp?.eventName} />
            <DetailRow label="Date Certified" value={latestStamp?.date ? new Date(latestStamp.date).toLocaleDateString() : null} />
            <DetailRow
              label="Networking Status"
              value={NETWORKING_STATUS_LABELS[networkingStatus] || networkingStatus}
            />
          </dl>

          <p className="font-label-sm text-label-sm text-primary/50 uppercase tracking-widest mb-3" style={{ fontSize: 10 }}>Future Connections</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant/70" style={{ maxWidth: 560 }}>
            Connection not shared yet. Member, cigar, and mentor connections from this session
            will appear here once the 360 member network is live.
          </p>
        </section>

        <div className="flex flex-col gap-3 mb-12">
          {ACTIONS.map(a => {
            const status = actionStatus(a, consent, recorded)
            const copy = STATUS_COPY[status]
            const shared = status === 'shared_locally'
            return (
              <button key={a.id} type="button" onClick={() => runAction(a)}
                className="sc-tactile flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{ padding:'20px 24px', background: shared ? 'rgba(233,193,118,0.08)' : 'rgba(255,255,255,0.03)', borderColor: shared ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: shared ? 'rgba(233,193,118,0.15)' : 'rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize:22, ...(shared ? FILL1 : {}) }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{a.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-1.5">{a.desc}</p>
                  <p className="font-label-sm text-label-sm uppercase tracking-widest" style={{ color: copy.color }}>{copy.label}</p>
                </div>
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: shared ? '#e9c176' : 'rgba(255,255,255,0.2)', background: shared ? '#e9c176' : 'transparent' }}>
                  {shared && <span className="material-symbols-outlined" style={{ fontSize:14,color:'#131314',...FILL1 }}>check</span>}
                  {status === 'consent_required' && <span className="material-symbols-outlined" style={{ fontSize:14,color:'rgba(255,255,255,0.4)' }}>lock</span>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/passport-stamp')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
