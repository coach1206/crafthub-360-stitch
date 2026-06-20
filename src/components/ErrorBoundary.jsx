import { Component } from 'react'

// Catches render-time and lazy-chunk-load errors that would otherwise
// unmount the whole tree and leave a blank screen with no signal why.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[NOVEE OS] Runtime error caught by ErrorBoundary:', error, info)
  }

  handleReload = () => {
    // A stale service-worker cache or a code-split chunk that no longer
    // exists after a redeploy are the most common causes of this — a hard
    // reload re-fetches the current index.html and current chunk hashes.
    window.location.reload()
  }

  // This is a class component, so React Router's useNavigate() hook isn't
  // available here — plain browser navigation also has the benefit of a
  // hard reset of any corrupted in-memory state that caused the crash.
  handleBack = () => {
    window.history.back()
  }

  handleGoTo = (path) => {
    window.location.href = path
  }

  render() {
    if (!this.state.error) return this.props.children

    const buttonStyle = {
      border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.1)',
      color: '#d4af37', borderRadius: 24, padding: '10px 24px', cursor: 'pointer',
      fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
    }

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: '#0a0805', color: '#f1e6c8', padding: 24, textAlign: 'center',
        fontFamily: '"Hanken Grotesk", sans-serif',
      }}>
        <h1 style={{ color: '#d4af37', fontSize: 22, margin: 0 }}>NOVEE OS hit a snag</h1>
        <p style={{ maxWidth: 480, color: '#cbb98f', fontSize: 14, lineHeight: 1.6 }}>
          {this.state.error?.message || 'An unexpected error occurred while loading this screen.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <button onClick={this.handleReload} style={buttonStyle}>Reload</button>
          <button onClick={this.handleBack} style={buttonStyle}>Back</button>
          <button onClick={() => this.handleGoTo('/home')} style={buttonStyle}>Home</button>
          <button onClick={() => this.handleGoTo('/crafthub')} style={buttonStyle}>CraftHub</button>
          <button onClick={() => this.handleGoTo('/smokecraft')} style={buttonStyle}>SmokeCraft</button>
        </div>
      </div>
    )
  }
}
