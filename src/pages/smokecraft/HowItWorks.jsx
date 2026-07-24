import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { resolveLandingCta } from '../../constants/smokecraftLandingCta.js'
import { VISIT_STRUCTURE, TOTAL_SESSIONS } from '../../constants/session.js'

const GOLD   = '#E9C176'
const CREAM  = '#e5e2e1'
const GLASS  = 'rgba(8,10,16,0.86)'
const BORDER = 'rgba(233,193,118,0.22)'
const MUTED  = 'rgba(229,226,225,0.6)'

/**
 * HowItWorks — /smokecraft/how-it-works
 *
 * Root-cause fix (Single Build & Live Runtime pass): this route previously
 * rendered `/assets/smokecraft-reference/approved/smokecraft-how-it-works.png`
 * full-screen. Despite living in an "approved" directory, that file is an
 * INTERNAL DESIGN-REFERENCE STORYBOARD, not a user screen — it is literally
 * titled "SMOKECRAFT 360 | STORYBOARD S1 -> S4" and is covered in internal
 * planning labels (S1.1, S1.2, S2.1, S3.1 ... plus "S1 GOAL"/"S2 GOAL"
 * design-intent columns). It was wired into a live production route, so real
 * users saw the team's internal storyboard. It also describes only four
 * stages, contradicting the approved 6-phase / 27-session architecture.
 *
 * The one other candidate visual, `public/assets/smokecraft/session-visuals/
 * HOW IT WORKS.png`, is a genuine user-facing layout but bakes fabricated
 * learner data into its pixels ("Level 2 Aficionado", "1,350 XP to Level 3",
 * "6 of 16" sessions, "4,250 XP", "24 of 1,248"). Shipping it would trade an
 * internal-artwork defect for exactly the fake/stale-learner-data defect this
 * operation exists to eliminate, and "6 of 16" contradicts the 27-session
 * architecture. It is therefore deliberately NOT used.
 *
 * So this screen is built from UI patterns already established in this
 * codebase (the same glass-card / gold-rule / SmokeCraftNavBar vocabulary as
 * RewardsCenter and Leaderboard). No new artwork is introduced. The phase
 * list and session counts are derived from the authoritative VISIT_STRUCTURE
 * registry, never hardcoded, so this screen can never drift from the real
 * architecture. The single "Get Started" action delegates to the EXISTING
 * three-state landing CTA resolver, so it routes to Enrollment, Resume, or
 * the completed-journey review exactly as the Landing screen's primary
 * button does — it is not a second resolver.
 */
export default function HowItWorks() {
  const navigate = useNavigate()
  const cta = resolveLandingCta()

  function handleGetStarted() {
    triggerHaptic('medium')
    navigate(cta.route)
  }

  return (
    <div
      data-testid="smokecraft-how-it-works"
      style={{
        position: 'fixed', inset: 0, overflowY: 'auto',
        background: 'radial-gradient(120% 90% at 50% 0%, #16110c 0%, #060810 60%)',
        fontFamily: 'Georgia, serif', color: CREAM,
      }}
    >
      <div style={{
        maxWidth: 820, margin: '0 auto',
        padding: 'clamp(28px,6vh,56px) clamp(16px,4vw,40px) 140px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <header>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'rgba(233,193,118,0.6)',
            letterSpacing: '0.24em', textTransform: 'uppercase',
          }}>SmokeCraft 360</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(26px,4vw,40px)', color: CREAM, fontWeight: 400 }}>
            How It Works
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: MUTED }}>
            SmokeCraft 360 is a guided cigar experience you move through one session at a
            time. Your journey runs {TOTAL_SESSIONS} sessions across {VISIT_STRUCTURE.length} phases.
            Each session unlocks only once the one before it is complete, so you always know
            exactly where you are and can stop and pick up again whenever you like.
          </p>
        </header>

        <section
          data-testid="how-it-works-phases"
          style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}
        >
          <div style={{
            fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            Your {VISIT_STRUCTURE.length} Phases · {TOTAL_SESSIONS} Sessions
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VISIT_STRUCTURE.map((phase, i) => (
              <li
                key={phase.visit}
                data-phase-index={i + 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                  borderRadius: 10, padding: '12px 16px',
                }}
              >
                <span style={{
                  flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%',
                  border: `1.5px solid ${GOLD}`, color: GOLD, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, color: CREAM }}>{phase.title}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.45)', marginTop: 2 }}>
                    {phase.sessions.length} {phase.sessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 12,
          }}>What You Earn</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Experience points', 'Every session you finish adds real XP to your profile and moves you toward the next rank.'],
              ['Your Passport', 'Completed sessions are stamped into your SmokeCraft Passport as a permanent record of the journey.'],
              ['Rewards', 'Points accumulate in your Reward Center. Venue offers appear there only once your venue connects a real reward catalog.'],
              ['Rankings', 'Your standing appears on the Leaderboard, built from your own real progress.'],
            ].map(([title, body]) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 14, color: CREAM }}>{title}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </section>

        <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic', lineHeight: 1.6 }}>
          Nothing on this page is a preview or a sample — once you begin, every value you see
          is your own real, saved progress.
        </p>
      </div>

      <SmokeCraftNavBar
        primary={cta.isCompleted ? 'View Completed Journey →' : cta.isReturning ? 'Resume Journey →' : 'Get Started →'}
        onPrimary={handleGetStarted}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
